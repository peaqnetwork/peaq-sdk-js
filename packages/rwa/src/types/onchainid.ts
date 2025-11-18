import type { Signer, TransactionReceipt } from 'ethers';
import type { Claim, IClaim } from './claims';

export type KYC = {
    identity: string;
    data: Person;
}
  
export type Person = {
    name: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
}

export type CreateIdentity = {
    admin: Signer;
    eoa: string;
    salt: string;
}

export type CreateIdentityResult = {
    status: 'created' | 'exists';
    identity: string;
    receipt?: TransactionReceipt;
}

export type GetIdentity = {
    eoa: string;
}

export type GetIdentityResult = {
    status: 'found' | 'not_found';
    identity: string;
}

export type IssueKycClaim = {
    claimIssuer: Signer;
    issuerContract: string;
    identity: string;
    name: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    uri: string | null; // should peaq ever hold a store of URIs?
}

export type KycClaimResult = {
    claim: IClaim;
    signature: string;
}

export type AddClaimToIdentity = {
    identity: string;
    identityOwner: Signer;
    claim: IClaim;
    kycSignature: string;
}

export type AddClaimToIdentityResult = {
    receipt: TransactionReceipt;
}

export type GetClaim = {
    identity: string;
    claimId: string
}

export type GetClaimResult = {
    claim: Claim;
}