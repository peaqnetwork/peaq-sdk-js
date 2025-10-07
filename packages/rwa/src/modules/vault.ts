import FactoryABI from '../abis/MachineVaultFactory.json';
import VaultABI from '../abis/MachineVault.json';
import { getContract } from '../core/getContract';
import type { Signer } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';

export class Vaults {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  factory(signer: Signer) {
    return getContract(this.addresses.vaults.factoryProxy, FactoryABI, signer);
  }
  at(address: string, signer: Signer) {
    return getContract(address, VaultABI, signer);
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
    signer: Signer;
  }) {
    const f = this.factory(params.signer);
    const tx = await f.createMachineVault(
      params.name,
      params.symbol,
      params.baseURI ?? ''
      // ... rest of params as required
    );
    return tx.wait();
  }
}
