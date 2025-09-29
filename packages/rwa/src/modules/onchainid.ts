import IdentityABI from '../abis/Identity.json';
import IdFactoryABI from '../abis/IdFactory.json';
import VerifierABI from '../abis/Verifier.json';
import { getContract } from '../core/getContract';
import type { Runner } from '../core/types';
import type { NetworkAddresses } from '../addresses/index';

export class OnchainID {
  private runner: Runner;
  private addresses: NetworkAddresses;
  constructor(runner: Runner, addresses: NetworkAddresses) {
    this.runner = runner;
    this.addresses = addresses;
  }
  idFactory() {
    return getContract(this.addresses.onchainid.idFactory, IdFactoryABI, this.runner);
  }
  identityAt(address: string) {
    return getContract(address, IdentityABI, this.runner);
  }
  kycVerifier() {
    return getContract(this.addresses.onchainid.kycVerifier, VerifierABI, this.runner);
  }
  issuerVerifier() {
    return getContract(this.addresses.onchainid.issuerVerifier, VerifierABI, this.runner);
  }
  regulatorVerifier() {
    return getContract(this.addresses.onchainid.regulatorVerifier, VerifierABI, this.runner);
  }
}
