import { execFileSync } from 'node:child_process';
import { parse } from 'dotenv';
import { readFileSync } from 'node:fs';
import pg from 'pg';

/**
 * Runs once before the end-to-end tests: applies migrations to the test database,
 * empties it, and loads the seed so every run starts from the same state.
 */
export default async function setup(): Promise<void> {
  const env = { ...process.env, ...parse(readFileSync('.env.test')) };
  if (!/ecoplus_test/.test(env.DATABASE_URL ?? '')) {
    throw new Error('Refusing to reset a database that is not named ecoplus_test.');
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { env, stdio: 'pipe' });

  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  await client.query(
    'TRUNCATE TABLE users, levels, material_types, warehouses, factories, vehicles RESTART IDENTITY CASCADE',
  );
  await client.end();

  execFileSync('npx', ['tsx', 'prisma/seed.ts'], { env, stdio: 'pipe' });
}
