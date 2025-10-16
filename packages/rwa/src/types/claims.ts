import type { Signer } from 'ethers';


export interface IClaim {
    identity: string;
    issuer: string;
    topic: number;
    scheme: number;
    data: string;
    uri: string;
  }

export interface GenerateClaim {
    identity: string;
    claimIssuer: string;
    topic: number;
    data: string;
}

export interface SignClaim {
    claim: IClaim;
    signer: Signer;
}



