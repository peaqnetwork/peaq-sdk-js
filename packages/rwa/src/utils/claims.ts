// types
import type { GenerateKycClaim, SignClaim } from '../types/claims';
import type { IClaim } from '../types/claims';

// claim topics and schemes
import { ClaimTopics } from '../enums/claimTopics';
import { ClaimScheme } from '../enums/claimSchemes';

// 3rd party tools
import { keccak256, AbiCoder, getBytes } from 'ethers';


/**
 * Generates a KYC claim containing name, last name, date of birth and place of birth, along with
 * the URI of the KYC claim.
 * 
 * @type {GenerateKycClaim} - The parameter type options for generating a KYC claim
 * @returns {IClaim} The result of generating a KYC claim
 * 
 */
export async function generateKycClaim(opts: GenerateKycClaim): Promise<IClaim> {
    const { issuerContract, kyc, uri } = opts;
    const abiCoder = AbiCoder.defaultAbiCoder();
    const data = keccak256(abiCoder.encode(
      ['string', 'string', 'string', 'string'],
      [kyc.data.name, kyc.data.lastName, kyc.data.dateOfBirth, kyc.data.placeOfBirth]
    ));
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
 * Signs a KYC claim using the claim issuer's private key.
 * 
 * @type {SignClaim} - The parameter type options for signing a KYC claim
 * @returns {string} The result of signing a KYC claim
 * 
 */
export async function signClaim(opts: SignClaim): Promise<string> {
  const { claim, claimIssuer } = opts;
  const abiCoder = AbiCoder.defaultAbiCoder();

  const kycData = abiCoder.encode(
    ['address', 'uint256', 'bytes'],
    [claim.identity, claim.topic, claim.data]
  );
  const kycDataHash = keccak256(kycData);
  const signature = await claimIssuer.signMessage(
    getBytes(kycDataHash)
  );

  return signature;
}