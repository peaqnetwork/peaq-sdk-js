import NFTABI from '../abis/PeaqMachineNFTs.json';
import { getContract } from '../core/getContract';
import type { Runner } from '../core/types';
import type { NetworkAddresses } from '../addresses/index';

export class MachineNFTs {
  private runner: Runner;
  private addresses: NetworkAddresses;
  constructor(runner: Runner, addresses: NetworkAddresses) {
    this.runner = runner;
    this.addresses = addresses;
  }
  contract() {
    return getContract(this.addresses.nfts.peaqMachineNFTs, NFTABI, this.runner);
  }
  mint(to: string, tokenURI: string) {
    return this.contract().mint(to, tokenURI);
  }
}
