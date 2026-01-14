import type { Signer, TransactionReceipt } from 'ethers';

export type IssueMachineNFT = {
    machineValue: bigint;
    machineIssuer: Signer;
    machineOwner: Signer;
    machineNFT: string;
    // project: string
    // metadataEndpoint: string;
    // metadata: IMachineMetadata;
    runSeed: number;
    count?: number;
    // fees?: Partial<{
    //     feePerMint: bigint;
    //     machineValue: bigint;
    //     nativeDepositPerMint: bigint;
    // }>;
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