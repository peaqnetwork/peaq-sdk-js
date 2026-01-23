import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chain } from '../../src/enums/core';

// Capture constructor calls for each module without importing the real implementations.
const ctorCalls = {
  trex: [] as any[],
  vault: [] as any[],
  mnft: [] as any[],
  cnft: [] as any[],
  onchainid: [] as any[],
};

// Mock address book resolver
const getAddressesMock = vi.fn();
vi.mock('../../src/config/addresses', () => ({
  getAddresses: (...args: any[]) => getAddressesMock(...args),
}));

// Mock each module class that `RWA` instantiates
vi.mock('../../src/modules/trex', () => ({
  TREX: class TREX {
    constructor(...args: any[]) {
      ctorCalls.trex.push(args);
    }
  },
}));

vi.mock('../../src/modules/vault', () => ({
  Vault: class Vault {
    constructor(...args: any[]) {
      ctorCalls.vault.push(args);
    }
  },
}));

vi.mock('../../src/modules/mnft', () => ({
  MachineNFT: class MachineNFT {
    constructor(...args: any[]) {
      ctorCalls.mnft.push(args);
    }
  },
}));

vi.mock('../../src/modules/cnft', () => ({
  ContractNFT: class ContractNFT {
    constructor(...args: any[]) {
      ctorCalls.cnft.push(args);
    }
  },
}));

vi.mock('../../src/modules/onchainid', () => ({
  OnChainID: class OnChainID {
    constructor(...args: any[]) {
      ctorCalls.onchainid.push(args);
    }
  },
}));

describe('RWA SDK initialization (unit)', () => {
  beforeEach(() => {
    getAddressesMock.mockReset();
    ctorCalls.trex.length = 0;
    ctorCalls.vault.length = 0;
    ctorCalls.mnft.length = 0;
    ctorCalls.cnft.length = 0;
    ctorCalls.onchainid.length = 0;
  });

  it('wires chainId, provider, addresses, and module constructors', async () => {
    const providerA = { tag: 'providerA' } as any;
    const addressesA = { tag: 'addressesA' } as any;
    getAddressesMock.mockReturnValue(addressesA);

    const { RWA } = await import('../../src/rwa');
    const sdk = new RWA({ chainId: Chain.AGUNG, provider: providerA });

    expect(getAddressesMock).toHaveBeenCalledTimes(1);
    expect(getAddressesMock).toHaveBeenCalledWith(Chain.AGUNG);

    expect(sdk.chainId).toBe(Chain.AGUNG);
    expect(sdk.provider).toBe(providerA);
    expect(sdk.addresses).toBe(addressesA);

    // Each module should be instantiated with (addresses, provider)
    expect(ctorCalls.trex).toEqual([[addressesA, providerA]]);
    expect(ctorCalls.vault).toEqual([[addressesA, providerA]]);
    expect(ctorCalls.mnft).toEqual([[addressesA, providerA]]);
    expect(ctorCalls.cnft).toEqual([[addressesA, providerA]]);
    expect(ctorCalls.onchainid).toEqual([[addressesA, providerA]]);
  });

  it('uses different address books when chainId differs', async () => {
    const provider = { tag: 'provider' } as any;
    const addresses1 = { tag: 'addresses1' } as any;
    const addresses2 = { tag: 'addresses2' } as any;

    // Return different address books based on the actual chain IDs used by this SDK
    getAddressesMock.mockImplementation((chainId: number) =>
      chainId === Chain.AGUNG ? addresses1 : addresses2
    );

    const { RWA } = await import('../../src/rwa');

    const sdk1 = new RWA({ chainId: Chain.AGUNG, provider });
    const sdk2 = new RWA({ chainId: Chain.PEAQ, provider });

    expect(sdk1.addresses).toBe(addresses1);
    expect(sdk2.addresses).toBe(addresses2);
    expect(getAddressesMock).toHaveBeenNthCalledWith(1, Chain.AGUNG);
    expect(getAddressesMock).toHaveBeenNthCalledWith(2, Chain.PEAQ);
  });
});


