// import NFTABI from '../abis/PeaqMachineNFTs.json';
import { getContract } from '../core/getContract';
import { AbiCoder, Contract, ethers, Provider, Signer, keccak256, getBytes } from 'ethers';
import type { NetworkAddresses } from '../addresses/index';
import IPeaqMachineNFTsABI from '../abis/IPeaqMachineNFTs.json';
import IdentityABI from '../abis/Identity.json';
import type { GenerateRoleClaim, AddMachineRegulator, GetMachineRegulators, AddMachineIssuer, GetMachineIssuers } from '../types/mnfts';
import { generateClaim, signClaim } from '../utils/claims';


export const CT_MNFT_ISSUER = 7n;


export class MachineNFTs {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  // contract(signer: Signer) {
  //   return getContract(this.addresses.nfts.peaqMachineNFTs, NFTABI, signer);
  // }
  // mint(to: string, tokenURI: string, signer: Signer) {
  //   return this.contract(signer).mint(to, tokenURI);
  // }

  ipeaqMachineNfts(runner: Provider | Signer | undefined, factoryAddr?: string) {
    const addr = factoryAddr ?? this.addresses.nfts.ipeaqMachineNfts;
    return getContract(addr, IPeaqMachineNFTsABI, runner);
  }

  async generateRoleClaim(opts: GenerateRoleClaim) {
    const { identityAddr, claimIssuerAddr, topic, description, claimIssuerSigner } = opts;
    const abiCoder = AbiCoder.defaultAbiCoder();
    const data = keccak256(abiCoder.encode(['string'], [description]));
    const claim = await generateClaim({identity: identityAddr, claimIssuer: claimIssuerAddr, topic, data});

    const signature = await signClaim({claim, signer: claimIssuerSigner});
    return { claim, signature };
  }

  async addMachineRegulator(opts: AddMachineRegulator) {
    const { regulatorEoaAddr, peaqMachineNftsSigner } = opts;
    const factory = this.ipeaqMachineNfts(peaqMachineNftsSigner);

    // avoid revert if regulator already exists
    const existing = await factory.getMachineRegulators();
    const exists = (existing || []).some((addr: string) => addr.toLowerCase() === regulatorEoaAddr.toLowerCase());
    if (exists) {
      return { receipt: "Regulator already exists" };
    }

    const tx = await factory.addMachineRegulator(regulatorEoaAddr);
    const receipt = await tx.wait();
    return { receipt };
  }

  async getMachineRegulators(opts: GetMachineRegulators) {
    const { runner } = opts;
    const factory = this.ipeaqMachineNfts(runner);
    const regulators = await factory.getMachineRegulators();
    return { regulators };
  }

  async addMachineIssuer(opts: AddMachineIssuer) {
    const { issuerEoaAddr, regulatorSigner } = opts;
    const factory = this.ipeaqMachineNfts(regulatorSigner);

    const tx = await factory.addMachineIssuer(issuerEoaAddr);
    const receipt = await tx.wait();
    return { receipt };
  }

  async getMachineIssuers(opts: GetMachineIssuers) {
    const { runner } = opts;
    const factory = this.ipeaqMachineNfts(runner);
    const issuers = await factory.getMachineIssuers();
    return { issuers };
  }

//   async getMachineIssuers(provider: Provider | undefined): Promise<{ issuers: string[] }> {
//     // const { walletAddr, salt, signer } = opts;
//     const peaqMachineNFTs = this.ipeaqMachineNfts(provider, this.addresses.nfts.ipeaqMachineNfts);

//     const issuers = await peaqMachineNFTs.getMachineIssuers();
//     // const receipt = await tx.wait();

//     return { issuers };
//   }

//  async genClaim(
//     identity: string,
//     claimIssuer: string,
//     topic: bigint,
//     data: string = ethers.hexlify(new Uint8Array(Number(topic)))  
//   ){
//     let identityKAddr: string;
//     let claimIssuerKAddr: string;
  
//     if (typeof identity === 'string') {
//       identityKAddr = identity;
//     } else {
//       identityKAddr = identity;
//     }
//     if (typeof claimIssuer === 'string') {
//       claimIssuerKAddr = claimIssuer;
//     } else {
//       claimIssuerKAddr = claimIssuer;
//     }
  
//     // TODO: replace with real URI
//     const uri = 'https://kyc-provider.com/alice/verification';
  
//     return {
//       identity: identityKAddr,
//       issuer: claimIssuerKAddr,
//       topic: topic,
//       scheme: 1,
//       data: data,
//       uri: uri
//     };
//   }

//   async genRoleClaim(
//     identity: string,
//     claimIssuer: string,
//     roleTopic: bigint,
//     roleDesc: string
//   ) {
//     const data = abiCoder.encode(['string'], [roleDesc]);
//     const claim = await this.genClaim(identity, claimIssuer, roleTopic, data);
//     return claim;
//   }

//   async signClaimHash(args: {
//     identityAddr: string; topic: bigint; data: string; issuerSigner: any;
//   }) {
//     // hash = keccak256(abi.encode(address identity, uint256 topic, bytes data))
//     const preimage = abiCoder.encode(
//       ["address", "uint256", "bytes"],
//       [args.identityAddr, args.topic, args.data]
//     );
//     const hash = keccak256(preimage);
//     return args.issuerSigner.signMessage(getBytes(hash));
//   }
  
//   async addMachineIssuer(
//     identityAddr: string,
//     identityOwner: Signer,
//     claimIssuerAddr: string,
//     issuerSigner: Signer,
//     topic = CT_MNFT_ISSUER,
//     roleDesc = "Adding Machine Issuer",
//     scheme = 1n,
//   ) {
//     const claim = await this.genRoleClaim(identityAddr, claimIssuerAddr, topic, roleDesc);

//     // 1) Build claim bytes data (bytes32 hash)
  
//     // 2) Issuer signs (off-chain)
//     const { data, uri } = claim;
//     const signature = await this.signClaimHash({ identityAddr, topic, data, issuerSigner });
  
//     // 3) Identity owner submits addClaim(...)
//     const identity = new Contract(identityAddr, IdentityABI, identityOwner);
//     const tx = await identity.addClaim(topic, scheme, claimIssuerAddr, signature, data, uri);
//     const receipt = await tx.wait();  // consider confirmations if you want reorg safety
  
//     return { receipt };
//   }

}
