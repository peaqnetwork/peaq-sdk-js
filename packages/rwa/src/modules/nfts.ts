import NFTABI from '../abis/PeaqMachineNFTs.json';
import { getContract } from '../core/getContract';
import type { Signer } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';

export class MachineNFTs {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  contract(signer: Signer) {
    return getContract(this.addresses.nfts.peaqMachineNFTs, NFTABI, signer);
  }
  mint(to: string, tokenURI: string, signer: Signer) {
    return this.contract(signer).mint(to, tokenURI);
  }
}
