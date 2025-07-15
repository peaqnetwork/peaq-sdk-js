import { KeyringPair } from '@polkadot/keyring/types';
import { Wallet } from 'ethers';
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

export enum AuthType {
    SEED = "seed",
    KEYRING_PAIR = "keyring_pair",
    WALLET = "wallet"
}

export interface EvmTransaction {
    to: string;
    data: string;
}

export enum PrecompileAddresses {
    DID = "0x0000000000000000000000000000000000000800",
    STORAGE = "0x0000000000000000000000000000000000000801",
    RBAC = "0x0000000000000000000000000000000000000802",
    IERC20 = "0x0000000000000000000000000000000000000809"
}

export interface CreateInstanceOptions {
    baseUrl: string;
    chainType: ChainType;
    auth?: AuthType;
    machineStation?: boolean;
    didVersion?: DIDVersion;
    keyType?: KeyType;
}

export interface SDKMetadata {
    baseUrl: string;
    chainType: ChainType;
    pair?: KeyringPair | Wallet;
    machineStation: boolean;
    didVersion?: DIDVersion;
    keyType?: KeyType;
}

export interface WrittenTransactionResult {
    message: string
    receipt: object
    unsubscribe?: () => void
}
export interface BuiltCallTransactionResult {
    message: string
    extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult>
}
export interface BuiltEvmTransactionResult {
    message: string
    tx: EvmTransaction
}

export interface EvmTxOptions {
  /** How many blocks to wait before considering a tx "finalized" */
  confirmations?: number;
}
