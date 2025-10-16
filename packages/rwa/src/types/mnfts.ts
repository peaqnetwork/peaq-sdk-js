import { type Signer, Wallet, Provider } from 'ethers';
import type { IClaim } from './claims'

export interface GenerateRoleClaim {
    identityAddr: string;
    claimIssuerAddr: string;
    topic: number;
    description: string;
    claimIssuerSigner: Signer;
}

export interface AddMachineRegulator {
    regulatorEoaAddr: string;
    peaqMachineNftsSigner: Signer;
}

export interface GetMachineRegulators {
    runner: Provider;
}


export interface AddMachineIssuer {
    issuerEoaAddr: string;
    regulatorSigner: Signer;
}

export interface GetMachineIssuers {
    runner: Provider;
}