// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx,js,jsx}', 'tests/**/*.test.{ts,tsx,js,jsx}'],
    globals: true,           // so you can use describe/it/expect without importing
    reporters: ['default'],
    testTimeout: 60_000,     // bump for network tests
  },
});