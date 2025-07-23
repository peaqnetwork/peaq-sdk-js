import { BuiltEvmTransactionResult, EvmTransaction } from './common';
import { EvmSendResult } from './base';

// Used for Machine Station Factory Smart Contract
export enum MachineStationFactoryFunctionSignatures {
    UPDATE_CONFIGS = "updateConfigs(bytes32,uint256)",
    DEPLOY_MACHINE_SMART_ACCOUNT = "deployMachineSmartAccount(address,uint256,bytes)",
    TRANSFER_MACHINE_STATION_BALANCE = "transferMachineStationBalance(address,uint256,bytes)",
    EXECUTE_TRANSACTION = "executeTransaction(address,bytes,uint256,uint256,bytes)",
    EXECUTE_MACHINE_TRANSACTION = "executeMachineTransaction(address,address,bytes,uint256,uint256,bytes,bytes)",
    EXECUTE_MACHINE_BATCH_TRANSACTIONS = "executeMachineBatchTransactions(address[],address[],bytes[],uint256,uint256,uint256[],bytes,bytes[])",
    EXECUTE_MACHINE_TRANSFER_BALANCE = "executeMachineTransferBalance(address,address,uint256,bytes,bytes)"
}

// Configuration keys for Machine Station Factory Smart Contract  
export enum MachineStationConfigKeys {
    TX_FEE_REFUND_AMOUNT_KEY = "TX_FEE_REFUND_AMOUNT",
    IS_REFUND_ENABLED_KEY = "IS_REFUND_ENABLED",
    CHECK_REFUND_MIN_BALANCE_KEY = "CHECK_REFUND_MIN_BALANCE", 
    MIN_BALANCE_KEY = "MIN_BALANCE",
    FUNDING_AMOUNT_KEY = "FUNDING_AMOUNT"
}

// Result interfaces
export interface DeployedSmartAccountResult extends EvmSendResult {
    deployedAddress: string;
}

export type MachineStationWriteResult = EvmSendResult | BuiltEvmTransactionResult | DeployedSmartAccountResult;

// Transaction data interfaces for when sendTransaction = false
export interface MachineStationTransactionData {
    transactionData: EvmTransaction;
    message: string;
    machineStationAddress: string;
    function: string;
}

export interface UpdateConfigsTransactionData extends MachineStationTransactionData {
    configKey: string;
    configValue: number;
    requiredRole: string;
}

export interface DeployMachineSmartAccountTransactionData extends MachineStationTransactionData {
    machineOwnerAddress: string;
    requiredRole: string;
    note: string;
}

export interface TransferMachineStationBalanceTransactionData extends MachineStationTransactionData {
    currentMachineStationAddress: string;
    newMachineStationAddress: string;
    requiredRole: string;
}

export interface ExecuteTransactionData extends MachineStationTransactionData {
    target: string;
    accessControl: string;
}

export interface ExecuteMachineTransactionData extends MachineStationTransactionData {
    machineAddress: string;
    target: string;
    accessControl: string;
}

export interface ExecuteMachineBatchTransactionsData extends MachineStationTransactionData {
    machineAddresses: string[];
    targets: string[];
    description: string;
    accessControl: string;
}

export interface ExecuteTransferMachineBalanceData extends MachineStationTransactionData {
    machineAddress: string;
    recipientAddress: string;
    requiredRole: string;
}

// EIP-712 signable message object for frontend signing
export interface EIP712SignableMessage {
    domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: string;
    };
    types: Record<string, Array<{ name: string; type: string }>>;
    message: Record<string, any>;
    primaryType: string;
}

// Input options interfaces
export interface UpdateConfigsOptions {
    key: MachineStationConfigKeys;
    value: bigint;
    sendTransaction?: boolean;
}

export interface DeployMachineSmartAccountOptions {
    machineOwnerAddress: string;
    nonce: bigint;
    stationManagerSignature: string;
    sendTransaction?: boolean;
}

export interface TransferMachineStationBalanceOptions {
    newMachineStationAddress: string;
    nonce: bigint;
    stationAdminSignature: string;
    sendTransaction?: boolean;
}

export interface ExecuteTransactionOptions {
    target: string;
    calldata: string;
    nonce: bigint;
    refundAmount?: bigint;
    machineStationOwnerSignature: string;
    sendTransaction?: boolean;
}

export interface ExecuteMachineTransactionOptions {
    machineAddress: string;
    target: string;
    calldata: string;
    nonce: bigint;
    refundAmount?: bigint;
    machineStationOwnerSignature: string;
    machineOwnerSignature: string;
    sendTransaction?: boolean;
}

export interface ExecuteMachineBatchTransactionsOptions {
    machineAddresses: string[];
    targets: string[];
    calldataList: string[];
    nonce: bigint;
    refundAmount?: bigint;
    machineNonces?: bigint[];
    machineStationOwnerSignature: string;
    machineOwnerSignatures: string[];
    sendTransaction?: boolean;
}

export interface ExecuteMachineTransferBalanceOptions {
    machineAddress: string;
    recipientAddress: string;
    nonce: bigint;
    stationManagerSignature: string;
    machineOwnerSignature: string;
    sendTransaction?: boolean;
}

// Signature generation options
export interface AdminSignDeployMachineSmartAccountOptions {
    machineOwnerAddress: string;
    nonce: bigint;
}

export interface AdminSignTransferMachineStationBalanceOptions {
    newMachineStationAddress: string;
    nonce: bigint;
}

export interface AdminSignTransactionOptions {
    target: string;
    calldata: string;
    nonce: bigint;
    refundAmount?: bigint;
}

export interface AdminSignMachineTransactionOptions {
    machineAddress: string;
    target: string;
    calldata: string;
    nonce: bigint;
    refundAmount?: bigint;
}

export interface AdminSignMachineBatchTransactionsOptions {
    machineAddresses: string[];
    targets: string[];
    calldataList: string[];
    nonce: bigint;
    refundAmount?: bigint;
    machineNonces?: bigint[];
}

export interface AdminSignTransferMachineBalanceOptions {
    machineAddress: string;
    recipientAddress: string;
    nonce: bigint;
}

export interface MachineSignMachineTransactionOptions {
    machineAddress: string;
    target: string;
    calldata: string;
    nonce: bigint;
}

export interface MachineSignTransferMachineBalanceOptions {
    machineAddress: string;
    recipientAddress: string;
    nonce: bigint;
} 