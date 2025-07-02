import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import { ethers, JsonRpcProvider, Wallet, TransactionResponse } from 'ethers';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { hexToU8a, isHex } from '@polkadot/util';
import { BN } from '@polkadot/util';
import { GenericExtrinsic } from '@polkadot/types';
import { AnyTuple } from '@polkadot/types-codec/types';

import { ChainType, EvmTransaction, SDKMetadata, CreateInstanceOptions, KeyType } from '../types/common';
import { FormattedReceipt, PeaqEvent, PeaqEventData, TErrorData, EvmExecutionError, SendResult } from '../types/base';

type Address = string;

/**
 * Provides shared functionality for both EVM and Substrate SDK operations,
 * including signer generation and transaction submission logic.
 */
export abstract class Base {
    private _api: ApiPromise | JsonRpcProvider;
    private _metadata: SDKMetadata;
    protected maxAttempts: number = 5;
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
     * Generates a blockchain key pair from a seed string.
     * @param seed - Hex private key (EVM) or mnemonic phrase (Substrate)
     * @param keyType - The type of key to create for Substrate chains (ignored for EVM)
     * @throws Error if seed is empty or invalid
     */
    protected _createKeyPair(seed: string, keyType?: KeyType): KeyringPair | Wallet {
        if (!seed) {
            throw new Error('Seed is required');
        }

        if (this.metadata.chainType === ChainType.EVM) {
            const wallet = new ethers.Wallet(seed);
            this.metadata.pair = wallet;
            return wallet;
        } else {
            // Substrate - use the specified key type or default to sr25519
            const selectedKeyType = keyType || KeyType.SR25519;
            
            // Map KeyType enum to Polkadot keyring type string
            const keyringType = selectedKeyType === KeyType.ED25519 ? 'ed25519' : 'sr25519';
            
            const keyring = new Keyring({ type: keyringType, ss58Format: 42 });
            const pair = keyring.addFromMnemonic(seed);
            this.metadata.pair = pair;
            return pair;
        }
    }

    /**
     * Enhanced substrate transaction with fire-and-forget and live-status modes
     */
    protected async _send_substrate_tx(
        call: SubmittableExtrinsic<"promise", ISubmittableResult>,
        onStatus?: (result: ISubmittableResult) => void
    ): Promise<SendResult> {
        if (!this.metadata.pair) {
            throw new Error('No keypair available for signing');
        }

        if (!(this.api instanceof ApiPromise)) {
            throw new Error('API must be ApiPromise instance for Substrate transactions');
        }

        const keyPair = this.metadata.pair as KeyringPair;
        const api = this.api;

        // Get managed nonce
        const nonce = await this._getNonce(keyPair.address);

        return new Promise<SendResult>(async (resolveMain, rejectMain) => {
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

    protected async _send_evm_tx(
        unsignedTx: EvmTransaction
    ): Promise<ethers.TransactionReceipt> {
        if (!(this.api instanceof JsonRpcProvider)) {
            throw new EvmExecutionError('API must be JsonRpcProvider instance for EVM transactions');
        }

        if (!this.metadata.pair || !(this.metadata.pair instanceof Wallet)) {
            throw new EvmExecutionError('No wallet available for signing');
        }

        const maxAttempts = 5; // Reduced from 5 to avoid too many retries
        const timeoutMs = 90000; // Increased to 90 seconds
        
        const provider = this.api;
        // Ensure wallet is connected to the provider
        const wallet = (this.metadata.pair as Wallet).connect(provider);
        const address = wallet.address;

        let attempt = 0;
        let baseFeePerGas: bigint | null = null;
        let chainId: bigint | null = null;
        let currentNonce: number | null = null;

        const waitForReceiptWithTimeout = async (
            provider: JsonRpcProvider,
            txHash: string,
            timeoutMs: number
        ): Promise<ethers.TransactionReceipt> => {
            const receipt = await Promise.race([
                provider.waitForTransaction(txHash),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
                ),
            ]) as ethers.TransactionReceipt;
            
            return receipt;
        };

        while (attempt < maxAttempts) {
            try {
                // Fetch feeData & chainId on first attempt
                if (attempt === 0) {
                    const feeData = await provider.getFeeData();
                    baseFeePerGas = feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n;
                    const network = await provider.getNetwork();
                    chainId = network.chainId;
                    
                    // Get fresh nonce for each transaction
                    currentNonce = await provider.getTransactionCount(address, 'pending');
                } else {
                    // For retries, increase gas price more aggressively and get fresh nonce
                    baseFeePerGas = baseFeePerGas! * 150n / 100n; // 50% increase instead of 25%
                    currentNonce = await provider.getTransactionCount(address, 'pending');
                    
                    // Add small delay between retries to avoid rapid-fire transactions
                    await new Promise((r) => setTimeout(r, 2000));
                }

                // Estimate gas with current parameters
                const estimateTx = {
                    from: address,
                    to: unsignedTx.to,
                    data: unsignedTx.data ?? '0x',
                    gasPrice: baseFeePerGas!,
                    nonce: currentNonce,
                    chainId: chainId!,
                };

                try {
                    const estimatedGasLimit = await provider.estimateGas(estimateTx);
                    
                    // Build and send transaction
                    const fullTx = {
                        to: unsignedTx.to,
                        data: unsignedTx.data ?? '0x',
                        nonce: currentNonce,
                        gasPrice: baseFeePerGas!,
                        gasLimit: estimatedGasLimit,
                        chainId: chainId!,
                    };

                    const txResponse = await wallet.sendTransaction(fullTx);
                    console.log(`Attempt ${attempt + 1}: Sent tx ${txResponse.hash} with gasPrice ${baseFeePerGas!.toString()} and nonce ${currentNonce}`);

                    try {
                        const receipt = await waitForReceiptWithTimeout(provider, txResponse.hash, timeoutMs);
                        if (receipt.status === 0) {
                            throw new Error('Transaction failed');
                        }
                        return receipt;
                    } catch (waitError: any) {
                        console.warn(
                            `Attempt ${attempt + 1}: Tx ${txResponse.hash} not confirmed within ${timeoutMs}ms: ${waitError.message}`
                        );

                        // Check if transaction is still pending
                        const pending = await provider.getTransaction(txResponse.hash);
                        if (pending && !pending.blockNumber) {
                            console.log(`Tx ${txResponse.hash} is still pending. Will retry with higher gas price...`);
                            attempt += 1;
                            continue;
                        } else {
                            throw new EvmExecutionError(
                                `Transaction ${txResponse.hash} was dropped or not found after timeout.`
                            );
                        }
                    }
                } catch (estimateError: any) {
                    // If this is a revert error, parse it and throw immediately
                    if (estimateError.code === 'CALL_EXCEPTION') {
                        throw new EvmExecutionError(this._parseEvmError(estimateError));
                    }
                    throw estimateError;
                }
            } catch (err: any) {
                const msg = err.toString().toLowerCase();
                
                // If it's already an EvmExecutionError with a parsed message, throw it directly
                if (err instanceof EvmExecutionError) {
                    throw err;
                }
                
                // Handle specific error types that should trigger retry
                const retryableErrors = [
                    'replacement transaction underpriced',
                    'fee too low',
                    'intrinsic gas too low',
                    'nonce too low',
                    'already known',
                    'transaction underpriced',
                ];
                
                if (retryableErrors.some((substr) => msg.includes(substr))) {
                    console.warn(
                        `Attempt ${attempt + 1}: Detected retryable error ("${err.message}"). Will retry with higher gas price...`
                    );
                    attempt += 1;
                    continue;
                }

                // Handle connection errors
                if (msg.includes('connection') && (msg.includes('closed') || msg.includes('error'))) {
                    console.warn(
                        `Attempt ${attempt + 1}: Connection error ("${err.message}"). Will retry...`
                    );
                    attempt += 1;
                    await new Promise((r) => setTimeout(r, 1000));
                    continue;
                }

                throw new EvmExecutionError(this._parseEvmError(err));
            }
        }

        throw new EvmExecutionError(
            `Failed to send EVM transaction after ${maxAttempts} attempts.`
        );
    }
}