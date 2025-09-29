import TREXGatewayABI from '../abis/TREXGateway.json';
import TREXFactoryABI from '../abis/TREXFactory.json';
import { getContract } from '../core/getContract';
import type { Runner } from '../core/types';
import type { NetworkAddresses } from '../addresses/index';

export class TREX {
  private runner: Runner;
  private addresses: NetworkAddresses;

  constructor(runner: Runner, addresses: NetworkAddresses) {
    this.runner = runner;
    this.addresses = addresses;
  }

  gateway() {
    return getContract(this.addresses.trex.gateway, TREXGatewayABI, this.runner);
  }

  factory() {
    return getContract(this.addresses.trex.factory, TREXFactoryABI, this.runner);
  }

  // Example convenience: approve a deployer (your vault factory) in gateway
  async approveDeployer(deployer: string) {
    const gw = this.gateway();
    return gw.approveFactory(deployer); // method name per your ABI
  }
}
