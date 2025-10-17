import type { KYC } from './onchainid';
import type { Signer } from 'ethers';

export interface IClaim {
    identity: string;
    issuer: string;
    topic: number;
    scheme: number;
    data: string;
    uri: string;
}

export type GenerateKycClaim = {
    issuerContract: string;
    kyc: KYC;
    uri: string | null;
}

export type SignClaim = {
    claim: IClaim;
    claimIssuer: Signer;
}