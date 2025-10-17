import type { NetworkAddresses } from '../types/core';

export class MachineNFTs {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
}
