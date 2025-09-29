import { getAddresses } from './addresses/index';
import { assertChainId } from './core/validate';
import type { SDKInit } from './core/types';
import { TREX } from './modules/trex';
import { Vaults } from './modules/vault';
import { MachineNFTs } from './modules/nfts';
import { OnchainID } from './modules/onchainid';

// expose types for users don't set incorrectly
export { Chain } from './core/types';

export class RWA {
  readonly chainId: number;
  readonly addresses: ReturnType<typeof getAddresses>;
  readonly trex: TREX;
  readonly vaults: Vaults;
  readonly nfts: MachineNFTs;
  readonly onchainid: OnchainID;

  constructor(opts: SDKInit) {
    const base = getAddresses(opts.chainId);
    // allow overrides for power-users / hotfixes
    const merged = opts.overrides?.addresses
      ? ({ ...base, ...opts.overrides.addresses } as typeof base)
      : base;

    this.chainId = opts.chainId;
    this.addresses = merged;

    // Optional: Attempt a runtime guard if runner can reveal chainId (ethers v6 Provider has .getNetwork)
    // Users can also pass chainId directly, which we trust here.
    assertChainId(this.chainId, merged.chainId);

    this.trex = new TREX(opts.runner, merged);
    this.vaults = new Vaults(opts.runner, merged);
    this.nfts = new MachineNFTs(opts.runner, merged);
    this.onchainid = new OnchainID(opts.runner, merged);
  }

  getAddresses() {
    return this.addresses;
  }
}
