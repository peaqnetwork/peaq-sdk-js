import TREXGatewayABI from '../abis/TREXGateway.json';
import TREXFactoryABI from '../abis/TREXFactory.json';
import { getContract } from '../core/getContract';
import type { Signer } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';

export class TREX {
  private addresses: NetworkAddresses;

  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }

  gateway(signer: Signer) {
    return getContract(this.addresses.trex.gateway, TREXGatewayABI, signer);
  }

  factory(signer: Signer) {
    return getContract(this.addresses.trex.factory, TREXFactoryABI, signer);
  }

  // Example convenience: approve a deployer (your vault factory) in gateway
  async approveDeployer(deployer: string, signer: Signer) {
    const gw = this.gateway(signer);
    return gw.approveFactory(deployer); // method name per your ABI
  }
}
