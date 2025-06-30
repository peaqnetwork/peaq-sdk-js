export interface AddItemOptions {
    itemType: string;
    item: Object;
}

export interface RemoveItemOptions {
    itemType: string;
}

export interface UpdateItemOptions {
    itemType: string;
    newItem: Object;
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