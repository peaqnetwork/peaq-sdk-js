import { Codec } from '@polkadot/types/types';
import { Event, Phase } from '@polkadot/types/interfaces';

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

export interface SubstrateTransactionResult {
    receipt: FormattedReceipt;
    unsubscribe: () => void;
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

export class EvmExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvmExecutionError';
    }
}