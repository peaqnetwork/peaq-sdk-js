import type { NetworkAddresses } from '../types/core';
export class TREX {
  private addresses: NetworkAddresses;

  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
}