import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2020',
  // DTS emitted via tsc in package build script
  dts: false,
  tsconfig: './tsconfig.json',
  sourcemap: false,
  minify: true,
  clean: true,
  treeshake: true,

  external: [
    'ethers'
  ]
});