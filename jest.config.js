const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
  ],
  // Memory and performance optimizations
  maxWorkers: 1, // Run tests serially to avoid resource conflicts
  testTimeout: 180000, // 3 minutes timeout
  // Cleanup configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Force exit to prevent hanging
  forceExit: true,
  // Detect open handles for debugging
  detectOpenHandles: false, // Disable by default, enable for debugging
  // Memory management
  logHeapUsage: false, // Enable for debugging memory issues
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js',
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js'],
};