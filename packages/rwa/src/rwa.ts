import type { SDKInit, NetworkAddresses } from './types/core';
import { getAddresses } from './config/addresses';

import { OnChainID } from './modules/onchainid';
import { PeaqRwaNft } from './modules/rwa';
import { MachineNft } from './modules/mnft';
import { ContractNft } from './modules/cnft';
import { Vault } from './modules/vault';

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

  readonly onchainid: OnChainID;
  readonly rwa: PeaqRwaNft;
  readonly mnft: MachineNft;
  readonly cnft: ContractNft;
  readonly vault: Vault;

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
    this.onchainid = new OnChainID(this.addresses, this.provider);
    this.rwa = new PeaqRwaNft(this.addresses, this.provider);
    this.mnft = new MachineNft(this.addresses, this.provider);
    this.cnft = new ContractNft(this.addresses, this.provider);
    this.vault = new Vault(this.addresses, this.provider);
  }

  /** Return the resolved address book for this chain. */
  public getAddresses(): NetworkAddresses {
    return this.addresses;
  }
}