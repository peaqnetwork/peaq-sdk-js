import { BuiltEvmTransactionResult, BuiltCallTransactionResult, EvmTransaction } from './common';
import { SubstrateSendResult, EvmSendResult } from './base';

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
    deployed_address: string;
}

export type MachineStationWriteResult = SubstrateSendResult | EvmSendResult | BuiltEvmTransactionResult | BuiltCallTransactionResult | DeployedSmartAccountResult;

// Transaction data interfaces for when sendTransaction = false
export interface MachineStationTransactionData {
    transaction_data: EvmTransaction;
    message: string;
    machine_station_address: string;
    function: string;
}

export interface UpdateConfigsTransactionData extends MachineStationTransactionData {
    config_key: string;
    config_value: number;
    required_role: string;
}

export interface DeployMachineSmartAccountTransactionData extends MachineStationTransactionData {
    machine_account_owner_address: string;
    required_role: string;
    note: string;
}

export interface TransferMachineStationBalanceTransactionData extends MachineStationTransactionData {
    current_machine_station_address: string;
    new_machine_station_address: string;
    required_role: string;
}

export interface ExecuteTransactionData extends MachineStationTransactionData {
    target: string;
    access_control: string;
}

export interface ExecuteMachineTransactionData extends MachineStationTransactionData {
    machine_account_address: string;
    target: string;
    access_control: string;
}

export interface ExecuteMachineBatchTransactionsData extends MachineStationTransactionData {
    machine_account_addresses: string[];
    targets: string[];
    description: string;
    access_control: string;
}

export interface ExecuteTransferMachineBalanceData extends MachineStationTransactionData {
    machine_account_address: string;
    recipient_address: string;
    required_role: string;
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
    machineSmartAccountOwnerAddress: string;
    nonce: bigint;
    machineStationOwnerSignature: string;
    sendTransaction?: boolean;
}

export interface TransferMachineStationBalanceOptions {
    newMachineStationAddress: string;
    nonce: bigint;
    machineStationOwnerSignature: string;
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
    machineAccountAddress: string;
    target: string;
    calldata: string;
    nonce: bigint;
    refundAmount?: bigint;
    machineStationOwnerSignature: string;
    smartAccountOwnerSignature: string;
    sendTransaction?: boolean;
}

export interface ExecuteMachineBatchTransactionsOptions {
    smartAccountAddresses: string[];
    targets: string[];
    calldataList: string[];
    nonce: bigint;
    refundAmount?: bigint;
    machineNonces?: bigint[];
    machineStationOwnerSignature: string;
    smartAccountOwnerSignatures: string[];
    sendTransaction?: boolean;
}

export interface ExecuteMachineTransferBalanceOptions {
    smartAccountAddress: string;
    recipientAddress: string;
    nonce: bigint;
    machineStationOwnerSignature: string;
    smartAccountOwnerSignature: string;
    sendTransaction?: boolean;
}

// Signature generation options
export interface AdminSignDeployMachineSmartAccountOptions {
    machineSmartAccountOwnerAddress: string;
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
    machineAccountAddress: string;
    target: string;
    calldata: string;
    nonce: bigint;
    refundAmount?: bigint;
}

export interface AdminSignMachineBatchTransactionsOptions {
    smartAccountAddresses: string[];
    targets: string[];
    calldataList: string[];
    nonce: bigint;
    refundAmount?: bigint;
    machineNonces?: bigint[];
}

export interface AdminSignTransferMachineBalanceOptions {
    smartAccountAddress: string;
    recipientAddress: string;
    nonce: bigint;
}

export interface MachineSignMachineTransactionOptions {
    machineAccountAddress: string;
    target: string;
    calldata: string;
    nonce: bigint;
}

export interface MachineSignTransferMachineBalanceOptions {
    smartAccountAddress: string;
    recipientAddress: string;
    nonce: bigint;
} 