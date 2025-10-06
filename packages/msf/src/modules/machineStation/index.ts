// external imports
import { ethers, JsonRpcProvider, Signer } from 'ethers';

import {
    SDKMetadata,
    BuiltEvmTransactionResult,
    EvmTransaction,
    txOptions
} from '../../types/common';
import { TransactionStatusCallback } from '../../types/base';
import { Base } from '../base';
import {
    MachineStationWriteResult,
    DeployedSmartAccountResult,
    EIP712SignableMessage,
    UpdateConfigsOptions,
    DeployMachineSmartAccountOptions,
    TransferMachineStationBalanceOptions,
    ExecuteTransactionOptions,
    ExecuteMachineTransactionOptions,
    ExecuteMachineBatchTransactionsOptions,
    ExecuteMachineTransferBalanceOptions,
    AdminSignDeployMachineSmartAccountOptions,
    AdminSignTransferMachineStationBalanceOptions,
    AdminSignTransactionOptions,
    AdminSignMachineTransactionOptions,
    AdminSignMachineBatchTransactionsOptions,
    AdminSignTransferMachineBalanceOptions,
    MachineSignMachineTransactionOptions,
    MachineSignTransferMachineBalanceOptions,
    UpdateConfigsTransactionData,
    DeployMachineSmartAccountTransactionData,
    TransferMachineStationBalanceTransactionData,
    ExecuteTransactionData,
    ExecuteMachineTransactionData,
    ExecuteMachineBatchTransactionsData,
    ExecuteTransferMachineBalanceData
} from '../../types/machineStation';

// Import the ABI
import MachineStationFactoryABI from "../../abi/msf_abi.json";

/**
 * Provides methods to interact with the peaq machine station factory smart contract.
 * Supports configuration updates, smart account deployment, transaction execution, and EIP-712 signature generation.
 */
export class MachineStation extends Base {
    private iface: ethers.Interface;

    // Constants
    private static readonly ACCESS_CONTROL_ANYONE = "Anyone can call with proper signatures";
    
    private abiCoder = new ethers.AbiCoder();
    private sdk: any;
    private machineStationAddress: string;
    private stationAdminSigner?: Signer;
    private stationManagerSigner?: Signer;

    /**
     * Initializes MachineStation with a connected EVM provider and ethers signers.
     * 
     * @param api - The EVM JSON-RPC provider connection (ethers JsonRpcProvider)
     * @param metadata - Shared metadata for EVM chain operations
     * @param machineStationAddress - The address of the machine station factory smart contract
     * @param stationAdmin - Connected ethers signer for station admin operations (DEFAULT_ADMIN_ROLE)
     * @param stationManager - Optional connected ethers signer for station manager operations (STATION_MANAGER_ROLE). If not provided, admin will be used.
     */
    constructor(
        api: JsonRpcProvider, 
        metadata: SDKMetadata, 
        machineStationAddress: string,
        stationAdmin?: Signer,
        stationManager?: Signer
    ) {
        super(api, metadata);
        this.machineStationAddress = machineStationAddress;
        this.stationAdminSigner = stationAdmin;
        // Use stationManager if provided, otherwise use stationAdmin for manager operations (may be undefined)
        this.stationManagerSigner = stationManager || this.stationAdminSigner;
        
        // Create ethers Interface from ABI
        this.iface = new ethers.Interface(MachineStationFactoryABI);
    }

    // =====================================================================
    // CONFIGURATION METHODS
    // =====================================================================

    /**
     * Updates configuration values in the machine station factory contract.
     * 
     * **Transaction Execution**: Requires STATION_MANAGER_ROLE
     * 
     * @param options - The configuration update options
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to transaction result or transaction data
     */
    public async updateConfigs(
        options: UpdateConfigsOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult | UpdateConfigsTransactionData> {
        const { key, value, sendTransaction = true } = options;
        
        try {
            const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));
            const payload = this.iface.encodeFunctionData("updateConfigs", [keyHash, value]);
            
            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "update_configs",
                    configKey: key,
                    configValue: Number(value),
                    requiredRole: "STATION_MANAGER_ROLE"
                } as UpdateConfigsTransactionData;
            }

            if (!this.stationManagerSigner) {
                throw new Error("Station manager signer is required to send this transaction. Provide 'stationManager' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }

            return await this._handleEvmTx(tx, `update config '${key}' to ${value}`, statusCallback, txOptions, this.stationManagerSigner);
        } catch (error: any) {
            throw new Error(`Failed to update configs: ${error.message}`);
        }
    }

    // =====================================================================
    // SMART ACCOUNT DEPLOYMENT METHODS
    // =====================================================================

    /**
     * Deploys a new machine smart account through the factory contract.
     * 
     * **Transaction Execution**: Requires STATION_MANAGER_ROLE
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The deployment options including owner address and signature
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to deployment result with the new account address or transaction data
     */
    public async deployMachineSmartAccount(
        options: DeployMachineSmartAccountOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<DeployedSmartAccountResult | DeployMachineSmartAccountTransactionData> {
        const { machineOwnerAddress, nonce, stationManagerSignature, sendTransaction = true } = options;
        
        try {
            const payload = this.iface.encodeFunctionData("deployMachineSmartAccount", [
                machineOwnerAddress, 
                nonce, 
                stationManagerSignature
            ]);

            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "deploy_machine_smart_account", 
                    machineOwnerAddress: machineOwnerAddress,
                    requiredRole: "STATION_MANAGER_ROLE",
                    note: "After transaction is mined, listen for MachineSmartAccountDeployed event to get the deployed address"
                } as DeployMachineSmartAccountTransactionData;
            }

            if (!this.stationManagerSigner) {
                throw new Error("Station manager signer is required to send this transaction. Provide 'stationManager' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }

            const result = await this._handleEvmTx(tx, `deploy machine smart account for ${machineOwnerAddress}`, statusCallback, txOptions, this.stationManagerSigner);
            
            // Extract deployed address from the result
            let deployedAddress: string | null = null;
            
            // The new structure returns receipt as a Promise
            if ('receipt' in result && result.receipt) {
                try {
                    const receipt = await result.receipt;
                    if (receipt && receipt.logs && Array.isArray(receipt.logs)) {
                        // Compute the event signature
                        const eventSignature = ethers.id("MachineSmartAccountDeployed(address)");
                        
                        // Find the relevant log
                        const log = receipt.logs.find((log: any) => log.topics[0] === eventSignature);
                        
                        if (log) {
                            // The deployed address is stored as the second topic (topics[1]) in a 32-byte format
                            const rawDeployedAddress = log.topics[1];
                            deployedAddress = ethers.getAddress(`0x${rawDeployedAddress.slice(26)}`); // Extract last 20 bytes
                        }
                    }
                } catch (error) {
                    console.warn('Failed to extract deployed address from receipt:', error);
                }
            }
            
            let message = `Successfully deployed machine smart account at address ${deployedAddress}.`;
            let success = true;

            if (!deployedAddress) {
                success = false;
                message = "Deployed address not found in receipt logs";
                
                console.warn(`No deployed address found in logs. Result:`, result);
            }
            
            return {
                success: success,
                message: message,
                deployedAddress: deployedAddress,
                txHash: 'txHash' in result ? result.txHash : undefined,
                receipt: 'receipt' in result ? result.receipt : undefined
            } as DeployedSmartAccountResult;
        } catch (error: any) {
            throw new Error(`Failed to deploy machine smart account: ${error.message}`);
        }
    }

    // =====================================================================
    // BALANCE TRANSFER METHODS
    // =====================================================================

    /**
     * Transfers the machine station balance to a new machine station address.
     * 
     * **Transaction Execution**: Requires DEFAULT_ADMIN_ROLE
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The transfer options including new address and signature
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to transaction result or transaction data
     */
    public async transferMachineStationBalance(
        options: TransferMachineStationBalanceOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult | TransferMachineStationBalanceTransactionData> {
        const { newMachineStationAddress, nonce, stationAdminSignature, sendTransaction = true } = options;
        
        try {
            const payload = this.iface.encodeFunctionData("transferMachineStationBalance", [
                newMachineStationAddress, 
                nonce, 
                stationAdminSignature
            ]);

            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "execute_transfer_machine_station_balance",
                    currentMachineStationAddress: this.machineStationAddress,
                    newMachineStationAddress: newMachineStationAddress,
                    requiredRole: "DEFAULT_ADMIN_ROLE"
                } as TransferMachineStationBalanceTransactionData;
            }

            if (!this.stationAdminSigner) {
                throw new Error("Admin signer is required to send this transaction. Provide 'stationAdmin' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }

            return await this._handleEvmTx(tx, `transfer machine station balance to ${newMachineStationAddress}`, statusCallback, txOptions, this.stationAdminSigner);
        } catch (error: any) {
            throw new Error(`Failed to transfer machine station balance: ${error.message}`);
        }
    }

    // =====================================================================
    // TRANSACTION EXECUTION METHODS
    // =====================================================================

    /**
     * Executes a transaction through the machine station factory.
     * 
     * **Transaction Execution**: No specific role required (anyone can call)
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The transaction execution options
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to transaction result or transaction data
     */
    public async executeTransaction(
        options: ExecuteTransactionOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult | ExecuteTransactionData> {
        const { target, calldata, nonce, refundAmount = 0n, machineStationOwnerSignature, sendTransaction = false } = options;
        
        try {
            const payload = this.iface.encodeFunctionData("executeTransaction", [
                target, 
                calldata, 
                nonce, 
                refundAmount, 
                machineStationOwnerSignature
            ]);

            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "execute_transaction",
                    target: target,
                    accessControl: MachineStation.ACCESS_CONTROL_ANYONE
                } as ExecuteTransactionData;
            }

            if (!this.stationManagerSigner) {
                throw new Error("Station manager signer is required to send this transaction. Provide 'stationManager' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }

            return await this._handleEvmTx(tx, `execute transaction on target ${target}`, statusCallback, txOptions, this.stationManagerSigner);
        } catch (error: any) {
            throw new Error(`Failed to execute transaction: ${error.message}`);
        }
    }

    /**
     * Executes a transaction on behalf of a machine smart account.
     * 
     * **Transaction Execution**: No specific role required (anyone can call)
     * **Signature Generation Machine**: Must be signed by the machine owner
     * **Signature Generation Admin**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The machine transaction execution options
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to transaction result or transaction data
     */
    public async executeMachineTransaction(
        options: ExecuteMachineTransactionOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult | ExecuteMachineTransactionData> {
        const { 
            machineAddress, 
            target, 
            calldata, 
            nonce, 
            refundAmount = 0n, 
            machineStationOwnerSignature, 
            machineOwnerSignature, 
            sendTransaction = false 
        } = options;
        
        try {
            const payload = this.iface.encodeFunctionData("executeMachineTransaction", [
                machineAddress, 
                target, 
                calldata, 
                nonce, 
                refundAmount, 
                machineStationOwnerSignature, 
                machineOwnerSignature
            ]);

            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "execute_machine_transaction",
                    machineAddress: machineAddress,
                    target: target,
                    accessControl: MachineStation.ACCESS_CONTROL_ANYONE
                } as ExecuteMachineTransactionData;
            }

            if (!this.stationManagerSigner) {
                throw new Error("Station manager signer is required to send this transaction. Provide 'stationManager' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }

            return await this._handleEvmTx(tx, `execute machine transaction from ${machineAddress} on target ${target}`, statusCallback, txOptions, this.stationManagerSigner);
        } catch (error: any) {
            throw new Error(`Failed to execute machine transaction: ${error.message}`);
        }
    }

    /**
     * Executes multiple transactions in a batch on behalf of machine smart accounts.
     * 
     * **Transaction Execution**: No specific role required (anyone can call)
     * **Signature Generation Machine**: Must be signed by the machine owner
     * **Signature Generation Admin**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The batch transaction execution options
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to transaction result or transaction data
     */
    public async executeMachineBatchTransactions(
        options: ExecuteMachineBatchTransactionsOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult | ExecuteMachineBatchTransactionsData> {
        const { 
            machineAddresses, 
            targets, 
            calldataList, 
            nonce, 
            refundAmount = 0n, 
            machineNonces = [], 
            machineStationOwnerSignature, 
            machineOwnerSignatures, 
            sendTransaction = false 
        } = options;
        
        try {
            const payload = this.iface.encodeFunctionData("executeMachineBatchTransactions", [
                machineAddresses, 
                targets, 
                calldataList, 
                nonce, 
                refundAmount, 
                machineNonces, 
                machineStationOwnerSignature, 
                machineOwnerSignatures
            ]);

            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                const accountsStr = machineAddresses.join(", ");
                const targetsStr = targets.join(", ");
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "execute_machine_batch_transactions",
                    machineAddresses: machineAddresses,
                    targets: targets,
                    description: `Batch transactions from accounts [${accountsStr}] on targets [${targetsStr}]`,
                    accessControl: MachineStation.ACCESS_CONTROL_ANYONE
                } as ExecuteMachineBatchTransactionsData;
            }

            const accountsStr = machineAddresses.join(", ");
            const targetsStr = targets.join(", ");
            if (!this.stationManagerSigner) {
                throw new Error("Station manager signer is required to send this transaction. Provide 'stationManager' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }
            return await this._handleEvmTx(tx, `execute batch transactions from accounts [${accountsStr}] on targets [${targetsStr}]`, statusCallback, txOptions, this.stationManagerSigner);
        } catch (error: any) {
            throw new Error(`Failed to execute machine batch transactions: ${error.message}`);
        }
    }

    /**
     * Transfers balance from a machine smart account to a recipient.
     * 
     * **Transaction Execution**: Requires STATION_MANAGER_ROLE
     * **Signature Generation Machine**: Must be signed by the machine owner
     * **Signature Generation Admin**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The balance transfer options
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to transaction result or transaction data
     */
    public async executeMachineTransferBalance(
        options: ExecuteMachineTransferBalanceOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult | ExecuteTransferMachineBalanceData> {
        const { 
            machineAddress, 
            recipientAddress, 
            nonce, 
            stationManagerSignature, 
            machineOwnerSignature, 
            sendTransaction = false 
        } = options;
        
        try {
            const payload = this.iface.encodeFunctionData("executeMachineTransferBalance", [
                machineAddress, 
                recipientAddress, 
                nonce, 
                stationManagerSignature, 
                machineOwnerSignature
            ]);

            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "execute_transfer_machine_balance",
                    machineAddress: machineAddress,
                    recipientAddress: recipientAddress,
                    requiredRole: "STATION_MANAGER_ROLE"
                } as ExecuteTransferMachineBalanceData;
            }

            if (!this.stationManagerSigner) {
                throw new Error("Station manager signer is required to send this transaction. Provide 'stationManager' during SDK initialization or set sendTransaction=false to get the raw tx data.");
            }
            return await this._handleEvmTx(tx, `transfer balance from ${machineAddress} to ${recipientAddress}`, statusCallback, txOptions, this.stationManagerSigner);
        } catch (error: any) {
            throw new Error(`Failed to execute machine transfer balance: ${error.message}`);
        }
    }

    // =====================================================================
    // EIP-712 SIGNATURE GENERATION METHODS (ADMIN)
    // =====================================================================

    /**
     * Generates a signature for deploying a machine smart account.
     * 
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignDeployMachineSmartAccount(
        options: AdminSignDeployMachineSmartAccountOptions
    ): Promise<string> {
        // Use either station manager or admin signer (both can sign)
        const signer = this.stationManagerSigner || this.stationAdminSigner;
        if (!signer) {
            throw new Error('Either station manager or admin signer is required for this operation');
        }
        
        try {
            const { machineOwnerAddress, nonce } = options;
            const domain = await this._getMachineStationDomain("MachineStationFactory");

            const types = {
                DeployMachineSmartAccount: [
                    { name: "machineOwner", type: "address" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                machineOwner: machineOwnerAddress,
                nonce: nonce,
            };

            const signature = await signer.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign deploy machine smart account: ${error.message}`);
        }
    }

    /**
     * Generates a signature for transferring machine station balance.
     * 
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransferMachineStationBalance(
        options: AdminSignTransferMachineStationBalanceOptions
    ): Promise<string> {
        // Use either admin or station manager signer (both can sign)
        const signer = this.stationAdminSigner || this.stationManagerSigner;
        if (!signer) {
            throw new Error('Either admin or station manager signer is required for this operation');
        }
        
        try {
            const { newMachineStationAddress, nonce } = options;
            const domain = await this._getMachineStationDomain("MachineStationFactory");

            const types = {
                TransferMachineStationBalance: [
                    { name: "newMachineStationAddress", type: "address" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                newMachineStationAddress: newMachineStationAddress,
                nonce: nonce
            };

            const signature = await signer.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign transfer machine station balance: ${error.message}`);
        }
    }

    /**
     * Generates a signature for executing a transaction.
     * 
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransaction(
        options: AdminSignTransactionOptions
    ): Promise<string> {
        // Use either admin or station manager signer (both can sign)
        const signer = this.stationAdminSigner || this.stationManagerSigner;
        if (!signer) {
            throw new Error('Either admin or station manager signer is required for this operation');
        }
        
        try {
            const { target, calldata, nonce, refundAmount = 0n } = options;
            const domain = await this._getMachineStationDomain("MachineStationFactory");

            const types = {
                ExecuteTransaction: [
                    { name: "target", type: "address" },
                    { name: "data", type: "bytes" },
                    { name: "nonce", type: "uint256" },
                    { name: "refundAmount", type: "uint256" },
                ],
            };

            const message = {
                target: target,
                data: calldata,
                nonce: nonce,
                refundAmount: refundAmount
            };

            const signature = await signer.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign transaction: ${error.message}`);
        }
    }

    /**
     * Generates a signature for executing a machine transaction.
     * 
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignMachineTransaction(
        options: AdminSignMachineTransactionOptions
    ): Promise<string> {
        // Use either admin or station manager signer (both can sign)
        const signer = this.stationAdminSigner || this.stationManagerSigner;
        if (!signer) {
            throw new Error('Either admin or station manager signer is required for this operation');
        }
        
        try {
            const { machineAddress, target, calldata, nonce, refundAmount = 0n } = options;
            const domain = await this._getMachineStationDomain("MachineStationFactory");

            const types = {
                ExecuteMachineTransaction: [
                    { name: "machineAddress", type: "address" },
                    { name: "target", type: "address" },
                    { name: "data", type: "bytes" },
                    { name: "nonce", type: "uint256" },
                    { name: "refundAmount", type: "uint256" },
                ],
            };

            const message = {
                machineAddress: machineAddress,
                target: target,
                data: calldata,
                nonce: nonce,
                refundAmount: refundAmount
            };

            const signature = await signer.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign machine transaction: ${error.message}`);
        }
    }

    /**
     * Generates a signature for executing batch transactions.
     * 
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignMachineBatchTransactions(
        options: AdminSignMachineBatchTransactionsOptions
    ): Promise<string> {
        // Use either admin or station manager signer (both can sign)
        const signer = this.stationAdminSigner || this.stationManagerSigner;
        if (!signer) {
            throw new Error('Either admin or station manager signer is required for this operation');
        }
        
        try {
            const { 
                machineAddresses, 
                targets, 
                calldataList, 
                nonce, 
                refundAmount = 0n, 
                machineNonces = [] 
            } = options;
            
            const domain = await this._getMachineStationDomain("MachineStationFactory");

            const types = {
                ExecuteMachineBatchTransactions: [
                    { name: "machineAddresses", type: "address[]" },
                    { name: "targets", type: "address[]" },
                    { name: "data", type: "bytes[]" },
                    { name: "nonce", type: "uint256" },
                    { name: "refundAmount", type: "uint256" },
                    { name: "machineNonces", type: "uint256[]" },
                ],
            };

            const message = {
                machineAddresses: machineAddresses,
                targets: targets,
                data: calldataList,
                nonce: nonce,
                refundAmount: refundAmount,
                machineNonces: machineNonces
            };

            const signature = await signer.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign machine batch transactions: ${error.message}`);
        }
    }

    /**
     * Generates a signature for transferring machine balance.
     * 
     * **Signature Generation**: Can be signed by either DEFAULT_ADMIN_ROLE or STATION_MANAGER_ROLE
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransferMachineBalance(
        options: AdminSignTransferMachineBalanceOptions
    ): Promise<string> {
        // Use either admin or station manager signer (both can sign)
        const signer = this.stationAdminSigner || this.stationManagerSigner;
        if (!signer) {
            throw new Error('Either admin or station manager signer is required for this operation');
        }
        
        try {
            const { machineAddress, recipientAddress, nonce } = options;
            const domain = await this._getMachineStationDomain("MachineStationFactory");

            const types = {
                ExecuteMachineTransferBalance: [
                    { name: "machineAddress", type: "address" },
                    { name: "recipientAddress", type: "address" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                machineAddress: machineAddress,
                recipientAddress: recipientAddress,
                nonce: nonce,
            };

            const signature = await signer.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign transfer machine balance: ${error.message}`);
        }
    }

    // =====================================================================
    // EIP-712 SIGNATURE GENERATION METHODS (MACHINE)
    // =====================================================================

    /**
     * Creates a signable EIP-712 message for machine transaction execution.
     * If machineOwnerSigner is provided, signs the message and returns the signature.
     * Otherwise, returns the message structure for frontend wallet signing.
     * 
     * @param options - The signature options
     * @param machineOwnerSigner - Optional signer to sign the message directly
     * @returns Promise resolving to either the signature string or EIP-712 signable message object
     */
    public async machineSignMachineTransaction(
        options: MachineSignMachineTransactionOptions,
        machineOwnerSigner?: Signer,
        version: string = "2"
    ): Promise<string | EIP712SignableMessage> {
        try {
            const { machineAddress, target, calldata, nonce } = options;
            const domain = await this._getMachineAccountDomain("MachineSmartAccount", machineAddress, version);

            const types = {
                Execute: [
                    { name: "target", type: "address" },
                    { name: "data", type: "bytes" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                target: target,
                data: calldata,
                nonce: nonce
            };

            // If signer is provided, sign the message and return signature
            if (machineOwnerSigner) {
                const signature = await machineOwnerSigner.signTypedData(domain, types, message);
                return signature;
            }

            // Otherwise return the signable message object
            return {
                domain,
                types,
                message,
                primaryType: "Execute"
            };
        } catch (error: any) {
            throw new Error(`Failed to create signable message for machine transaction: ${error.message}`);
        }
    }

    /**
     * Creates a signable EIP-712 message for machine balance transfer.
     * If machineOwnerSigner is provided, signs the message and returns the signature.
     * Otherwise, returns the message structure for frontend wallet signing.
     * 
     * @param options - The signature options
     * @param machineOwnerSigner - Optional signer to sign the message directly
     * @returns Promise resolving to either the signature string or EIP-712 signable message object
     */
    public async machineSignTransferMachineBalance(
        options: MachineSignTransferMachineBalanceOptions,
        machineOwnerSigner?: Signer
    ): Promise<string | EIP712SignableMessage> {
        try {
            const { machineAddress, recipientAddress, nonce } = options;
            const domain = await this._getMachineAccountDomain("MachineSmartAccount", machineAddress);

            const types = {
                TransferMachineBalance: [
                    { name: "recipientAddress", type: "address" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                recipientAddress: recipientAddress,
                nonce: nonce,
            };

            // If signer is provided, sign the message and return signature
            if (machineOwnerSigner) {
                const signature = await machineOwnerSigner.signTypedData(domain, types, message);
                return signature;
            }

            // Otherwise return the signable message object
            return {
                domain,
                types,
                message,
                primaryType: "TransferMachineBalance"
            };
        } catch (error: any) {
            throw new Error(`Failed to create signable message for machine balance transfer: ${error.message}`);
        }
    }

    // =====================================================================
    // PRIVATE HELPER METHODS
    // =====================================================================

    /**
     * Generates a function selector (4-byte signature) from a function signature string.
     * 
     * @param signature - The function signature string
     * @returns The 4-byte function selector
     */
    private _getFunctionSelector(signature: string): string {
        return ethers.keccak256(ethers.toUtf8Bytes(signature)).substring(0, 10);
    }

    /**
     * Generates an EIP-712 domain for MachineStationFactory contract.
     * 
     * @param name - The domain name
     * @returns Promise resolving to the EIP-712 domain object
     */
    private async _getMachineStationDomain(name: string): Promise<{ name: string, version: string, chainId: number, verifyingContract: string }> {
        const chainId = await this.getChainId();
        return {
            name,
            version: "2",
            chainId,
            verifyingContract: this.machineStationAddress
        };
    }

    /**
     * Generates an EIP-712 domain for MachineSmartAccount contract.
     * 
     * @param name - The domain name
     * @param verifyingContract - The machine smart account address
     * @returns Promise resolving to the EIP-712 domain object
     */
    private async _getMachineAccountDomain(name: string, verifyingContract: string, version: string = "2"): Promise<{ name: string, version: string, chainId: number, verifyingContract: string }> {
        const chainId = await this.getChainId();
        return {
            name,
            version,
            chainId,
            verifyingContract
        };
    }

    /**
     * Builds an EVM transaction with encoded parameters.
     * 
     * @param signature - The function signature
     * @param paramTypes - Array of parameter types for ABI encoding
     * @param paramValues - Array of parameter values
     * @returns The constructed EVM transaction
     */
    private _buildEvmTransaction(signature: string, paramTypes: string[], paramValues: any[]): EvmTransaction {
        const selector = this._getFunctionSelector(signature);
        const encodedParams = this.abiCoder.encode(paramTypes, paramValues);
        return {
            to: this.machineStationAddress,
            data: selector + encodedParams.slice(2)
        };
    }

    private async _handleEvmTx(
        tx: EvmTransaction, 
        action: string, 
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, 
        txOptions?: txOptions,
        signer?: Signer
    ): Promise<MachineStationWriteResult> {
        if (!this.metadata.pair && !signer) {
            return { message: `Constructed ${action} tx (unsigned).`, tx } as BuiltEvmTransactionResult;
        }
        try {
            // If a specific signer is provided, temporarily override the metadata.pair
            if (signer) {
                const originalSigner = this.metadata.pair;
                this.metadata.pair = signer;
                try {
                    return await this._executeEvmTransaction(tx, statusCallback, txOptions, this.iface);
                } finally {
                    // Restore the original signer
                    this.metadata.pair = originalSigner;
                }
            } else {
                return await this._executeEvmTransaction(tx, statusCallback, txOptions, this.iface);
            }
        } catch (err: any) {
            throw new Error(`Failed to ${action}: ${err?.message ?? err}`);
        }
    }
} 