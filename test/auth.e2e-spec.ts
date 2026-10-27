import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_PASSWORD, createTestApp, uniqueContact } from './helpers.js';

describe('Authentication', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  async function registerCitizen() {
    const contact = uniqueContact();
    const res = await http()
      .post('/auth/register')
      .send({ name: 'Sara Test', ...contact, password: TEST_PASSWORD, role: 'citizen' })
      .expect(201);
    return { contact, body: res.body };
  }

  it('registers a citizen with a profile at the lowest level and returns tokens', async () => {
    const { body } = await registerCitizen();
    expect(body.user.role).toBe('citizen');
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.passwordHash).toBeUndefined();

    const me = await http().get('/me').set('Authorization', `Bearer ${body.accessToken}`).expect(200);
    expect(me.body.citizenProfile.level.name).toBe('Bronze');
    expect(me.body.citizenProfile.totalPoints).toBe(0);
  });

  it('registers a business only with business details', async () => {
    const contact = uniqueContact();
    await http()
      .post('/auth/register')
      .send({ name: 'Cafe Owner', ...contact, password: TEST_PASSWORD, role: 'business' })
      .expect(422);
    await http()
      .post('/auth/register')
      .send({
        name: 'Cafe Owner',
        ...contact,
        password: TEST_PASSWORD,
        role: 'business',
        businessName: 'Corner Cafe',
        businessType: 'cafe',
      })
      .expect(201);
  });

  it('does not let anyone self-register as staff or admin', async () => {
    const res = await http()
      .post('/auth/register')
      .send({ name: 'Mallory', ...uniqueContact(), password: TEST_PASSWORD, role: 'admin' })
      .expect(422);
    expect(res.body.code).toBe('validation_failed');
  });

  it('rejects weak passwords and missing contact with field-level details', async () => {
    const res = await http()
      .post('/auth/register')
      .send({ name: 'Weak', password: 'short', role: 'citizen' })
      .expect(422);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toContain('password');
    expect(fields).toContain('phone');
  });

  it('refuses a second account with the same email', async () => {
    const { contact } = await registerCitizen();
    await http()
      .post('/auth/register')
      .send({ name: 'Copy', email: contact.email, password: TEST_PASSWORD, role: 'citizen' })
      .expect(409);
  });

  it('logs in by email or phone and refuses a wrong password with the same message', async () => {
    const { contact } = await registerCitizen();
    await http().post('/auth/login').send({ identifier: contact.email, password: TEST_PASSWORD }).expect(200);
    await http().post('/auth/login').send({ identifier: contact.phone, password: TEST_PASSWORD }).expect(200);

    const wrong = await http().post('/auth/login').send({ identifier: contact.email, password: 'Wrong1234!' }).expect(401);
    const unknown = await http().post('/auth/login').send({ identifier: 'nobody@example.test', password: 'Wrong1234!' }).expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('protects /me', async () => {
    await http().get('/me').expect(401);
    await http().get('/me').set('Authorization', 'Bearer not-a-token').expect(401);
  });

  it('rotates refresh tokens and revokes every session when an old one is reused', async () => {
    const { body } = await registerCitizen();
    const first = body.refreshToken as string;

    const rotated = await http().post('/auth/refresh').send({ refreshToken: first }).expect(200);
    expect(rotated.body.refreshToken).not.toBe(first);

    // Reusing the old token is treated as theft: it fails and also kills the new token.
    await http().post('/auth/refresh').send({ refreshToken: first }).expect(401);
    await http().post('/auth/refresh').send({ refreshToken: rotated.body.refreshToken }).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const { body } = await registerCitizen();
    await http().post('/auth/logout').send({ refreshToken: body.refreshToken }).expect(204);
    await http().post('/auth/refresh').send({ refreshToken: body.refreshToken }).expect(401);
  });
});
