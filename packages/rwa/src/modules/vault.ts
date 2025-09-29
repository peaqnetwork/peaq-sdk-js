import FactoryABI from '../abis/MachineVaultFactory.json';
import VaultABI from '../abis/MachineVault.json';
import { getContract } from '../core/getContract';
import type { Runner } from '../core/types';
import type { NetworkAddresses } from '../addresses/index';

export class Vaults {
  private runner: Runner;
  private addresses: NetworkAddresses;
  constructor(runner: Runner, addresses: NetworkAddresses) {
    this.runner = runner;
    this.addresses = addresses;
  }
  factory() {
    return getContract(this.addresses.vaults.factoryProxy, FactoryABI, this.runner);
  }
  at(address: string) {
    return getContract(address, VaultABI, this.runner);
  }

  /**
   * High-level flow: create new vault + token via the factory
   * (method names/params must match your factory ABI)
   */
  async createVault(params: {
    name: string;
    symbol: string;
    baseURI?: string;
    // ...any other constructor/init params
  }) {
    const f = this.factory();
    const tx = await f.createMachineVault(
      params.name,
      params.symbol,
      params.baseURI ?? ''
      // ... rest of params as required
    );
    return tx.wait();
  }
}
