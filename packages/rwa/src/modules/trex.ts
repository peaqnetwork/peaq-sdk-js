import type { NetworkAddresses } from '../types/core';
import type { Provider } from 'ethers';


export class TREX {
  private addresses: NetworkAddresses;
  private provider: Provider;

  constructor(addresses: NetworkAddresses, provider: Provider) {
    this.addresses = addresses;
    this.provider = provider;
  }
}