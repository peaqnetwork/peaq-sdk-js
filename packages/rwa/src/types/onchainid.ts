import type { Signer, TransactionReceipt } from 'ethers';
import type { IClaim } from './claims';

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

export type KycClaimResult = {
    claim: IClaim;
    signature: string;
}