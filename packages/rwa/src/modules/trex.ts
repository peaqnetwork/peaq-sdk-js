import TREXImplementationAuthorityABI from '../abis/TREXImplementationAuthority.json';
import ClaimTopicsRegistryABI from '../abis/ClaimTopicsRegistry.json';
import TrustedIssuersRegistryABI from '../abis/TrustedIssuersRegistry.json';
import IdentityRegistryABI from '../abis/IdentityRegistry.json';




import { getContract } from '../core/getContract';
import type { Signer } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';
import type { AddClaimTopics, TrustIssuerForTopics, RegisterIdentity, AddAgent } from '../types/trex';
export class TREX {
  private addresses: NetworkAddresses;

  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }

  // returns back trexImplementationAuthority contract stored in config (or use provided address)
  trexImplementationAuthority(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.trex.trexImplementationAuthority;
    return getContract(addr, TREXImplementationAuthorityABI, signer);
  }

  claimTopicsRegistry(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.trex.claimTopicsRegistryProxy;
    return getContract(addr, ClaimTopicsRegistryABI, signer);
  }

  trustedIssuersRegistry(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.trex.trustedIssuersRegistryProxy;
    return getContract(addr, TrustedIssuersRegistryABI, signer);
  }

  identityRegistry(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.trex.identityRegistryProxy;
    console.log("Identity Registry Address:", addr);
    return getContract(addr, IdentityRegistryABI, signer);
  }


  async addClaimTopics(opts: AddClaimTopics) {
    const { topics, trexAdmin } = opts;
    const registry = this.claimTopicsRegistry(trexAdmin);
    const receipts = [];

    const existingTopics = await registry.getClaimTopics();
    const seen = new Set(existingTopics.map((et: any) => Number(et).toString()));
    for (const t of topics) {
      const key = Number(t).toString();
      if (seen.has(key)) {
        continue;
      }
      const receipt = await (await registry.addClaimTopic(t)).wait();
      receipts.push(receipt);
      seen.add(key);
    }
    return { receipts };
  }

  async trustIssuerForTopics(opts: TrustIssuerForTopics) {
    const { claimIssuerAddr, topics, trexAdmin } = opts;
    const registry = this.trustedIssuersRegistry(trexAdmin);
    const receipt = await (await registry.addTrustedIssuer(claimIssuerAddr, topics)).wait();
    return { receipt };
  }

  async registerIdentity(opts: RegisterIdentity) {
    const { eoaAddr, identityAddr, country, peaqAgent } = opts;
    const registry = this.identityRegistry(peaqAgent);
    const receipt = await (await registry.registerIdentity(eoaAddr, identityAddr, country)).wait();
    return { receipt };
  }

  async addAgent(opts: AddAgent) {
    const { eoaAddr, trexAdmin } = opts;
    const registry = this.identityRegistry(trexAdmin);
    const receipt = await (await registry.addAgent(eoaAddr)).wait();
    return { receipt };
  }
}