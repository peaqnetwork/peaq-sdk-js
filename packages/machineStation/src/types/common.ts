import { Signer, TransactionRequest } from 'ethers';

export enum ChainType {
    EVM = "evm",
    SUBSTRATE = "substrate"
}

export enum KeyType {
    ECDSA = "ecdsa",
    SR25519 = "sr25519",
    ED25519 = "ed25519"
}


export enum VerificationMethodType {
    ECDSA = "EcdsaSecp256k1RecoveryMethod2020",
    SR25519 = "Sr25519VerificationKey2020",
    ED25519 = "Ed25519VerificationKey2020"
}
export type EvmTransaction = TransactionRequest;

export enum PrecompileAddresses {
    DID = "0x0000000000000000000000000000000000000800",
    STORAGE = "0x0000000000000000000000000000000000000801",
    RBAC = "0x0000000000000000000000000000000000000802",
    IERC20 = "0x0000000000000000000000000000000000000809"
}
export interface CreateMachineStationInstanceOptions {
    baseUrl: string;
    machineStationAddress: string;
    stationAdmin: Signer;
    stationManager?: Signer;
}

export interface SDKMetadata {
    baseUrl: string;
    chainType: ChainType;
    pair?: Signer;
    machineStation: boolean;
}
export interface BuiltEvmTransactionResult {
    message: string
    tx: EvmTransaction
}

export enum ConfirmationMode {
    FAST = 'FAST',
    CUSTOM = 'CUSTOM',
    FINAL = 'FINAL'
}

export enum TransactionStatus {
    BROADCAST = 'BROADCAST',
    IN_BLOCK = 'IN_BLOCK',
    FINALIZED = 'FINALIZED'
}

export interface txOptions {
    mode?: ConfirmationMode;
    confirmations?: number;
    // Custom gas and fee parameters
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}
