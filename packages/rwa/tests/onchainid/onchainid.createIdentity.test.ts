// WIP trying to figure out the best structure

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Module under test
import { OnChainID } from '../../src/modules/onchainid';

// Mocks for tx helpers
vi.mock('../utils/txs', async () => {
  return {
    getContract: vi.fn(),
    waitForTx: vi.fn().mockResolvedValue({ hash: '0xreceipt' }),
  };
});

// Local imports after mocks so they receive mocked implementations
import { waitForTx } from '../../src/utils/txs';

// Helpers
const ZERO = '0x0000000000000000000000000000000000000000';

function mockSigner() {
  return {
    getAddress: vi.fn().mockResolvedValue('0x000000000000000000000000000000000000dEaD'),
    provider: {},
  } as any;
}

function makeModule() {
  const addresses: any = {
    onchainid: { idFactory: '0x1111111111111111111111111111111111111111', identity: '0x2222222222222222222222222222222222222222' },
    erc20: { peaq: '0x3333333333333333333333333333333333333333' },
    mnfts: { machineNft: '0x4444444444444444444444444444444444444444' },
    vaults: { factory: '0x5555555555555555555555555555555555555555' },
  };
  const provider = {} as any;
  return new OnChainID(addresses, provider);
}

describe('OnchainID.createIdentity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns exists when identity already present', async () => {
    const admin = mockSigner();
    const module = makeModule();

    // Mock idFactory contract
    const idFactoryStub = {
      getIdentity: vi.fn().mockResolvedValue('0xabcdef0000000000000000000000000000000001'),
      createIdentity: {
        staticCall: vi.fn(),
        populateTransaction: vi.fn(),
      },
    } as any;
    (module as any)._idFactory = () => idFactoryStub;

    const result = await module.createIdentity({ admin, eoa: '0xabcdef0000000000000000000000000000000002', salt: 's1' });

    expect(result.status).toBe('exists');
    expect(result.identity).toBe('0xabcdef0000000000000000000000000000000001');
    expect(waitForTx).not.toHaveBeenCalled();
  });

  it('creates identity when not present and returns receipt', async () => {
    const admin = mockSigner();
    const module = makeModule();

    const getIdentityMock = vi
      .fn()
      .mockResolvedValueOnce(ZERO) // initial check
      .mockResolvedValueOnce('0xabcdef0000000000000000000000000000000003'); // after creation

    const populateTx = { to: '0x1111', data: '0x' } as any;

    const idFactoryStub = {
      getIdentity: getIdentityMock,
      createIdentity: {
        staticCall: vi.fn().mockResolvedValue(undefined),
        populateTransaction: vi.fn().mockResolvedValue(populateTx),
      },
    } as any;
    (module as any)._idFactory = () => idFactoryStub;

    const result = await module.createIdentity({ admin, eoa: '0xabcdef0000000000000000000000000000000002', salt: 's2' });

    expect(getIdentityMock).toHaveBeenCalledTimes(2);
    expect(waitForTx).toHaveBeenCalledWith(admin, populateTx);
    expect(result.status).toBe('created');
    expect(result.identity).toBe('0xabcdef0000000000000000000000000000000003');
    expect(result.receipt).toBeDefined();
  });

  it('throws when missing required fields', async () => {
    const module = makeModule();
    const admin = mockSigner();
    // omit eoa and salt keys entirely to trigger "missing required field(s)"
    // @ts-expect-error - intentionally incomplete args
    await expect(module.createIdentity({ admin })).rejects.toThrow(/createIdentity: missing required field/);
  });
});


