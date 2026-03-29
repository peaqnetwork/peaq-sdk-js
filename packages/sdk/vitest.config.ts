// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    globals: false,
    reporters: ['default'],
    testTimeout: 60_000,
  },
});