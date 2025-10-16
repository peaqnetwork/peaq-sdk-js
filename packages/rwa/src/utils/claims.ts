import type { GenerateClaim, SignClaim } from '../types/claims';
import { AbiCoder, Contract, keccak256, getBytes } from "ethers";


export async function generateClaim(opts: GenerateClaim){
    const { identity, claimIssuer, topic, data } = opts;
    const uri = 'https://kyc-provider.com/alice/verification';

    return {
        identity: identity,
        issuer: claimIssuer,
        topic: topic,
        scheme: 1,
        data: data,
        uri: uri
    };
  }

  export async function signClaim(opts: SignClaim){
    const { claim, signer } = opts;
    const abiCoder = AbiCoder.defaultAbiCoder();
    const kycData = abiCoder.encode(
      ['address', 'uint256', 'bytes'],
      [claim.identity, claim.topic, claim.data]
    );
    const kycDataHash = keccak256(kycData);
    const kycSignature = await signer.signMessage(
      getBytes(kycDataHash)
    );
  
    return kycSignature;
  }

// async function addClaim(opts: AddClaim){

// }