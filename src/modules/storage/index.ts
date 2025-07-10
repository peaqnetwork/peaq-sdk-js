// external imports
import { ApiPromise, HttpProvider } from '@polkadot/api';
import { ethers, JsonRpcProvider } from 'ethers';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { evmToAddress } from '@polkadot/util-crypto';

// local imports
import { 
    ChainType,
    SDKMetadata,
    BuiltCallTransactionResult,
    BuiltEvmTransactionResult,
    EvmTransaction,
    PrecompileAddresses,
    txOptions
} from '../../types/common';
import { SubstrateSendResult, EvmSendResult, TransactionStatusCallback } from '../../types/base';
import { Base } from '../base';
import { AddItemOptions, RemoveItemOptions, UpdateItemOptions, GetItemOptions, GetItemResult, FunctionSignatures, StorageWriteResult } from '../../types/storage';
import { createStorageKeys, CreateStorageKeysEnum } from '../crypto';

/**
 * Provides methods to interact with the peaq on-chain storage precompile (EVM)
 * or pallet (Substrate). Supports add, get, update, and remove operations.
 */
export class Storage extends Base {
    private abiCoder = new ethers.AbiCoder();

    /**
     * Initializes Storage with a connected API instance and shared SDK metadata.
     * 
     * @param api - The blockchain API connection, which may be ApiPromise (Substrate) or JsonRpcProvider (EVM)
     * @param metadata - Shared metadata, including chain type and optional signer
     */
    constructor(api: ApiPromise | JsonRpcProvider, metadata: SDKMetadata) {
        super(api, metadata);
    }

    /**
     * Adds a new item to peaqStorage under the specified itemType key.
     * 
     * For EVM: Constructs a transaction to the `addItem` storage precompile contract.
     * For Substrate: Composes an `addItem` extrinsic to the peaqStorage pallet.
     * 
     * @param options - The options for adding an item
     * @param options.itemType - The key under which to store the item
     * @param options.item - The value to store (string or any serializable object)
     * @param statusCallback - Optional callback for monitoring transaction status
     * 
     * @returns A promise that resolves to one of:
     * - WrittenTransactionResult: If the transaction was signed and broadcasted
     * - BuiltCallTransactionResult: If on Substrate without a signer
     * - BuiltEvmTransactionResult: If on EVM without a signer
     */
    public async addItem(
        options: AddItemOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<StorageWriteResult> {
        if (!(this.api instanceof ApiPromise || this.api instanceof JsonRpcProvider)) {
            throw new Error('Invalid API instance');
        }

        const { itemType, item } = options;

        if (this.metadata.chainType === ChainType.EVM) {
            return this._addItemEvm(itemType, item, statusCallback, txOptions);
        }
        return this._addItemSubstrate(itemType, item, statusCallback);
    }

    /**
     * Removes an item from peaqStorage by its itemType.
     * 
     * For EVM: Constructs a transaction to the `removeItem` storage precompile contract.
     * For Substrate: Composes a `removeItem` extrinsic to the peaqStorage pallet.
     * 
     * @param options - The options for removing an item
     * @param options.itemType - The key of the item to remove
     * @param statusCallback - Optional callback for monitoring transaction status
     * 
     * @returns A promise that resolves to one of:
     * - WrittenTransactionResult: If the transaction was signed and broadcasted
     * - BuiltCallTransactionResult: If on Substrate without a signer
     * - BuiltEvmTransactionResult: If on EVM without a signer
     */
    public async removeItem(
        options: RemoveItemOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<StorageWriteResult> {
        if (!(this.api instanceof ApiPromise || this.api instanceof JsonRpcProvider)) {
            throw new Error('Invalid API instance');
        }

        const { itemType } = options;

        if (this.metadata.chainType === ChainType.EVM) {
            return this._removeItemEvm(itemType, statusCallback, txOptions);
        }
        return this._removeItemSubstrate(itemType, statusCallback);
    }

    /**
     * Retrieves a stored item by its itemType for the specified address.
     * 
     * For EVM: Method converts the EVM address (either from the local keypair or 
     * the passed address argument) to its Substrate format, then temporarily
     * connects to a Substrate node using the existing baseUrl to fetch the on-chain storage.
     * 
     * For Substrate: Uses the existing Substrate API connection directly.
     * 
     * @param options - The options for retrieving an item
     * @param options.itemType - The key under which the item was stored
     * @param options.address - Optional address whose data is being queried. If not provided,
     *                         the address from the local signer (if any) is used
     * 
     * @returns A promise that resolves to:
     * - GetItemResult: An object with the itemType as key and the stored value as string
     * - null: If the item doesn't exist
     * 
     * @throws Error if:
     * - No address can be determined (no local signer and no address provided)
     */
    public async getItem(
        options: GetItemOptions
    ): Promise<GetItemResult | null> {
        if (!(this.api instanceof ApiPromise || this.api instanceof JsonRpcProvider)) {
            throw new Error('Invalid API instance');
        }

        const { itemType, address = ''} = options;
        if (!itemType) {
            throw new Error('Item Type name is required');
        }

        // If no metadata.pair is set, address must be provided
        if (!this.metadata.pair && !address) {
            throw new Error('Address is required when no signer is set');
        }

        // Get the appropriate address and convert if needed
        let accountAddress = address || this.metadata.pair?.address;
        if (!accountAddress) {
            throw new Error('Address is required');
        }

        // EVM chains: create temporary API connection to read from Substrate
        if (this.metadata.chainType === ChainType.EVM) {
            const substrateAddress = evmToAddress(accountAddress);
            
            const provider = new HttpProvider(this.metadata.baseUrl);
            const tempApi = await ApiPromise.create({ provider });
            
            try {
                return await this._readFromSubstrate(itemType, substrateAddress, tempApi);
            } finally {
                await tempApi.disconnect();
            }
        }

        // For Substrate chains, use direct API access
        const api = this.api as ApiPromise;
        return await this._readFromSubstrate(itemType, accountAddress, api);
    }

    /**
     * Updates an existing item in peaqStorage, replacing the current value with `newItem`.
     * 
     * For EVM: Constructs a transaction to the `updateItem` storage precompile contract.
     * For Substrate: Composes an `updateItem` extrinsic to the peaqStorage pallet.
     * 
     * @param options - The options for updating an item
     * @param options.itemType - The key of the item to update
     * @param options.newItem - The new value to replace the existing stored value
     * @param statusCallback - Optional callback for monitoring transaction status
     * 
     * @returns A promise that resolves to one of:
     * - WrittenTransactionResult: If the transaction was signed and broadcasted
     * - BuiltCallTransactionResult: If on Substrate without a signer
     * - BuiltEvmTransactionResult: If on EVM without a signer
     */
    public async updateItem(
        options: UpdateItemOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<StorageWriteResult> {
        if (!(this.api instanceof ApiPromise || this.api instanceof JsonRpcProvider)) {
            throw new Error('Invalid API instance');
        }

        const { itemType, item } = options;

        if (this.metadata.chainType === ChainType.EVM) {
            return this._updateItemEvm(itemType, item, statusCallback, txOptions);
        }
        return this._updateItemSubstrate(itemType, item, statusCallback);
    }

    /**
     * Helper method to read storage item from Substrate API.
     * 
     * @param itemType - The key under which the item was stored
     * @param ownerAddress - The Substrate address of the owner
     * @param api - The ApiPromise instance to use for querying
     * @returns The storage item result or null if not found
     */
    private async _readFromSubstrate(itemType: string, ownerAddress: string, api: ApiPromise): Promise<GetItemResult | null> {
        const { hashed_key } = createStorageKeys([
            {
                value: ownerAddress,
                type: CreateStorageKeysEnum.ADDRESS,
            },
            { 
                value: itemType,
                type: CreateStorageKeysEnum.STANDARD
            },
        ]);

        const item = await api.query?.['peaqStorage']?.['itemStore'](hashed_key);

        if (!item || item.isStorageFallback) {
            return null;
        }

        return {
            [itemType]: `${item.toHuman()}`,
        };
    }

    // ---------------  EVM helpers ----------------
    private async _addItemEvm(itemType: string, item: any, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<StorageWriteResult> {
        const selector = ethers.keccak256(ethers.toUtf8Bytes(FunctionSignatures.ADD_ITEM)).substring(0, 10);
        const itemTypeBytes = ethers.hexlify(ethers.toUtf8Bytes(itemType));
        const itemString = typeof item === 'string' ? item : JSON.stringify(item);
        const itemBytes = ethers.hexlify(ethers.toUtf8Bytes(itemString));
        
        const params = this.abiCoder.encode(['bytes', 'bytes'], [itemTypeBytes, itemBytes]);
        const tx: EvmTransaction = {
            to: PrecompileAddresses.STORAGE,
            data: params.replace('0x', selector)
        };

        return this._handleEvmTx(tx, `add storage item ${itemType}`, statusCallback, txOptions);
    }

    private async _removeItemEvm(itemType: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<StorageWriteResult> {
        const selector = ethers.keccak256(ethers.toUtf8Bytes(FunctionSignatures.REMOVE_ITEM)).substring(0, 10);
        const itemTypeBytes = ethers.hexlify(ethers.toUtf8Bytes(itemType));
        
        const params = this.abiCoder.encode(['bytes'], [itemTypeBytes]);
        const tx: EvmTransaction = {
            to: PrecompileAddresses.STORAGE,
            data: params.replace('0x', selector)
        };

        return this._handleEvmTx(tx, `remove storage item ${itemType}`, statusCallback, txOptions);
    }

    private async _updateItemEvm(itemType: string, newItem: any, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<StorageWriteResult> {
        const selector = ethers.keccak256(ethers.toUtf8Bytes(FunctionSignatures.UPDATE_ITEM)).substring(0, 10);
        const itemTypeBytes = ethers.hexlify(ethers.toUtf8Bytes(itemType));
        const itemString = typeof newItem === 'string' ? newItem : JSON.stringify(newItem);
        const itemBytes = ethers.hexlify(ethers.toUtf8Bytes(itemString));
        
        const params = this.abiCoder.encode(['bytes', 'bytes'], [itemTypeBytes, itemBytes]);
        const tx: EvmTransaction = {
            to: PrecompileAddresses.STORAGE,
            data: params.replace('0x', selector)
        };

        return this._handleEvmTx(tx, `update storage item ${itemType}`, statusCallback, txOptions);
    }

    // ---------------  Substrate helpers ----------------
    private async _addItemSubstrate(itemType: string, item: any, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<StorageWriteResult> {
        const api = this.api as ApiPromise;
        const call = api.tx?.['peaqStorage']?.['addItem'](itemType, item);
        return this._handleSubstrateTx(call, `add storage item ${itemType}`, statusCallback);
    }

    private async _removeItemSubstrate(itemType: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<StorageWriteResult> {
        const api = this.api as ApiPromise;
        const call = api.tx?.['peaqStorage']?.['removeItem'](itemType);
        return this._handleSubstrateTx(call, `remove storage item ${itemType}`, statusCallback);
    }

    private async _updateItemSubstrate(itemType: string, newItem: any, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<StorageWriteResult> {
        const api = this.api as ApiPromise;
        const call = api.tx?.['peaqStorage']?.['updateItem'](itemType, newItem);
        return this._handleSubstrateTx(call, `update storage item ${itemType}`, statusCallback);
    }

    private async _handleSubstrateTx(call: SubmittableExtrinsic<'promise', ISubmittableResult>, action: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<StorageWriteResult> {
        if (!this.metadata.pair) {
            return { message: `Constructed ${action} call (unsigned).`, extrinsic: call } as BuiltCallTransactionResult;
        }
        try {
            return await this._send_substrate_tx(call, statusCallback);
        } catch (err: any) {
            throw new Error(`Failed to ${action}: ${err?.message ?? err}`);
        }
    }

    private async _handleEvmTx(tx: EvmTransaction, action: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<StorageWriteResult> {
        if (!this.metadata.pair || this.metadata.machineStation) {
            return { message: `Constructed ${action} tx (unsigned).`, tx } as BuiltEvmTransactionResult;
        }
        try {
            // The _send_evm_tx method already handles EVM status updates properly
            return await this._send_evm_tx(tx, statusCallback, txOptions);
        } catch (err: any) {
            // Throw error instead of returning signable extrinsic
            throw new Error(`Failed to ${action}: ${err?.message ?? err}`);
        }
    }
}