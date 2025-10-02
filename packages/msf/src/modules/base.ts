import { JsonRpcProvider, Signer } from 'ethers';
import { ChainType, SDKMetadata, EvmTransaction, txOptions, ConfirmationMode, TransactionStatus, PrecompileAddresses } from '../types/common';
import { EvmSendResult, EvmFormattedReceipt, TransactionStatusCallback } from '../types/base';

export class EvmExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EvmExecutionError';
    }
}

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

    /**
     * Extract target contract address from transaction data
     */
    private _extractTargetAddress(transactionData: string): string | null {
        try {
            if (transactionData && transactionData.length > 74) {
                // The target address should be in the first 32 bytes after the function selector
                const targetHex = transactionData.slice(34, 74);
                return '0x' + targetHex.slice().toLowerCase();
            }
        } catch (error) {
            // Return null if extraction fails
        }
        return null;
    }

    /**
     * Get friendly name for precompile addresses
     */
    private _getPrecompileName(address: string): string | null {
        switch (address.toLowerCase()) {
            case PrecompileAddresses.STORAGE.toLowerCase():
                return 'Storage';
            case PrecompileAddresses.DID.toLowerCase():
                return 'DID';
            case PrecompileAddresses.RBAC.toLowerCase():
                return 'RBAC';
            case PrecompileAddresses.IERC20.toLowerCase():
                return 'IERC20';
            default:
                return null;
        }
    }

    /**
     * Enhanced error parsing for smart contract errors.
     * This method uses the ethers Interface to decode known errors from the ABI,
     * while also handling wrapped errors from target contracts.
     * 
     * @param error - The error object from ethers
     * @param iface - Optional ethers Interface to decode custom errors
     * @returns A human-readable error message
     */
    private _parseEvmError(error: any, iface?: any): string {
        if (!error) return 'Unknown error occurred';

        // Contract exception
        if (error.code === 'CALL_EXCEPTION') {
            // Try to decode MachineStationFactory errors first
            if (error.data && iface) {
                try {
                    const decodedError = iface.parseError(error.data);
                    if (decodedError) {
                        // Format the decoded error nicely
                        const args = decodedError.args.length > 0 ? 
                            ` (${decodedError.args.map((arg: any) => 
                                typeof arg === 'string' && arg.startsWith('0x') && arg.length === 42 
                                    ? arg.slice(0, 6) + '...' + arg.slice(-4)  // Shorten addresses
                                    : arg.toString()
                            ).join(', ')})` : '';
                        return `Contract error: ${decodedError.name}${args}`;
                    }
                } catch (decodeError) {
                    // Fall through to wrapped error handling
                }
            }
        }

        // Precompile error
        if (error.shortMessage) {
            const errorData = error.data;

            // Handle unknown custom error with helpful messages
            if (error.shortMessage === 'execution reverted (unknown custom error)') {
                const targetAddress = this._extractTargetAddress(error.transaction?.data);
                if (targetAddress) {
                    // const precompileName = this._getPrecompileName(targetAddress);
                    // if (precompileName) {
                        return `Contract error: Operation failed with selector ${errorData.slice(0, 10)} (likely item already exists, incorrect machine owner signature, insufficient permissions, invalid parameters, or machine station factory out of gas)`;
                    // }
                }
            }
            return error.shortMessage;
        }

            return 'Transaction reverted without a reason string';
    }

    /**
     * Enhanced EVM transaction with fire-and-forget and live-status modes
     */
    protected async _executeEvmTransaction(
        unsignedTx: EvmTransaction,
        onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
        opts: txOptions = {},
        iface?: any // Optional interface for better error decoding
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
                    // Parse and reject with improved error message
                    const errorMessage = this._parseEvmError(error, iface);
                    return reject(new EvmExecutionError(errorMessage));
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
        const address = await signer.getAddress();

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