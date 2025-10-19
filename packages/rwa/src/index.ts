// types/enums
import type { NetworkAddresses, SDKInit } from './types/core';

// helper function
import { getAddresses } from './config/addresses';

// user facing modules
import { TREX } from './modules/trex';
import { Vaults } from './modules/vault';
import { MachineNFTs } from './modules/mnfts';
import { OnchainID } from './modules/onchainid';

// 3rd party tools
import { type Provider } from 'ethers';

/**
 * Entry point for the RWA SDK.
 * 
 * The Main class serves as the primary interface for interacting with Real World Asset Framework
 * deployed through the TREX module on the PEAQ network.
 * 
 * It provides the base object along with its children modules to interact with the different components of the RWA framework.
 * 
 */
export class RWA {
  readonly chainId: number;
  readonly addresses: ReturnType<typeof getAddresses>;
  readonly provider: Provider;
  readonly trex: TREX;
  readonly vaults: Vaults;
  readonly mnfts: MachineNFTs;
  readonly onchainid: OnchainID;

// TODO think about requiring a proivder in the constructor for reads

  /**
   * Initialize the RWA SDK for a specific chain
   * @type {SDKInit} - The parameter type options for creating an RWA SDK instance
   * @returns {RWA} - The RWA SDK instance
   */
  constructor(opts: SDKInit) {
    this.chainId = opts.chainId;
    this.provider = opts.provider;
    this.addresses = getAddresses(opts.chainId);;

    // initialize modules with addresses only; signer provided per call
    this.trex = new TREX(this.addresses);
    this.vaults = new Vaults(this.addresses, this.provider);
    this.mnfts = new MachineNFTs(this.addresses, this.provider);
    this.onchainid = new OnchainID(this.addresses, this.provider);
  }
  /**
   * Get RWA implementation addresses for the given chain
   * @returns {NetworkAddresses} Addresses per chain
   */
  public getAddresses(): NetworkAddresses {
    return this.addresses;
  }
}


export type { NetworkAddresses } from './types/core';
// type exports
export { SDKInit } from './types/core';
export { Chain } from './enums/core';

// should we created another package and expose the types from there?
export type {
  CreateIdentity,
  CreateIdentityResult,
  IssueKycClaim,
  KYC,
  Person,
  KycClaimResult,
} from './types/onchainid'; // adjust path to where your types live