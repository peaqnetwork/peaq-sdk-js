import IdentityABI from '../abis/Identity.json';
import IdFactoryABI from '../abis/IdFactory.json';
import VerifierABI from '../abis/Verifier.json';
import { getContract } from '../core/getContract';
import { Interface, type Signer } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';
import type { CreateIdentityParams } from '../core/types';

export class OnchainID {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  idFactory(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.idFactory;
    return getContract(addr, IdFactoryABI, signer);
  }
  // identityAt(address: string, signer: Signer) {
  //   return getContract(address, IdentityABI, signer);
  // }
  // kycVerifier(signer: Signer) {
  //   return getContract(this.addresses.onchainid.kycVerifier, VerifierABI, signer);
  // }
  // issuerVerifier(signer: Signer) {
  //   return getContract(this.addresses.onchainid.issuerVerifier, VerifierABI, signer);
  // }
  // regulatorVerifier(signer: Signer) {
  //   return getContract(this.addresses.onchainid.regulatorVerifier, VerifierABI, signer);
  // }

  async createIdentity(opts: CreateIdentityParams): Promise<{ receipt: any; identityAddress?: string }> {
    const { walletAddr, salt, signer } = opts;
    const factory = this.idFactory(signer, this.addresses.onchainid.idFactory);

    const tx = await factory.createIdentity(walletAddr, salt);
    const receipt = await tx.wait();

    try {
      const iface = new Interface(IdFactoryABI);
      let created: string | undefined;
      for (const log of receipt.logs ?? []) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'Deployed' && parsed.args && parsed.args._addr) {
            created = parsed.args._addr as string;
            break;
          }
          if (parsed?.name === 'WalletLinked' && parsed.args && parsed.args.identity) {
            created = parsed.args.identity as string;
            break;
          }
        } catch {}
      }
      return { receipt, identityAddress: created };
    } catch {
      return { receipt };
    }
  }
}
