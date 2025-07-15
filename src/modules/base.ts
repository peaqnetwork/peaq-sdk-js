import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import { ethers, JsonRpcProvider, Wallet } from 'ethers';
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

        const nonce = onChainNonce?.gt(currentNonce) ? onChainNonce : currentNonce;
        const newNonce = nonce?.addn(1);

        this._nonceStore.set(address, newNonce);
        return nonce;
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
     * Sets the signer from auth input - handles Wallet, KeyringPair, or string.
     * @param auth - Wallet instance (EVM), KeyringPair instance (Substrate), or string (private key/mnemonic)
     * @throws Error if auth is invalid or incompatible with chain type
     */
    protected _setSigner(auth: string | KeyringPair | Wallet): KeyringPair | Wallet {
        if (!auth) {
            throw new Error('Authorization method is required');
        }

        // If auth is already a Wallet or KeyringPair, validate and use directly
        if (typeof auth !== 'string') {
            if (this.metadata.chainType === ChainType.EVM) {
                if (!(auth instanceof Wallet)) {
                    throw new Error('EVM chains require a Wallet instance, not a KeyringPair');
                }
                this.metadata.pair = auth;
                return auth;
            } else {
                if (auth instanceof Wallet) {
                    throw new Error('Substrate chains require a KeyringPair instance, not a Wallet');
                }
                this.metadata.pair = auth;
                return auth;
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
    protected async _send_substrate_tx(
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

        return new Promise<SubstrateSendResult>(async (resolveMain, rejectMain) => {
            let unsub: (() => void) | null = null;
            let actualTxHash: string = '';
            let hasReturned = false;

            // A promise that only resolves on finality (or rejects on drop/invalid/error)
            const finalize = new Promise<FormattedReceipt>(async (resolve, reject) => {
                try {
                    // Sign the transaction first
                    await call.signAsync(keyPair, { nonce });

                    // Send and monitor the transaction
                    unsub = await call.send(async (result: ISubmittableResult) => {
                        // Capture the real transaction hash from the first result
                        if (!actualTxHash && result.txHash) {
                            actualTxHash = result.txHash.toHex();
                            
                            // Return the SendResult immediately on first status update
                            if (!hasReturned) {
                                hasReturned = true;
                                resolveMain({
                                    txHash: actualTxHash,
                                    unsubscribe: () => unsub && unsub(),
                                    finalize
                                });
                            }
                        }
                        
                        // Forward status to user callback if provided
                        if (onStatus) {
                            onStatus(result);
                        }

                        // Check for early failures when inBlock
                        if (result.status.isInBlock) {
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

                            // TODO see if you can get custom amount of inBlocks for user to manually set
                            
                            // Check for any failed extrinsics
                            const extrinsicFailedEvents = peaqEvents.filter(peaqEvent => peaqEvent.method === "ExtrinsicFailed");
                            if (extrinsicFailedEvents.length > 0) {
                                const eventData = extrinsicFailedEvents[0].eventData[0];
                                const errorResp = await this._transactionError(extrinsicFailedEvents[0].method, eventData);
                                unsub && unsub();
                                return reject(
                                    new Error(
                                        `${errorResp?.name} for ${errorResp?.section}.`
                                    )
                                );
                            }
                        }

                        // Handle finalization
                        if (result.status.isFinalized) {
                            unsub && unsub();
                            const receipt = this._formatReceipt(result);
                            resolve(receipt);
                        } 
                        // Handle error states
                        else if (result.status.isInvalid || result.status.isDropped) {
                            unsub && unsub();
                            reject(new Error(
                                result.status.isInvalid
                                    ? "Transaction is invalid"
                                    : "Transaction was dropped"
                            ));
                        }
                    });
                } catch (error: any) {
                    if (unsub) unsub();
                    if (!hasReturned) {
                        rejectMain(error);
                    } else {
                        reject(error);
                    }
                }
            });

            // Handle cases where finalize rejects before we return
            finalize.catch((error) => {
                if (!hasReturned) {
                    rejectMain(error);
                }
            });
        });
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
                    return {
                        documentation: ['Unknown error'],
                        name: 'UnknownError',
                        section: 'UnknownSection'
                    };
                }
            }
        }
        
        return {
            documentation: ['Unknown error'],
            name: 'UnknownError',
            section: 'UnknownSection'
        };
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


    // Add this helper function before the _send_evm_tx method
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
    protected async _send_evm_tx(
        unsignedTx: EvmTransaction,
        onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
        opts: txOptions = {}
    ): Promise<EvmSendResult> {
        if (!(this.api instanceof JsonRpcProvider)) {
            throw new EvmExecutionError('API must be JsonRpcProvider instance for EVM transactions');
        }
    
        if (!this.metadata.pair || !(this.metadata.pair instanceof Wallet)) {
            throw new EvmExecutionError('No wallet available for signing');
        }
        
        const provider = this.api;
        const wallet = (this.metadata.pair as Wallet).connect(provider);
        const address = wallet.address;

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
            
            const finalize = new Promise<EvmFormattedReceipt>(async (resolve, reject) => {
                try {
                    // Estimate gas as source of truth
                    const estimatedGasLimit = await provider.estimateGas({
                        from: address,
                        to: unsignedTx.to,
                        data: unsignedTx.data ?? '0x',
                    });
    
                    // Get current fee data for EIP-1559
                    const feeData = await provider.getFeeData();
                    
                    // Use custom values if provided, otherwise use network defaults
                    const maxFeePerGas = feeData.maxFeePerGas;
                    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                    const gasLimit = estimatedGasLimit;
                    
                    // Build EIP-1559 transaction
                    const fullTx = {
                        to: unsignedTx.to,
                        data: unsignedTx.data ?? '0x',
                        gasLimit,
                        type: 2, // EIP-1559 transaction type
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                    };
    
                    const txResponse = await wallet.sendTransaction(fullTx);
                    
                    // Return immediately with transaction hash
                    resolveMain({
                        txHash: txResponse.hash,
                        unsubscribe: onStatus ? () => { cancelled = true; } : undefined,
                        finalize,
                        // confirmationMode: mode
                    });
    
                    // 1. Broadcast status - before tx has been included
                    if (onStatus && !cancelled) {
                        onStatus({
                            status: TransactionStatus.BROADCAST,
                            confirmationMode: mode,
                            totalConfirmations: 0,
                            hash: txResponse.hash,
                            nonce: txResponse.nonce
                        });
                    }
    
                    // Wait for first confirmation
                    const inclusionReceipt = await txResponse.wait();
                    if (!inclusionReceipt) {
                        throw new Error('Transaction receipt not found');
                    }
    
                    if (inclusionReceipt.status === 0) {
                        throw new EvmExecutionError('Transaction failed');
                    }

                    // 2. In-Block inclusion - after first block is finalized
                    if (onStatus && !cancelled) {
                        onStatus({
                            status: TransactionStatus.IN_BLOCK,
                            confirmationMode: mode,
                            totalConfirmations: 1,
                            receipt: inclusionReceipt,
                            hash: txResponse.hash
                        });
                    }

                    let userReceipt;
                    let finalConfirmations: number;
                    let status: TransactionStatus;
                    const inclusionBlock   = inclusionReceipt.blockNumber;

                    // Handle different confirmation requirements
                    switch (mode) {
                        case ConfirmationMode.FAST:
                            // Already have 1 confirmation, nothing more needed
                            finalConfirmations = 1;
                            status = TransactionStatus.IN_BLOCK;
                            userReceipt = inclusionReceipt;
                            break;

                        case ConfirmationMode.CUSTOM:
                             // 1) wait for the user’s target
                             const startingFinalized = await provider.getBlock("finalized");
                             if (!startingFinalized) {
                                 throw new Error("Could not fetch finalized head");
                             }

                            const customReceipt = await txResponse.wait(targetConfirmations);
                            if (!customReceipt) {
                                throw new Error('Could not get receipt after waiting for confirmations');
                            }
                            // reset final receipt in case there was reorg during wait
                            userReceipt = customReceipt;
                            
                            const finalizedHead = await provider.getBlock("finalized");
                            if (!finalizedHead) {
                                throw new Error("Could not fetch finalized head");
                            }

                            const head = await provider.getBlockNumber();
                            const confirmationsSeen = finalizedHead.number - startingFinalized.number  + 1;

                            // check if finalized head has passed the final receipt block number
                            if (finalizedHead.number >= inclusionBlock) {
                                status = TransactionStatus.FINALIZED;
                            } else {
                                status = TransactionStatus.IN_BLOCK;
                            }

                            // 3. Custom confirmations callback - after custom amount of blocks is waited
                            if (onStatus && !cancelled) {
                                onStatus({
                                    status: status,
                                    confirmationMode: mode,
                                    totalConfirmations: confirmationsSeen,
                                    receipt: userReceipt,
                                    hash: txResponse.hash
                                });
                            }
                            
                            break;

                        case ConfirmationMode.FINAL:
                            // Poll until the GRANDPA-finalized head >= inclusion block
                            let finalizedHeadFINAL;
                            let startingBlock = await provider.getBlock("finalized");
                            if (!startingBlock ) {
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
                                await new Promise(r => setTimeout(r, 1_000)); // poll every second
                            } while (true);
                            
                            // polling for the receipt after the finalized head has passed the inclusion block
                            // fetching new receipt block number ensures tx is on the correct block in case of an reorg
                            const finalReceipt = await provider.getTransactionReceipt(inclusionReceipt.hash);
                            if (!finalReceipt) {
                                throw new Error("Could not fetch finalized head");
                            }
                            userReceipt = finalReceipt;

                            
                            finalConfirmations = finalReceipt.blockNumber - startingBlock.number;
                            status = TransactionStatus.FINALIZED;

                            if (onStatus && !cancelled) {
                                onStatus({
                                    status: TransactionStatus.FINALIZED,
                                    confirmationMode: mode,
                                    totalConfirmations: finalConfirmations,
                                    receipt: userReceipt,
                                    hash: txResponse.hash
                                });
                            }
                            break;
                    }

                    // Return the clean EVM receipt without additional fields
                    if (!userReceipt) {
                        throw new Error('Transaction receipt not found');
                    }
                    resolve(userReceipt);
                } catch (error: any) {
                    // Gas estimation errors should be thrown immediately
                    if (error.code === 'CALL_EXCEPTION') {
                        const errorMessage = this._parseEvmError(error);
                        reject(new EvmExecutionError(errorMessage));
                        return;
                    }
                    
                    reject(error);
                }
            });
    
            // Handle cases where finalize rejects before we return
            finalize.catch((error) => {
                rejectMain(error);
            });
        });
    }
}