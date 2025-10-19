import type { Signer, TransactionReceipt } from 'ethers';

export type IssueMachineNFT = {
    machineIssuer: Signer;
    alice: Signer;
    metadata: IMachineMetadata;
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