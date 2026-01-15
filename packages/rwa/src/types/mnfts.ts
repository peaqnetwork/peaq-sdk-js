import type { Signer, TransactionReceipt } from 'ethers';

export type IssueMachineNFT = {
    machineValue: bigint;
    machineIssuer: Signer;
    machineOwner: Signer;
    machineNFT: string;
    runSeed: number;
    count?: number;
}

// TODO improve return type
export type IssueMachineNFTResult = {
    result: string;
}
export interface IMachineMetadata {
    brand: string;
    model: string;
    serialNumber: string;
    uri: string;
    timestamp: string;
  }

export type GetMachineDid = {
    machineNFT: string;
    tokenId: string;
}

export type GetMachineDidResult = {
    didDocument: Object;
}