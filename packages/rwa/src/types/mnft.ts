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
    result: string;
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
    machineNft: string;
    tokenId: string;
}

export type GetMachineDidResult = {
    didDocument: Object;
}