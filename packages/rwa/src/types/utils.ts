import { Signer, TransactionRequest, TransactionReceipt } from 'ethers';
import { ConfirmationMode, TransactionStatus } from '../enums/utils';


export interface EvmStatusUpdate {
    hash?: string;
    nonce?: number;
    confirmationMode?: ConfirmationMode;
    status?: TransactionStatus;
    totalConfirmations?: number;
    receipt?: TransactionReceipt;
}

export type TransactionStatusCallback = EvmStatusUpdate | TransactionReceipt;

export interface txOptions {
    mode?: ConfirmationMode;
    confirmations?: number;
    // Custom gas and fee parameters
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}

export interface EvmSendResult {
    txHash: string;
    unsubscribe?: () => void;
    receipt: Promise<TransactionReceipt>;
}