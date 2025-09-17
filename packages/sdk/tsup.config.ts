import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2020',
  // Keep bundle for default import; types served from dist/esm
  dts: false,
  tsconfig: './tsconfig.json',
  sourcemap: true,
  clean: true,
  treeshake: true,

  external: [
    'ethers',
    '@polkadot/api',
    '@polkadot/keyring',
    '@polkadot/util',
    '@polkadot/util-crypto',
    '@polkadot/types',
    '@polkadot/types-*',
    '@polkadot/rpc-*'
  ]
});