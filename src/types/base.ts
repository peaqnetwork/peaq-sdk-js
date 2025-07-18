import { Codec } from '@polkadot/types/types';
import { Event, Phase } from '@polkadot/types/interfaces';
import { TransactionResponse } from 'ethers';
import { ISubmittableResult } from '@polkadot/types/types';
import { TransactionReceipt } from 'ethers';
import { ConfirmationMode, TransactionStatus } from './common';

export interface PeaqEventData {
    lookupName: string;
    data: Codec;
}

export interface PeaqEvent {
    event: Event;
    phase: Phase;
    section: string;
    method: string;
    eventData: PeaqEventData[];
    blockHash?: string;
    error?: {
        documentation: string[];
        name: string;
    } | null;
}

export interface TErrorData {
    dispatchError: {
        Module?: {
            error: string | number;
            index: string | number;
        };
    };
}

// EVM event for status updates (raw format for manual debugging)
export interface EvmEvent {
    address: string;
    addressName?: string;
    topics: readonly string[];
    data: string;
    logIndex?: number;
    transactionIndex?: number;
    removed?: boolean;
}

// EVM status object for callbacks
export interface EvmStatusUpdate {
    hash?: string;
    nonce?: number;
    confirmationMode?: ConfirmationMode;
    status?: TransactionStatus;
    totalConfirmations?: number;
    receipt?: TransactionReceipt;
}

// Unified callback type for both EVM and Substrate transactions
export type TransactionStatusCallback = ISubmittableResult | EvmStatusUpdate | TransactionReceipt;

// export interface SubstrateTransactionResult {
//     receipt: FormattedReceipt;
//     unsubscribe: () => void;
// }

// TODO update with substrate receipt
export interface SubstrateSendResult {
    txHash: string;
    unsubscribe: () => void;
    finalize: Promise<FormattedReceipt>;
}

// EVM equivalent of SendResult
export interface EvmSendResult {
    txHash: string;
    unsubscribe?: () => void;
    receipt: Promise<EvmFormattedReceipt>;
}

export interface FormattedReceipt {
    blockNumber: string;
    txHash: string;
    events: {
        section: string;
        method: string;
        data: any;
    }[];
    status: {
        isFinalized: boolean;
        isInBlock: boolean;
        blockHash?: string;
    };
    dispatchInfo?: {
        weight: any;
        class: string | undefined;
        paysFee: string | undefined;
    };
}

// EVM equivalent of FormattedReceipt
export type EvmFormattedReceipt = TransactionReceipt;

export class EvmExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvmExecutionError';
    }
}