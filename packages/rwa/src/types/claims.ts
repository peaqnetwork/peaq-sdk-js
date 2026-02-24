import type { KYC } from './onchainid';
import type { Signer } from 'ethers';

export type Claim = {
    topic: number;
    scheme: number;
    issuer: string;
    signature: string;
    data: string;
    uri: string;
}

export interface IClaim {
    topic: number;
    scheme: number;
    issuer: string;
    identity: string;
    data: string;
    uri?: string;
}

export type GenerateKycClaim = {
    claimIssuerContract: string;
    kyc: KYC;
    uri: string | null;
}

export type GenerateRoleClaim = {
    subjectIdentity: string;
    claimIssuerContract: string;
    roleTopic: number;
    roleDescription: string;
}

export type SignClaim = {
    claim: IClaim;
    claimIssuer: Signer;
}