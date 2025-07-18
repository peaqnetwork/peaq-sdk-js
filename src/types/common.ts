import { KeyringPair } from '@polkadot/keyring/types';
import { Signer, TransactionRequest } from 'ethers';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { DIDVersion } from './did';

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
export interface CreateInstanceOptions {
    baseUrl: string;
    chainType: ChainType;
    auth?: string | KeyringPair | Signer;
    machineStation?: boolean;
    didVersion?: DIDVersion;
    keyType?: KeyType;
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
    pair?: KeyringPair | Signer;
    machineStation: boolean;
    didVersion?: DIDVersion;
    keyType?: KeyType;
}
export interface BuiltCallTransactionResult {
    message: string
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>
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
