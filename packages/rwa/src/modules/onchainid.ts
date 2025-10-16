import IdentityABI from '../abis/Identity.json';
import ImplementationAuthorityABI from '../abis/Identity.json';
import IdFactoryABI from '../abis/IdFactory.json';
import VerifierABI from '../abis/Verifier.json';
import { getContract } from '../core/getContract';
import { ethers, Interface, type Signer, Provider, ZeroAddress } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';
import { generateClaim, signClaim } from '../utils/claims';
import { CT_KYC_APPROVED, CT_MNFT_ISSUER, CT_MNFT_REGULATOR } from '../core/validate';
import type { CreateIdentity, DeployClaimIssuer, MakeClaimIssuerTrusted, AddClaimToIdentity, KycClaim, GetClaim, UnlinkWallet } from '../types/onchainid';


import { AbiCoder, Contract, keccak256, getBytes } from "ethers";

import Artifact from '../abis/ClaimIssuer.json';
const { abi, bytecode } = Artifact;


export class OnchainID {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  
  // returns back Identity contract stored in config (or use provided address)
  identity(signer: Signer | Provider, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.identity;
    return getContract(addr, IdentityABI, signer);
  }

  // returns back ImplementationAuthority contract stored in config (or use provided address)
  implementationAuthority(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.implementationAuthority;
    return getContract(addr, ImplementationAuthorityABI, signer);
  }

  // returns back IdFactory contract stored in config (or use provided address)
  idFactory(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.idFactory;
    return getContract(addr, IdFactoryABI, signer);
  }
  // returns back kycVerifier contract stored in config (or use provided address)
  kycVerifier(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.kycVerifier;
    return getContract(addr, VerifierABI, signer);
  }
  mnftIssuerVerifier(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.mnftIssuerVerifier;
    return getContract(addr, VerifierABI, signer);
  }
  mnftRegulatorVerifier(signer: Signer, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.onchainid.mnftRegulatorVerifier;
    return getContract(addr, VerifierABI, signer);
  }
  

  async createIdentity(opts: CreateIdentity): Promise<{ receipt: any; identityAddress?: string }> {
    const { eoaAddr, salt, idFactorySigner } = opts;
    const factory = this.idFactory(idFactorySigner, this.addresses.onchainid.idFactory);

    const existing = await factory.getIdentity(eoaAddr);
    if (existing && existing !== ZeroAddress) {
      return { receipt: null, identityAddress: existing };
    }

    const tx = await factory.createIdentity(eoaAddr, salt);
    const receipt = await tx.wait();
    // logic to prevent reorgs??

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

  async deployClaimIssuer(opts: DeployClaimIssuer): Promise<{ claimIssuerAddr: any }> {  
    const { claimIssuerSigner } = opts;
    const ClaimIssuerFactory = new ethers.ContractFactory(abi, bytecode, claimIssuerSigner);
    const ownerAddr = await claimIssuerSigner.getAddress();
    const contract = await ClaimIssuerFactory.deploy(ownerAddr);    
    await contract.waitForDeployment();               // waits for mining
    const claimIssuerAddr = await contract.getAddress();
    return { claimIssuerAddr };
  }

  // Maybe split up into 1 funciton, allow each Verifier add separately
  async makeClaimIssuerTrusted(opts: MakeClaimIssuerTrusted){
    const { kycSigner, mnftIssuerSigner, mnftRegulatorSigner, claimIssuerAddr } = opts;

    const kycVerifier = this.kycVerifier(kycSigner);
    const mnftVerifier = this.mnftIssuerVerifier(mnftIssuerSigner);
    const mnftRegulatorVerifier = this.mnftRegulatorVerifier(mnftRegulatorSigner);

    const receipts = [] as any[];
    const tx1 = await kycVerifier.addTrustedIssuer(claimIssuerAddr, [CT_KYC_APPROVED]);
    receipts.push(await tx1.wait());
    const tx2 = await mnftVerifier.addTrustedIssuer(claimIssuerAddr, [CT_KYC_APPROVED, CT_MNFT_ISSUER]);
    receipts.push(await tx2.wait());
    const tx3 = await mnftRegulatorVerifier.addTrustedIssuer(claimIssuerAddr, [CT_KYC_APPROVED, CT_MNFT_REGULATOR]);
    receipts.push(await tx3.wait());

    return { receipts };
  }

  async generateKycClaim(opts: KycClaim) {
    const { identityAddr, claimIssuerAddr, person, claimIssuerSigner } = opts;

    const abiCoder = AbiCoder.defaultAbiCoder();
    const data = keccak256(abiCoder.encode(
        ['string', 'string', 'string', 'string'],
        [person.firstName, person.lastName, person.dateOfBirth, person.placeOfBirth]
    ));
    const claim = await generateClaim({ identity: identityAddr, claimIssuer: claimIssuerAddr, topic: CT_KYC_APPROVED, data: data });

    const signature = await signClaim({ claim, signer: claimIssuerSigner });
    return { claim, signature };
  }

  async addClaimToIdentity(opts: AddClaimToIdentity){
    const { identityAddr, claim, signature, identitySigner } = opts;
    const Identity = this.identity(identitySigner, identityAddr);
    const tx = await Identity.addClaim(claim.topic, claim.scheme, claim.issuer, signature, claim.data, claim.uri);
    const receipt = await tx.wait();
    return { receipt };
  }

  // async unlinkWallet(opts: UnlinkWallet){
  //   const { eoaAddr, idFactorySigner } = opts;
  //   const factory = this.idFactory(idFactorySigner, this.addresses.onchainid.idFactory);
  //   const tx = await factory.unlinkWallet(eoaAddr);
  //   const receipt = await tx.wait();
  //   return { receipt };
  // }

  // async getClaim(opts: GetClaim){
  //   const { claim, signature, runner } = opts;
  //   const Identity = this.identity(runner, claim.identity);
  //   const state = await Identity.getClaim(claim.topic, claim.scheme, claim.issuer, signature, claim.data, claim.uri);
  //   return { state };
  // }

  // async buildKycData(p: {
  //   firstName: string; lastName: string; dateOfBirth: string; placeOfBirth: string
  // }) {
  //   // bytes32 = keccak256(abi.encode(string,string,string,string))
  //   return keccak256(abiCoder.encode(
  //     ["string","string","string","string"],
  //     [p.firstName, p.lastName, p.dateOfBirth, p.placeOfBirth]
  //   ));
  // }
  
  // async signClaimHash(args: {
  //   identityAddr: string; topic: bigint; data: string; issuerSigner: any;
  // }) {
  //   // hash = keccak256(abi.encode(address identity, uint256 topic, bytes data))
  //   const preimage = abiCoder.encode(
  //     ["address", "uint256", "bytes"],
  //     [args.identityAddr, args.topic, args.data]
  //   );
  //   const hash = keccak256(preimage);
  //   return args.issuerSigner.signMessage(getBytes(hash));
  // }
  
  // async addKyc({
  //   identityAddr,
  //   claimIssuerAddr,
  //   person,
  //   issuerSigner,
  //   identityOwner,
  //   uri = "",
  //   topic = CT_KYC_APPROVED,
  //   scheme = 1n,
  // }: AddKycParams) {
  //   // 1) Build claim bytes data (bytes32 hash)
  //   const data = await this.buildKycData(person);
  
  //   // 2) Issuer signs (off-chain)
  //   const signature = await this.signClaimHash({ identityAddr, topic, data, issuerSigner });
  
  //   // 3) Identity owner submits addClaim(...)
  //   const identity = new Contract(identityAddr, IdentityABI, identityOwner);
  //   const tx = await identity.addClaim(topic, scheme, claimIssuerAddr, signature, data, uri);
  //   const receipt = await tx.wait();  // consider confirmations if you want reorg safety
  
  //   return { receipt };
  // }
}
