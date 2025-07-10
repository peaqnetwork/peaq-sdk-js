import { SubstrateSendResult, EvmSendResult } from '../types/base';
import { BuiltEvmTransactionResult, BuiltCallTransactionResult } from '../types/common';

export interface AddItemOptions {
    itemType: string;
    item: Object;
}

export interface RemoveItemOptions {
    itemType: string;
}

export interface UpdateItemOptions {
    itemType: string;
    item: Object;
}

export interface GetItemOptions {
    itemType: string;
    address?: string;
}

export interface GetItemResult {
    [key: string]: string;
}

export enum FunctionSignatures {
    ADD_ITEM = "addItem(bytes,bytes)",
    GET_ITEM = "getItem(address,bytes)",
    UPDATE_ITEM = "updateItem(bytes,bytes)",
    REMOVE_ITEM = "removeItem(bytes)"
}

export enum StorageOperationType {
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    UPDATE = 'UPDATE'
}

export type StorageOperation = {
    type: StorageOperationType;
    options: AddItemOptions | RemoveItemOptions | UpdateItemOptions;
};

export type StorageWriteResult = SubstrateSendResult | EvmSendResult | BuiltEvmTransactionResult | BuiltCallTransactionResult;
