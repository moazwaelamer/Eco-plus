import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: parse(readFileSync('.env.test')),
    globalSetup: ['./test/global-setup.ts'],
    // All files share one database, so run them one after another.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
