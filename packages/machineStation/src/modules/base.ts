import { JsonRpcProvider, Signer } from 'ethers';
import { ChainType, SDKMetadata, EvmTransaction, txOptions, ConfirmationMode, TransactionStatus } from '../types/common';
import { EvmExecutionError, EvmSendResult, EvmFormattedReceipt, TransactionStatusCallback } from '../types/base';

/**
 * Provides shared functionality for EVM-based Machine Station operations,
 * including ethers signer management and EVM transaction submission logic.
 * This base class is designed specifically for interacting with Machine Station Factory
 * smart contracts on EVM-compatible blockchains using ethers.js.
 */
export abstract class Base {
    private _api: JsonRpcProvider;
    private _metadata: SDKMetadata;

    /**
     * Initializes Base with a connected JsonRpcProvider and shared metadata.
     * 
     * @param api - The EVM JSON-RPC provider connection (ethers JsonRpcProvider)
     * @param metadata - Shared metadata, including chain type and optional ethers signer
     */
    constructor(api: JsonRpcProvider, metadata: SDKMetadata) {
        this._api = api;
        this._metadata = metadata;
    }

    /**
     * Allows access to the same JsonRpcProvider instance across the machine station SDK
     */
    protected get api(): JsonRpcProvider {
        return this._api;
    }

    /**
     * Allows access to the same metadata object across the machine station SDK
     */
    protected get metadata(): SDKMetadata {
        return this._metadata;
    }

    /**
     * Gets the chain ID for EVM-compatible blockchains using ethers JsonRpcProvider
     * @returns Promise<number> - The EVM chain ID as a number
     */
    protected async getChainId(): Promise<number> {
        if (this.metadata.chainType === ChainType.EVM) {
            if (this.api instanceof JsonRpcProvider) {
                const network = await this.api.getNetwork();
                return Number(network.chainId);
            } else {
                throw new Error('EVM chain type requires JsonRpcProvider');
            }
        }
        else {
            throw new Error('Only EVM chain type is supported by Machine Station SDK');
        }
    }

    /**
     * Sets the ethers signer for EVM transaction signing.
     * @param auth - Ethers Signer instance for EVM chains
     * @throws Error if auth is invalid or chain type is not EVM
     */
    protected _setSigner(auth: Signer): Signer {
        if (!auth) {
            throw new Error('Ethers Signer is required for Machine Station operations');
        }

        if (this.metadata.chainType === ChainType.EVM) {
            this.metadata.pair = auth;
            return auth;
        }
        else {
            throw new Error('Only EVM chain type is supported by Machine Station SDK');
        }
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
    
        if (!this.metadata.pair) {
            throw new EvmExecutionError('No signer available for signing');
        }
        
        const provider = this.api;
        const signer = (this.metadata.pair as Signer).connect(provider);
        const address = await signer.getAddress();

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
    
                    const txResponse = await signer.sendTransaction(fullTx);
                    
                    // Return immediately with transaction hash
                    resolveMain({
                        txHash: txResponse.hash,
                        unsubscribe: onStatus ? () => { cancelled = true; } : undefined,
                        receipt,
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
            receipt.catch((error) => {
                rejectMain(error);
            });
        });
    }
}