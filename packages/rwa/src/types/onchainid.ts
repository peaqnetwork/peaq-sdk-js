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
    idFactoryAdmin: Signer;
    subject: string;
    deploymentSalt: string;
}

export type CreateIdentityResult = {
    status: 'created' | 'exists';
    identity: string;
    receipt?: TransactionReceipt;
}

export type GetIdentity = {
    subject: string;
}

export type GetIdentityResult = {
    status: 'found' | 'not_found';
    identity?: string;
}

export type IssueKycClaim = {
    claimIssuerSigner: Signer;
    claimIssuerContract: string;
    subjectIdentity: string;
    name: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    uri: string | null;
}

export type IssueKycClaimResult = {
    claim: IClaim;
    signature: string;
}

export type IssueRoleClaim = {
    claimIssuerSigner: Signer;
    claimIssuerContract: string;
    subjectIdentity: string;
    roleTopic: number;
    roleDescription: string;
}

export type IssueRoleClaimResult = {
    claim: IClaim;
    signature: string;
}

export type AddClaimToIdentity = {
    identityController: Signer;
    subjectIdentity: string;
    claim: IClaim;
    claimSignature: string;
}

export type AddClaimToIdentityResult = {
    status: 'added' | 'updated';
    claimId: string
    receipt: TransactionReceipt;
}

export type GetClaim = {
    subjectIdentity: string;
    claimId: string
}

export type GetClaimResult = {
    claim: Claim;
}

export type RemoveClaimFromIdentity = {
    identityController: Signer;
    subjectIdentity: string;
    claimId: string
}

export type RemoveClaimFromIdentityResult = {
    status: 'removed';
    claimId: string;
    receipt: TransactionReceipt;
}