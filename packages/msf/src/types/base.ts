
import { TransactionReceipt } from 'ethers';
import { ConfirmationMode, TransactionStatus } from './common';

// EVM status object for callbacks
export interface EvmStatusUpdate {
    hash?: string;
    nonce?: number;
    confirmationMode?: ConfirmationMode;
    status?: TransactionStatus;
    totalConfirmations?: number;
    receipt?: TransactionReceipt;
}

export type TransactionStatusCallback = EvmStatusUpdate | TransactionReceipt;

// EVM equivalent of SendResult
export interface EvmSendResult {
    txHash: string;
    unsubscribe?: () => void;
    receipt: Promise<EvmFormattedReceipt>;
}

// EVM equivalent of FormattedReceipt
export type EvmFormattedReceipt = TransactionReceipt;

export class EvmExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvmExecutionError';
    }
}