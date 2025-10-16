import { type Signer, Wallet, Provider } from 'ethers';
import type { IClaim } from './claims'

export interface CreateIdentity {
    eoaAddr: string;
    salt: string;
    idFactorySigner: Signer;
}

export interface DeployClaimIssuer {
    claimIssuerSigner: Signer;
}

export interface MakeClaimIssuerTrusted {
    kycSigner: Signer;
    mnftIssuerSigner: Signer;
    mnftRegulatorSigner: Signer
    claimIssuerAddr: string;
}


export interface PersonData {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
};
  
export interface AddClaimToIdentity {
    identityAddr: string;
    claim: IClaim;
    signature: string;
    identitySigner: Signer;
}

export interface KycClaim {
    identityAddr: string;
    claimIssuerAddr: string;
    person: PersonData;
    claimIssuerSigner: Signer;
}

export interface GetClaim {
    claim: IClaim;
    signature: string;
    runner: Provider;
}

export interface UnlinkWallet {
    eoaAddr: string;
    idFactorySigner: Signer;
}