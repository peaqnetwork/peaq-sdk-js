// types
import type { GenerateKycClaim, SignClaim } from '../types/claims';
import type { IClaim } from '../types/claims';

// claim topics and schemes
import { ClaimTopics } from '../enums/claimTopics';
import { ClaimScheme } from '../enums/claimSchemes';

// 3rd party tools
import { keccak256, AbiCoder, getBytes } from 'ethers';


/**
 * 
 * TODO
 * 
 */
export async function generateKycClaim(opts: GenerateKycClaim): Promise<IClaim> {
    const { issuerContract, kyc, uri } = opts;
    const abiCoder = AbiCoder.defaultAbiCoder();
    const data = keccak256(abiCoder.encode(
        ['string', 'string', 'string', 'string'],
        [kyc.data.name, kyc.data.lastName, kyc.data.dateOfBirth, kyc.data.placeOfBirth]
      )
    );
    return {
      identity: kyc.identity,
      issuer: issuerContract,
      topic: ClaimTopics.CT_KYC_APPROVED,
      scheme: ClaimScheme.ECDSA,
      data: data,
      uri: uri ?? 'https://kyc-provider.com/user/verification'
    }
}

/**
 * 
 * TODO
 * 
 */
export async function signClaim(opts: SignClaim): Promise<string> {
  const { claim, claimIssuer } = opts;
  const abiCoder = AbiCoder.defaultAbiCoder();

  const data = keccak256(abiCoder.encode(
    ['address', 'uint256', 'bytes'],
    [claim.identity, claim.topic, claim.data]
    )
  );
  const signature = await claimIssuer.signMessage(getBytes(data));
  return signature;
}