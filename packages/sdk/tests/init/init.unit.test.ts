import { describe, expect, it } from 'vitest';
import 'dotenv/config';
import { ChainType, Sdk } from '../../src/index';

describe('sdk initialization (unit)', () => {
  it('creates an EVM SDK instance with modules wired PEAQ', () => {
    const sdk = new Sdk({
      baseUrl: process.env.PEAQ_HTTPS!,
      chainType: ChainType.EVM,
    });

    expect(sdk.did).toBeDefined();
    expect(sdk.storage).toBeDefined();
    expect(sdk.stream).toBeDefined();
  });

  it('creates an EVM SDK instance with modules wired AGUNG', () => {
    const sdk = new Sdk({
      baseUrl: process.env.AGUNG_HTTPS!,
      chainType: ChainType.EVM,
    });

    expect(sdk.did).toBeDefined();
    expect(sdk.storage).toBeDefined();
    expect(sdk.stream).toBeDefined();
  });

  it('throws for invalid EVM baseUrl', () => {
    expect(() =>
      new Sdk({
        baseUrl: 'http://invalid-for-evm',
        chainType: ChainType.EVM,
      })
    ).toThrow(/Invalid base URL for EVM chain/);
  });
});
