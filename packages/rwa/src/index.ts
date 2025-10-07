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

    this.chainId = opts.chainId;
    this.addresses = getAddresses(opts.chainId);;

    // Optional: Attempt a runtime guard if runner can reveal chainId (ethers v6 Provider has .getNetwork)
    // Users can also pass chainId directly, which we trust here.
    assertChainId(this.chainId, this.addresses.chainId); // ensure chainId is correct

    // initialize modules with addresses only; signer provided per call
    this.trex = new TREX(this.addresses);
    this.vaults = new Vaults(this.addresses);
    this.nfts = new MachineNFTs(this.addresses);
    this.onchainid = new OnchainID(this.addresses);
  }

  getAddresses() {
    return this.addresses;
  }
}