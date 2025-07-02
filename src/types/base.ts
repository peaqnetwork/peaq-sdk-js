import { Codec } from '@polkadot/types/types';
import { Event, Phase } from '@polkadot/types/interfaces';
import { TransactionResponse } from 'ethers';
import { ISubmittableResult } from '@polkadot/types/types';

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
    type: "broadcast" | "mined" | "confirmations";
    hash: string;
    nonce?: number;
    blockNumber?: number;
    blockHash?: string;
    gasUsed?: string;
    confirmations?: number;
    events?: EvmEvent[];
}

// Unified callback type for both EVM and Substrate transactions
export type TransactionStatusCallback = ISubmittableResult | EvmStatusUpdate;

export interface SubstrateTransactionResult {
    receipt: FormattedReceipt;
    unsubscribe: () => void;
}

export interface SendResult {
    txHash: string;
    unsubscribe: () => void;
    finalize: Promise<FormattedReceipt>;
}

// EVM equivalent of SendResult
export interface EvmSendResult {
    txHash: string;
    unsubscribe?: () => void;
    finalize: Promise<EvmFormattedReceipt>;
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
export interface EvmFormattedReceipt {
    blockNumber: string;
    txHash: string;
    confirmations: number;
    gasUsed: string;
    effectiveGasPrice: string;
    status: number; // 1 for success, 0 for failure
    blockHash: string;
}

export class EvmExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvmExecutionError';
    }
}