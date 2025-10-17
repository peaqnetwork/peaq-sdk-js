import { getAddresses } from './addresses/index';
import type { SDKInit } from './types/core';
import { TREX } from './modules/trex';
import { Vaults } from './modules/vault';
import { MachineNFTs } from './modules/mnfts';
import { OnchainID } from './modules/onchainid';

// expose types for users don't set incorrectly
export { SDKInit } from './types/core';
export { Chain } from './enums/core';

export class RWA {
  readonly chainId: number;
  readonly addresses: ReturnType<typeof getAddresses>;
  readonly trex: TREX;
  readonly vaults: Vaults;
  readonly mnfts: MachineNFTs;
  readonly onchainid: OnchainID;

  constructor(opts: SDKInit) {
    this.chainId = opts.chainId;
    this.addresses = getAddresses(opts.chainId);;

    // initialize modules with addresses only; signer provided per call
    this.trex = new TREX(this.addresses);
    this.vaults = new Vaults(this.addresses);
    this.mnfts = new MachineNFTs(this.addresses);
    this.onchainid = new OnchainID(this.addresses);
  }

  getAddresses() {
    return this.addresses;
  }
}