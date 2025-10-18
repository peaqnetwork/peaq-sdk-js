import type { Signer, TransactionReceipt } from 'ethers';

export type IssueMachineNFT = {
    machineIssuer: Signer;
    alice: Signer;
    metadata: IMachineMetadata;
}

// TODO improve type
export type IssueMachineNFTResult = {
    test1: string;
}


export interface IMachineMetadata {
    brand: string;
    model: string;
    serialNumber: string;
    uri: string;
    timestamp: string;
  }