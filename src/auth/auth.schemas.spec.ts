import { loginSchema, registerSchema } from './auth.schemas.js';

const base = { name: 'Sara Test', email: 'sara@example.test', password: 'Test1234!', role: 'citizen' };

describe('registerSchema', () => {
  it('accepts a citizen with an email', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('lowercases and trims the email', () => {
    const r = registerSchema.parse({ ...base, email: '  Sara@Example.TEST ' });
    expect(r.email).toBe('sara@example.test');
  });

  it('needs a phone or an email', () => {
    const { email: _email, ...noContact } = base;
    expect(registerSchema.safeParse(noContact).success).toBe(false);
  });

  it.each(['short1', 'onlyletters', '12345678'])('rejects the weak password %s', (password) => {
    expect(registerSchema.safeParse({ ...base, password }).success).toBe(false);
  });

  it('rejects passwords longer than 72 characters (bcrypt limit)', () => {
    expect(registerSchema.safeParse({ ...base, password: 'a1'.repeat(40) }).success).toBe(false);
  });

  it('does not allow staff roles to self-register', () => {
    for (const role of ['admin', 'driver', 'employee', 'factory']) {
      expect(registerSchema.safeParse({ ...base, role }).success).toBe(false);
    }
  });

  it('requires business details for the business role', () => {
    expect(registerSchema.safeParse({ ...base, role: 'business' }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, role: 'business', businessName: 'Corner Cafe', businessType: 'cafe' }).success,
    ).toBe(true);
  });

  it('rejects a malformed phone number', () => {
    expect(registerSchema.safeParse({ ...base, phone: '12ab' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, phone: '+201000000001' }).success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('needs an identifier and a password', () => {
    expect(loginSchema.safeParse({ identifier: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: '', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: 'a@b.co' }).success).toBe(false);
  });
});
