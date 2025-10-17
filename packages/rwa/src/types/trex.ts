import { type Signer, Wallet, Provider } from 'ethers';

// TODO make types (or see what is preferred; types or interfaces)
export interface AddClaimTopics {
    topics: number [];
    trexAdmin: Signer;
}

export interface TrustIssuerForTopics {
    claimIssuerAddr: string;
    topics: number [];
    trexAdmin: Signer;
}

export interface RegisterIdentity {
    eoaAddr: string;
    identityAddr: string;
    country: number;
    peaqAgent: Signer;
}

export interface AddAgent {
    eoaAddr: string;
    trexAdmin: Signer;
}