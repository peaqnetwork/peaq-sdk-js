import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import { ethers, JsonRpcProvider, Wallet, Signer } from 'ethers';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { hexToU8a, isHex } from '@polkadot/util';
import { BN } from '@polkadot/util';
import { GenericExtrinsic } from '@polkadot/types';
import { AnyTuple } from '@polkadot/types-codec/types';

import { ChainType, SDKMetadata, EvmTransaction, txOptions, KeyType, PrecompileAddresses, ConfirmationMode, TransactionStatus } from '../types/common';
import { FormattedReceipt, PeaqEvent, PeaqEventData, TErrorData, EvmExecutionError, SubstrateSendResult, EvmSendResult, EvmFormattedReceipt, TransactionStatusCallback, EvmStatusUpdate, EvmEvent } from '../types/base';

type Address = string;

/**
 * Provides shared functionality for both EVM and Substrate SDK operations,
 * including signer generation and transaction submission logic.
 */
export abstract class Base {
    private _api: ApiPromise | JsonRpcProvider;
    private _metadata: SDKMetadata;
    private _nonceStore: Map<Address, BN>;

    /**
     * Initializes Base with a connected API instance and shared SDK metadata.
     * 
     * @param api - The blockchain API connection which may be a Web3 (EVM) or ApiPromise (Substrate)
     * @param metadata - Shared metadata, including chain type and optional signer
     */
    constructor(api: ApiPromise | JsonRpcProvider, metadata: SDKMetadata) {
        this._api = api;
        this._metadata = metadata;
        this._nonceStore = new Map();
    }

    /**
     * Allows access to the same api object across the sdk
     */
    protected get api(): ApiPromise | JsonRpcProvider {
        return this._api;
    }

    /**
     * Allows access to the same metadata object across the sdk
     */
    protected get metadata(): SDKMetadata {
        return this._metadata;
    }

    /**
     * Gets the next nonce for an address, managing nonce state to prevent collisions
     */
    protected async _getNonce(address: Address): Promise<BN> {
        if (!(this.api instanceof ApiPromise)) {
            throw new Error('API must be ApiPromise instance for nonce management');
        }

        const api = this.api;
        const onChainNonce: BN = (
            await api.rpc.system.accountNextIndex(address)
        ).toBn() as BN;

        const currentNonce = (
            this._nonceStore.has(address) ? this._nonceStore.get(address) : new BN(0)
        ) as BN;

        // Use the higher of on-chain nonce or our stored nonce to avoid conflicts
        const currentUsedNonce = onChainNonce?.gt(currentNonce) ? onChainNonce : currentNonce;
        // Store the next nonce for future transactions
        const nextNonce = currentUsedNonce?.addn(1);

        this._nonceStore.set(address, nextNonce);
        return currentUsedNonce;
    }

    /**
     * Gets the chain ID for both EVM and Substrate chains
     * @returns Promise<number> - The chain ID as a number
     */
    protected async getChainId(): Promise<number> {
        if (this.metadata.chainType === ChainType.EVM) {
            if (this.api instanceof JsonRpcProvider) {
                const network = await this.api.getNetwork();
                return Number(network.chainId);
            } else {
                throw new Error('EVM chain type requires JsonRpcProvider');
            }
        } else {
            // For Substrate chains, use the eth RPC to get chainId
            if (this.api instanceof ApiPromise) {
                const chainId = await this.api.rpc.eth.chainId();
                return Number(chainId.toString());
            } else {
                throw new Error('Substrate chain type requires ApiPromise');
            }
        }
    }

    /**
     * Sets the signer from auth input - handles Signer, KeyringPair, or string.
     * @param auth - Signer instance (EVM), KeyringPair instance (Substrate), or string (private key/mnemonic)
     * @throws Error if auth is invalid or incompatible with chain type
     */
    protected _setSigner(auth: string | KeyringPair | Signer): KeyringPair | Signer {
        if (!auth) {
            throw new Error('Authorization method is required');
        }

        // If auth is already a Wallet or KeyringPair, validate and use directly
        if (typeof auth !== 'string') {
            if (this.metadata.chainType === ChainType.EVM) {
                this.metadata.pair = auth;
                return auth;
            } else if (this.metadata.chainType === ChainType.SUBSTRATE) {
                this.metadata.pair = auth;
                return auth;
            }
            else {
                throw new Error('Invalid chain type');
            }
        }

        // For string auth, create the appropriate signer based on chain type
        if (this.metadata.chainType === ChainType.EVM) {
            const wallet = new ethers.Wallet(auth);
            this.metadata.pair = wallet;
            return wallet;
        } else {
            // Substrate - use the specified key type or default to sr25519
            const selectedKeyType = this.metadata.keyType || KeyType.SR25519;
            
            // Map KeyType enum to Polkadot keyring type string
            const keyringType = selectedKeyType === KeyType.ED25519 ? 'ed25519' : 'sr25519';
            
            const keyring = new Keyring({ type: keyringType, ss58Format: 42 });
            const pair = keyring.addFromMnemonic(auth);
            this.metadata.pair = pair;
            return pair;
        }
    }

    /**
     * Enhanced substrate transaction with fire-and-forget and live-status modes
     */
    protected async _submitSubstrateTransaction(
        call: SubmittableExtrinsic<"promise", ISubmittableResult>,
        onStatus?: (result: TransactionStatusCallback) => void | Promise<void>
    ): Promise<SubstrateSendResult> {
        if (!this.metadata.pair) {
            throw new Error('No keypair available for signing');
        }

        if (!(this.api instanceof ApiPromise)) {
            throw new Error('API must be ApiPromise instance for Substrate transactions');
        }

        const keyPair = this.metadata.pair as KeyringPair;

        // Get managed nonce
        const nonce = await this._getNonce(keyPair.address);

        // Extract finalization logic to separate method
        const finalizeResult = this._signAndMonitorSubstrateTx(call, keyPair, nonce, onStatus);

        return new Promise<SubstrateSendResult>(async (resolveMain, rejectMain) => {
            let hasReturned = false;

            // Handle cases where finalize rejects before we return
            finalizeResult.catch((error) => {
                if (!hasReturned) {
                    rejectMain(error);
                }
            });

            try {
                // Wait for the first status update to get the transaction hash
                const { txHash, unsubscribe, receipt } = await finalizeResult;
                
                if (!hasReturned) {
                    hasReturned = true;
                    resolveMain({
                        txHash,
                        unsubscribe,
                        finalize: Promise.resolve(receipt)
                    });
                }
            } catch (error: any) {
                if (!hasReturned) {
                    rejectMain(error);
                }
            }
        });
    }

    /**
     * Signs and monitors a Substrate transaction
     */
    private async _signAndMonitorSubstrateTx(
        call: SubmittableExtrinsic<"promise", ISubmittableResult>,
        keyPair: KeyringPair,
        nonce: BN,
        onStatus?: (result: TransactionStatusCallback) => void | Promise<void>
    ): Promise<{ txHash: string; unsubscribe: () => void; receipt: FormattedReceipt }> {
        return new Promise<{ txHash: string; unsubscribe: () => void; receipt: FormattedReceipt }>(async (resolve, reject) => {
            let unsub: (() => void) | null = null;
            let actualTxHash: string = '';

            try {
                // Sign the transaction first
                await this._signSubstrateTx(call, keyPair, nonce);

                // Send and monitor the transaction
                unsub = await call.send(async (result: ISubmittableResult) => {
                    try {
                        // Capture the real transaction hash from the first result
                        if (!actualTxHash && result.txHash) {
                            actualTxHash = result.txHash.toHex();
                        }
                        
                        // Forward status to user callback if provided
                        if (onStatus) {
                            onStatus(result);
                        }

                        // Check for early failures when inBlock
                        if (result.status.isInBlock) {
                            await this._checkForSubstrateErrors(result);
                        }

                        // Handle finalization
                        if (result.status.isFinalized) {
                            const receipt = this._formatReceipt(result);
                            resolve({
                                txHash: actualTxHash,
                                unsubscribe: () => unsub && unsub(),
                                receipt
                            });
                        } 
                        // Handle error states
                        else if (result.status.isInvalid || result.status.isDropped) {
                            reject(new Error(
                                result.status.isInvalid
                                    ? "Transaction is invalid"
                                    : "Transaction was dropped"
                            ));
                        }
                    } finally {
                        // Ensure unsub is called regardless of how the callback exits
                        unsub && unsub();
                    }
                });
            } catch (error: any) {
                if (unsub) unsub();
                reject(error);
            }
        });
    }

    /**
     * Signs a Substrate transaction
     */
    private async _signSubstrateTx(
        call: SubmittableExtrinsic<"promise", ISubmittableResult>,
        keyPair: KeyringPair,
        nonce: BN
    ): Promise<void> {
        await call.signAsync(keyPair, { nonce });
    }

    /**
     * Checks for Substrate transaction errors
     */
    private async _checkForSubstrateErrors(result: ISubmittableResult): Promise<void> {
        const blockHash = result.status.asInBlock.toString();
        
        // Check for extrinsic failures early to fail fast
        const events = result.events;
        const peaqEvents = events.map(({ event, phase }) => {
            const { section, method, data } = event;
            const eventData: PeaqEventData = { lookupName: method, data: data };
            return {
                event,
                phase,
                section,
                method,
                eventData: [eventData],
                blockHash: blockHash
            } as PeaqEvent;
        });

        // Check for any failed extrinsics
        const extrinsicFailedEvents = peaqEvents.filter(peaqEvent => peaqEvent.method === "ExtrinsicFailed");
        if (extrinsicFailedEvents.length > 0) {
            const eventData = extrinsicFailedEvents[0].eventData[0];
            const errorResp = await this._transactionError(extrinsicFailedEvents[0].method, eventData);
            throw new Error(`${errorResp?.name} for ${errorResp?.section}.`);
        }
    }



    // used for substrate txs
    protected _formatReceipt(receipt: ISubmittableResult): FormattedReceipt {
        const blockNumber = (receipt as any).blockNumber;
        return {
            blockNumber: blockNumber?.toString() || '',
            txHash: receipt.txHash.toHex(),
            events: receipt.events.map(({ event }) => ({
                section: event.section,
                method: event.method,
                data: event.data.toHuman()
            })),
            status: {
                isFinalized: receipt.status.isFinalized,
                isInBlock: receipt.status.isInBlock,
                blockHash: receipt.status.isInBlock ? receipt.status.asInBlock.toHex() : 
                          receipt.status.isFinalized ? receipt.status.asFinalized.toHex() : 
                          undefined
            },
            dispatchInfo: receipt.dispatchInfo ? {
                weight: receipt.dispatchInfo.get('weight')?.toHuman(),
                class: receipt.dispatchInfo.get('class')?.toString(),
                paysFee: receipt.dispatchInfo.get('paysFee')?.toString()
            } : undefined
        };
    }

    // used for substrate txs
    protected async _transactionError(
        method: string,
        eventData: PeaqEventData
    ): Promise<{ documentation: string[]; name: string, section: string } | null> {
        // Extract repeated fallback object to constant for better maintainability
        const UNKNOWN_ERROR = {
            documentation: ['Unknown error'],
            name: 'UnknownError',
            section: 'UnknownSection'
        };

        const failedEvent = method === 'ExtrinsicFailed';
        const api = this.api;
        if (!(api instanceof ApiPromise)) {
            throw new Error('API must be ApiPromise instance for transaction error handling');
        }

        if (failedEvent) {
            const error = eventData;
            const errorData = error?.data?.toHuman?.() as TErrorData | undefined;
            const errorIdx = errorData?.dispatchError.Module?.error;
            const moduleIdx = errorData?.dispatchError.Module?.index;

            if (errorIdx && moduleIdx) {
                try {
                    const decode = api.registry.findMetaError({
                        error: isHex(errorIdx) ? hexToU8a(errorIdx) : new BN(errorIdx),
                        index: new BN(moduleIdx),
                    });
                    return {
                        documentation: decode.docs,
                        name: decode.name,
                        section: decode.section
                    };
                } catch (error) {
                    return UNKNOWN_ERROR;
                }
            }
        }
        
        return UNKNOWN_ERROR;
    }

    /**
     * Get a readable name for precompile addresses
     */
    private _getPrecompileName(address: string): string {
        const addr = address.toLowerCase();
        switch (addr) {
            case PrecompileAddresses.DID.toLowerCase():
                return "DID";
            case PrecompileAddresses.STORAGE.toLowerCase():
                return "STORAGE";
            case PrecompileAddresses.RBAC.toLowerCase():
                return "RBAC";
            case PrecompileAddresses.IERC20.toLowerCase():
                return "IERC20";
            default:
                return address;
        }
    }

    /**
     * Convert ethers logs to our EvmEvent format with basic info and precompile names
     */
    private _formatEvmLogs(logs: readonly ethers.Log[]): EvmEvent[] {
        return logs.map(log => ({
            address: log.address,
            addressName: this._getPrecompileName(log.address),
            topics: log.topics,
            data: log.data,
            logIndex: log.index,
            transactionIndex: log.transactionIndex
        }));
    }


    // Add this helper function before the _executeEvmTransaction method
    private _parseEvmError(error: any): string {
        if (!error) return 'Unknown error occurred';

        // Check if it's a revert error with a message
        if (error.reason) {
            // Extract message from Some("...") pattern
            const someMessageMatch = error.reason.match(/Some\("([^"]+)"\)/);
            if (someMessageMatch) {
                return someMessageMatch[1];
            }
            return error.reason;
        }

        // Handle other common error cases
        if (error.code === 'INSUFFICIENT_FUNDS') {
            return 'Insufficient funds to complete the transaction';
        }
        if (error.code === 'NONCE_EXPIRED') {
            return 'Transaction nonce has expired. Please try again';
        }
        if (error.code === 'REPLACEMENT_UNDERPRICED') {
            return 'Gas price too low to replace pending transaction';
        }

        // If we can't parse it specifically, return the message or toString()
        return error.message || error.toString();
    }

    /**
     * Enhanced EVM transaction with fire-and-forget and live-status modes
     */
    protected async _executeEvmTransaction(
        unsignedTx: EvmTransaction,
        onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
        opts: txOptions = {}
    ): Promise<EvmSendResult> {
        if (!(this.api instanceof JsonRpcProvider)) {
            throw new EvmExecutionError('API must be JsonRpcProvider instance for EVM transactions');
        }
    
        if (!this.metadata.pair) {
            throw new EvmExecutionError('No signer available for signing');
        }
        
        const provider = this.api;
        const signer = (this.metadata.pair as Signer).connect(provider);

        // Handle confirmation modes
        const mode = opts.mode ?? ConfirmationMode.FAST;
        let targetConfirmations = 1;  // Default to 1 for FAST mode
        
        if (mode === ConfirmationMode.CUSTOM) {
            if (!opts.confirmations) {
                throw new Error('confirmations must be set when using ConfirmationMode.CUSTOM');
            }
            targetConfirmations = opts.confirmations;
        }
    
        return new Promise<EvmSendResult>(async (resolveMain, rejectMain) => {
            let cancelled = false;
            
            const receipt = new Promise<EvmFormattedReceipt>(async (resolve, reject) => {
                try {
                    // Build and send transaction
                    const tx = await this._buildEvmTx(unsignedTx, signer, opts);
                    const txResponse = await signer.sendTransaction(tx);
                    
                    // Return immediately with transaction hash
                    resolveMain({
                        txHash: txResponse.hash,
                        unsubscribe: onStatus ? () => { cancelled = true; } : undefined,
                        receipt,
                        // confirmationMode: mode
                    });
    
                    // Emit broadcast status
                    this._emitStatusCallback(onStatus, cancelled, {
                        status: TransactionStatus.BROADCAST,
                        confirmationMode: mode,
                        totalConfirmations: 0,
                        hash: txResponse.hash,
                        nonce: txResponse.nonce
                    });
    
                    // Wait for first confirmation
                    const inclusionReceipt = await txResponse.wait();
                    if (!inclusionReceipt) {
                        throw new Error('Transaction receipt not found');
                    }
    
                    if (inclusionReceipt.status === 0) {
                        throw new EvmExecutionError('Transaction failed');
                    }

                    // Emit in-block status
                    this._emitStatusCallback(onStatus, cancelled, {
                        status: TransactionStatus.IN_BLOCK,
                        confirmationMode: mode,
                        totalConfirmations: 1,
                        receipt: inclusionReceipt,
                        hash: txResponse.hash
                    });

                    // Wait for confirmations based on mode
                    const userReceipt = await this._waitForConfirmations(
                        txResponse, 
                        inclusionReceipt, 
                        mode, 
                        targetConfirmations, 
                        provider, 
                        onStatus, 
                        cancelled
                    );

                    resolve(userReceipt);
                } catch (error: any) {
                    // Gas estimation errors should be thrown immediately
                    if (error.code === 'CALL_EXCEPTION') {
                        const errorMessage = this._parseEvmError(error);
                        return reject(new EvmExecutionError(errorMessage));
                    }
                    
                    reject(error);
                }
            });
    
            // Handle cases where finalize rejects before we return
            receipt.catch((error) => {
                rejectMain(error);
            });
        });
    }

    /**
     * Builds an EVM transaction with gas estimation and fee calculation
     */
    private async _buildEvmTx(
        unsignedTx: EvmTransaction, 
        signer: Signer, 
        opts: txOptions
    ): Promise<any> {
        const provider = this.api as JsonRpcProvider;
        const address = signer.getAddress();

        // Estimate gas as source of truth
        const estimatedGasLimit = await provider.estimateGas({
            from: address,
            to: unsignedTx.to,
            data: unsignedTx.data ?? '0x',
        });

        // Get current fee data for EIP-1559
        const feeData = await provider.getFeeData();
        
        // Use custom values if provided, otherwise use network defaults
        const maxFeePerGas = opts.maxFeePerGas ?? feeData.maxFeePerGas;
        const maxPriorityFeePerGas = opts.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas;
        const gasLimit = opts.gasLimit ?? estimatedGasLimit;
        
        // Build EIP-1559 transaction
        return {
            to: unsignedTx.to,
            data: unsignedTx.data ?? '0x',
            gasLimit,
            type: 2, // EIP-1559 transaction type
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    }

    /**
     * Emits status callback if provided and not cancelled
     */
    private _emitStatusCallback(
        onStatus: ((result: TransactionStatusCallback) => void | Promise<void>) | undefined,
        cancelled: boolean | undefined,
        statusUpdate: TransactionStatusCallback
    ): void {
        if (onStatus && !cancelled) {
            onStatus(statusUpdate);
        }
    }

    /**
     * Waits for confirmations based on the specified mode
     */
    private async _waitForConfirmations(
        txResponse: any,
        inclusionReceipt: any,
        mode: ConfirmationMode,
        targetConfirmations: number,
        provider: JsonRpcProvider,
        onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
        cancelled?: boolean
    ): Promise<EvmFormattedReceipt> {
        const inclusionBlock = inclusionReceipt.blockNumber;

        switch (mode) {
            case ConfirmationMode.FAST:
                // Already have 1 confirmation, nothing more needed
                return inclusionReceipt;

            case ConfirmationMode.CUSTOM:
                // Wait for user's target confirmations
                const startingFinalized = await provider.getBlock("finalized");
                if (!startingFinalized) {
                    throw new Error("Could not fetch finalized head");
                }

                const customReceipt = await txResponse.wait(targetConfirmations);
                if (!customReceipt) {
                    throw new Error('Could not get receipt after waiting for confirmations');
                }
                
                // Validate the receipt is still canonical to guard against chain reorgs
                const canonicalReceipt = await provider.getTransactionReceipt(txResponse.hash);
                if (!canonicalReceipt) {
                    throw new Error('Could not fetch canonical transaction receipt');
                }
                
                const finalizedHead = await provider.getBlock("finalized");
                if (!finalizedHead) {
                    throw new Error("Could not fetch finalized head");
                }

                const confirmationsSeen = finalizedHead.number - startingFinalized.number + 1;
                const status = finalizedHead.number >= inclusionBlock 
                    ? TransactionStatus.FINALIZED 
                    : TransactionStatus.IN_BLOCK;

                // Emit custom confirmations callback
                this._emitStatusCallback(onStatus, cancelled, {
                    status,
                    confirmationMode: mode,
                    totalConfirmations: confirmationsSeen,
                    receipt: canonicalReceipt,
                    hash: txResponse.hash
                });
                
                return canonicalReceipt;

            case ConfirmationMode.FINAL:
                // Poll until the GRANDPA-finalized head >= inclusion block
                const FINALITY_POLL_INTERVAL_MS = 1000;
                let finalizedHeadFINAL;
                let startingBlock = await provider.getBlock("finalized");
                if (!startingBlock) {
                    throw new Error('Could not get finalized block');
                }
                
                do {
                    finalizedHeadFINAL = await provider.getBlock("finalized");
                    if (!finalizedHeadFINAL) {
                        throw new Error('Could not get finalized block');
                    }
                    if (finalizedHeadFINAL.number >= inclusionBlock) {
                        break;
                    }
                    await new Promise(r => setTimeout(r, FINALITY_POLL_INTERVAL_MS));
                } while (true);
                
                // Fetch new receipt after finalized head has passed inclusion block
                const finalReceipt = await provider.getTransactionReceipt(inclusionReceipt.hash);
                if (!finalReceipt) {
                    throw new Error("Could not fetch finalized head");
                }

                const finalConfirmations = finalReceipt.blockNumber - startingBlock.number;

                // Emit finalized status callback
                this._emitStatusCallback(onStatus, cancelled, {
                    status: TransactionStatus.FINALIZED,
                    confirmationMode: mode,
                    totalConfirmations: finalConfirmations,
                    receipt: finalReceipt,
                    hash: txResponse.hash
                });
                
                return finalReceipt;

            default:
                throw new Error(`Unknown confirmation mode: ${mode}`);
        }
    }
}