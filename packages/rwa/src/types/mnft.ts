import type { Signer, TransactionReceipt } from 'ethers';

export type EnsureMachineNftAllowance = {
    machineController: Signer;
    machineNft: string;
    machineValueHuman: string;
    erc20: string;
    tokenDecimals: number;
    machineCount: number;
  }

export type EnsureMachineNftAllowanceResult = {
    status: 'approved' | 'already_sufficient';
    machineNft: string;
    feeToken: string;
    feePerMachine: bigint;
    requiredAllowance: bigint;
    currentAllowance: bigint;
    receipt?: TransactionReceipt;
}

export type IssueMachineNft = {
    machineIssuer: Signer;
    machineNft: string;
    machineValueHuman: string;
    erc20: string;
    tokenDecimals: number;
    machineControllerAddr: string;
    salt: number;
    count: number;
}

// TODO improve return type
export type IssueMachineNftResult = {
    status: 'issued';
    machineNft: string;
    machineIssuer: string;
    machineController: string
    machineValue: {
        human: string;
        units: bigint;
        tokenDecimals: number;
        feeToken: string;
    }
    count: number;
    machines: Array<{
        machineId: string;
        did?: string;
        receipt?: TransactionReceipt;
    }>;
    feesPaid: bigint;
    startingBalance: bigint;
    endingBalance: bigint;
    humanTokenDelta: string;
}

export interface IMachineMetadata {
    brand: string;
    model: string;
    serialNumber: string;
    uri: string;
    timestamp: string;
  }

export type GetMachineDid = {
    machineNft: string;
    tokenId: string;
}

export type GetMachineDidResult = {
    didDocument: Object;
}