import type { Signer, TransactionReceipt } from 'ethers';

export type IssueMachineNFT = {
    machineIssuer: Signer;
    machineOwner: Signer;
    machineNFT: string;
    metadata: IMachineMetadata;
    count?: number;
    fees?: Partial<{
        feePerMint: bigint;
        machineValue: bigint;
        nativeDepositPerMint: bigint;
    }>;
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