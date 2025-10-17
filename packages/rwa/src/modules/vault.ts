import type { NetworkAddresses } from '../types/core';

export class Vaults {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }

}