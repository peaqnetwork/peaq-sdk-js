import type { SDKInit, NetworkAddresses } from './types/core';
import { getAddresses } from './config/addresses';

import { TREX } from './modules/trex';
// import { Vault } from './modules/vault';
import { Vault } from './modules/vaultV2';

import { MachineNFT } from './modules/mnft';
import { ContractNFT } from './modules/cnft';

import { OnChainID } from './modules/onchainid';

import type { Provider } from 'ethers';

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
  readonly addresses: NetworkAddresses;
  readonly provider: Provider;

  readonly trex: TREX;
  readonly vault: Vault;
  readonly mnft: MachineNFT;
  readonly cnft: ContractNFT;
  readonly onchainid: OnChainID;

  /**
   * Initialize the RWA SDK for a specific chain
   * @type {SDKInit} - The parameter type options for creating an RWA SDK instance
   * @returns {RWA} - The RWA SDK instance
   */
  constructor(opts: SDKInit) {
    this.chainId = opts.chainId;
    this.provider = opts.provider;
    this.addresses = getAddresses(opts.chainId);

    // modules: pass provider for reads; writes accept a Signer per method
    this.trex = new TREX(this.addresses, this.provider);
    this.vault = new Vault(this.addresses, this.provider);
    this.mnft = new MachineNFT(this.addresses, this.provider);
    this.cnft = new ContractNFT(this.addresses, this.provider);
    this.onchainid = new OnChainID(this.addresses, this.provider);
  }

  /** Return the resolved address book for this chain. */
  public getAddresses(): NetworkAddresses {
    return this.addresses;
  }
}