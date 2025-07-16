// external imports
import { ethers, JsonRpcProvider, Signer } from 'ethers';

// local imports
import { Main } from '../main';
import {
    SDKMetadata,
    BuiltCallTransactionResult,
    BuiltEvmTransactionResult,
    EvmTransaction,
    txOptions
} from '../../types/common';
import { SubstrateSendResult, EvmSendResult, TransactionStatusCallback } from '../../types/base';
import { Base } from '../base';
import {
    MachineStationFactoryFunctionSignatures,
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

/**
 * Provides methods to interact with the peaq machine station factory smart contract.
 * Supports configuration updates, smart account deployment, transaction execution, and EIP-712 signature generation.
 */
export class MachineStation extends Base {
    private abiCoder = new ethers.AbiCoder();
    private sdk: any;
    private machineStationAddress: string;
    private machineStationOwnerSigner: Signer;

    /**
     * Initializes MachineStation with a connected API instance and shared SDK metadata.
     * 
     * @param sdk - Instance of the peaq SDK to create and send txs
     * @param api - The blockchain API connection (JsonRpcProvider for EVM)
     * @param metadata - Shared metadata, including chain type and optional signer
     * @param machineStationAddress - The address of the machine station factory contract
     * @param machineStationOwnerSigner - Signer instance for machine station owner operations
     */
    constructor(
        sdk: Main,
        api: JsonRpcProvider, 
        metadata: SDKMetadata, 
        machineStationAddress: string,
        machineStationOwnerSigner: Signer
    ) {
        super(api, metadata);
        this.sdk = sdk;
        this.machineStationAddress = machineStationAddress;
        this.machineStationOwnerSigner = machineStationOwnerSigner.connect(api);
    }

    // =====================================================================
    // CONFIGURATION METHODS
    // =====================================================================

    /**
     * Updates configuration values in the machine station factory contract.
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
            const functionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.UPDATE_CONFIGS)).substring(0, 10);
            const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));
            
            const params = this.abiCoder.encode(
                ["bytes32", "uint256"],
                [keyHash, value]
            );

            const payload = params.replace("0x", functionSelector);
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

            return await this._handleEvmTx(tx, `update config '${key}' to ${value}`, statusCallback, txOptions);
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
     * @param options - The deployment options including owner address and signature
     * @param statusCallback - Optional callback for monitoring transaction status
     * @param txOptions - Optional transaction confirmation mode settings
     * @returns Promise resolving to deployment result with the new account address or transaction data
     */
    public async deployMachineSmartAccount(
        options: DeployMachineSmartAccountOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<DeployedSmartAccountResult | BuiltEvmTransactionResult | BuiltCallTransactionResult | DeployMachineSmartAccountTransactionData> {
        const { machineSmartAccountOwnerAddress, nonce, machineStationOwnerSignature, sendTransaction = true } = options;
        
        try {
            const createFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.DEPLOY_MACHINE_SMART_ACCOUNT)).substring(0, 10);

            const params = this.abiCoder.encode(
                ["address", "uint256", "bytes"],
                [machineSmartAccountOwnerAddress, nonce, machineStationOwnerSignature]
            );

            const payload = params.replace("0x", createFunctionSelector);
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
                    machineAccountOwnerAddress: machineSmartAccountOwnerAddress,
                    requiredRole: "STATION_MANAGER_ROLE",
                    note: "After transaction is mined, listen for MachineSmartAccountDeployed event to get the deployed address"
                } as DeployMachineSmartAccountTransactionData;
            }

            const result = await this._handleEvmTx(tx, `deploy machine smart account for ${machineSmartAccountOwnerAddress}`, statusCallback, txOptions);
            
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
            
            // If we found a deployed address, return the full result
            if (deployedAddress) {
                return {
                    message: `Successfully deployed machine smart account at address ${deployedAddress}.`,
                    deployedAddress: deployedAddress,
                    txHash: 'txHash' in result ? result.txHash : undefined,
                    receipt: 'receipt' in result ? result.receipt : undefined
                } as DeployedSmartAccountResult;
            }
            
            // If no deployed address found, return the original result
            return result as DeployedSmartAccountResult | BuiltEvmTransactionResult | BuiltCallTransactionResult;
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
        const { newMachineStationAddress, nonce, machineStationOwnerSignature, sendTransaction = true } = options;
        
        try {
            const createFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.TRANSFER_MACHINE_STATION_BALANCE)).substring(0, 10);

            const params = this.abiCoder.encode(
                ["address", "uint256", "bytes"],
                [newMachineStationAddress, nonce, machineStationOwnerSignature]
            );

            const payload = params.replace("0x", createFunctionSelector);
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

            return await this._handleEvmTx(tx, `transfer machine station balance to ${newMachineStationAddress}`, statusCallback, txOptions);
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
            const createFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.EXECUTE_TRANSACTION)).substring(0, 10);

            const params = this.abiCoder.encode(
                ["address", "bytes", "uint256", "uint256", "bytes"],
                [target, calldata, nonce, refundAmount, machineStationOwnerSignature]
            );

            const payload = params.replace("0x", createFunctionSelector);
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
                    accessControl: "Anyone can call with proper signatures"
                } as ExecuteTransactionData;
            }

            return await this._handleEvmTx(tx, `execute transaction on target ${target}`, statusCallback, txOptions);
        } catch (error: any) {
            throw new Error(`Failed to execute transaction: ${error.message}`);
        }
    }

    /**
     * Executes a transaction on behalf of a machine smart account.
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
            machineAccountAddress, 
            target, 
            calldata, 
            nonce, 
            refundAmount = 0n, 
            machineStationOwnerSignature, 
            smartAccountOwnerSignature, 
            sendTransaction = false 
        } = options;
        
        try {
            const createFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.EXECUTE_MACHINE_TRANSACTION)).substring(0, 10);

            const params = this.abiCoder.encode(
                ["address", "address", "bytes", "uint256", "uint256", "bytes", "bytes"],
                [machineAccountAddress, target, calldata, nonce, refundAmount, machineStationOwnerSignature, smartAccountOwnerSignature]
            );

            const payload = params.replace("0x", createFunctionSelector);
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
                    machineAccountAddress: machineAccountAddress,
                    target: target,
                    accessControl: "Anyone can call with proper signatures"
                } as ExecuteMachineTransactionData;
            }

            return await this._handleEvmTx(tx, `execute machine transaction from ${machineAccountAddress} on target ${target}`, statusCallback, txOptions);
        } catch (error: any) {
            throw new Error(`Failed to execute machine transaction: ${error.message}`);
        }
    }

    /**
     * Executes multiple transactions in a batch on behalf of machine smart accounts.
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
            smartAccountAddresses, 
            targets, 
            calldataList, 
            nonce, 
            refundAmount = 0n, 
            machineNonces = [], 
            machineStationOwnerSignature, 
            smartAccountOwnerSignatures, 
            sendTransaction = false 
        } = options;
        
        try {
            const createFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.EXECUTE_MACHINE_BATCH_TRANSACTIONS)).substring(0, 10);

            const params = this.abiCoder.encode(
                ["address[]", "address[]", "bytes[]", "uint256", "uint256", "uint256[]", "bytes", "bytes[]"],
                [smartAccountAddresses, targets, calldataList, nonce, refundAmount, machineNonces, machineStationOwnerSignature, smartAccountOwnerSignatures]
            );

            const payload = params.replace("0x", createFunctionSelector);
            const tx: EvmTransaction = {
                to: this.machineStationAddress,
                data: payload
            };

            if (!sendTransaction) {
                const accountsStr = smartAccountAddresses.join(", ");
                const targetsStr = targets.join(", ");
                return {
                    transactionData: tx,
                    message: "Transaction data ready for manual submission",
                    machineStationAddress: this.machineStationAddress,
                    function: "execute_machine_batch_transactions",
                    machineAccountAddresses: smartAccountAddresses,
                    targets: targets,
                    description: `Batch transactions from accounts [${accountsStr}] on targets [${targetsStr}]`,
                    accessControl: "Anyone can call with proper signatures"
                } as ExecuteMachineBatchTransactionsData;
            }

            const accountsStr = smartAccountAddresses.join(", ");
            const targetsStr = targets.join(", ");
            return await this._handleEvmTx(tx, `execute batch transactions from accounts [${accountsStr}] on targets [${targetsStr}]`, statusCallback, txOptions);
        } catch (error: any) {
            throw new Error(`Failed to execute machine batch transactions: ${error.message}`);
        }
    }

    /**
     * Transfers balance from a machine smart account to a recipient.
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
            smartAccountAddress, 
            recipientAddress, 
            nonce, 
            machineStationOwnerSignature, 
            smartAccountOwnerSignature, 
            sendTransaction = false 
        } = options;
        
        try {
            const createFunctionSelector = ethers.keccak256(ethers.toUtf8Bytes(MachineStationFactoryFunctionSignatures.EXECUTE_MACHINE_TRANSFER_BALANCE)).substring(0, 10);

            const params = this.abiCoder.encode(
                ["address", "address", "uint256", "bytes", "bytes"],
                [smartAccountAddress, recipientAddress, nonce, machineStationOwnerSignature, smartAccountOwnerSignature]
            );

            const payload = params.replace("0x", createFunctionSelector);
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
                    machineAccountAddress: smartAccountAddress,
                    recipientAddress: recipientAddress,
                    requiredRole: "STATION_MANAGER_ROLE"
                } as ExecuteTransferMachineBalanceData;
            }

            return await this._handleEvmTx(tx, `transfer balance from ${smartAccountAddress} to ${recipientAddress}`, statusCallback, txOptions);
        } catch (error: any) {
            throw new Error(`Failed to execute machine transfer balance: ${error.message}`);
        }
    }

    // =====================================================================
    // EIP-712 SIGNATURE GENERATION METHODS (ADMIN)
    // =====================================================================

    /**
     * Generates an admin signature for deploying a machine smart account.
     * Requires machineStationOwnerSigner to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignDeployMachineSmartAccount(
        options: AdminSignDeployMachineSmartAccountOptions
    ): Promise<string> {
        if (!this.machineStationOwnerSigner) {
            throw new Error('Machine station owner signer is required for admin signatures');
        }
        
        try {
            const { machineSmartAccountOwnerAddress, nonce } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineStationFactory",
                version: "2",
                chainId: chainId,
                verifyingContract: this.machineStationAddress,
            };

            const types = {
                DeployMachineSmartAccount: [
                    { name: "machineOwner", type: "address" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                machineOwner: machineSmartAccountOwnerAddress,
                nonce: nonce,
            };

            const signature = await this.machineStationOwnerSigner.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign deploy machine smart account: ${error.message}`);
        }
    }

    /**
     * Generates an admin signature for transferring machine station balance.
     * Requires machineStationOwnerSigner to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransferMachineStationBalance(
        options: AdminSignTransferMachineStationBalanceOptions
    ): Promise<string> {
        if (!this.machineStationOwnerSigner) {
            throw new Error('Machine station owner signer is required for admin signatures');
        }
        
        try {
            const { newMachineStationAddress, nonce } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineStationFactory",
                version: "2",
                chainId: chainId,
                verifyingContract: this.machineStationAddress,
            };

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

            const signature = await this.machineStationOwnerSigner.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign transfer machine station balance: ${error.message}`);
        }
    }

    /**
     * Generates an admin signature for executing a transaction.
     * Requires machineStationOwnerSigner to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransaction(
        options: AdminSignTransactionOptions
    ): Promise<string> {
        if (!this.machineStationOwnerSigner) {
            throw new Error('Machine station owner signer is required for admin signatures');
        }
        
        try {
            const { target, calldata, nonce, refundAmount = 0n } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineStationFactory",
                version: "2",
                chainId: chainId,
                verifyingContract: this.machineStationAddress,
            };

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

            const signature = await this.machineStationOwnerSigner.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign transaction: ${error.message}`);
        }
    }

    /**
     * Generates an admin signature for executing a machine transaction.
     * Requires machineStationOwnerSigner to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignMachineTransaction(
        options: AdminSignMachineTransactionOptions
    ): Promise<string> {
        if (!this.machineStationOwnerSigner) {
            throw new Error('Machine station owner signer is required for admin signatures');
        }
        
        try {
            const { machineAccountAddress, target, calldata, nonce, refundAmount = 0n } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineStationFactory",
                version: "2",
                chainId: chainId,
                verifyingContract: this.machineStationAddress
            };

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
                machineAddress: machineAccountAddress,
                target: target,
                data: calldata,
                nonce: nonce,
                refundAmount: refundAmount
            };

            const signature = await this.machineStationOwnerSigner.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign machine transaction: ${error.message}`);
        }
    }

    /**
     * Generates an admin signature for executing batch transactions.
     * Requires machineStationOwnerSigner to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignMachineBatchTransactions(
        options: AdminSignMachineBatchTransactionsOptions
    ): Promise<string> {
        if (!this.machineStationOwnerSigner) {
            throw new Error('Machine station owner signer is required for admin signatures');
        }
        
        try {
            const { 
                smartAccountAddresses, 
                targets, 
                calldataList, 
                nonce, 
                refundAmount = 0n, 
                machineNonces = [] 
            } = options;
            
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineStationFactory",
                version: "2",
                chainId: chainId,
                verifyingContract: this.machineStationAddress,
            };

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
                machineAddresses: smartAccountAddresses,
                targets: targets,
                data: calldataList,
                nonce: nonce,
                refundAmount: refundAmount,
                machineNonces: machineNonces
            };

            const signature = await this.machineStationOwnerSigner.signTypedData(domain, types, message);
            return signature;
        } catch (error: any) {
            throw new Error(`Failed to sign machine batch transactions: ${error.message}`);
        }
    }

    /**
     * Generates an admin signature for transferring machine balance.
     * Requires machineStationOwnerSigner to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransferMachineBalance(
        options: AdminSignTransferMachineBalanceOptions
    ): Promise<string> {
        if (!this.machineStationOwnerSigner) {
            throw new Error('Machine station owner signer is required for admin signatures');
        }
        
        try {
            const { smartAccountAddress, recipientAddress, nonce } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineStationFactory",
                version: "2",
                chainId: chainId,
                verifyingContract: this.machineStationAddress,
            };

            const types = {
                ExecuteMachineTransferBalance: [
                    { name: "machineAddress", type: "address" },
                    { name: "recipientAddress", type: "address" },
                    { name: "nonce", type: "uint256" },
                ],
            };

            const message = {
                machineAddress: smartAccountAddress,
                recipientAddress: recipientAddress,
                nonce: nonce,
            };

            const signature = await this.machineStationOwnerSigner.signTypedData(domain, types, message);
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
     * Returns the message structure for frontend wallet signing.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signable message object
     */
    public async machineSignMachineTransaction(
        options: MachineSignMachineTransactionOptions
    ): Promise<EIP712SignableMessage> {
        try {
            const { machineAccountAddress, target, calldata, nonce } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineSmartAccount",
                version: "2",
                chainId: chainId,
                verifyingContract: machineAccountAddress,
            };

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
     * Returns the message structure for frontend wallet signing.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signable message object
     */
    public async machineSignTransferMachineBalance(
        options: MachineSignTransferMachineBalanceOptions
    ): Promise<EIP712SignableMessage> {
        try {
            const { smartAccountAddress, recipientAddress, nonce } = options;
            const chainId = await this.getChainId();
            const domain = {
                name: "MachineSmartAccount",
                version: "2",
                chainId: chainId,
                verifyingContract: smartAccountAddress,
            };

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

    private async _handleEvmTx(
        tx: EvmTransaction, 
        action: string, 
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, 
        txOptions?: txOptions
    ): Promise<MachineStationWriteResult> {
        if (!this.metadata.pair) {
            return { message: `Constructed ${action} tx (unsigned).`, tx } as BuiltEvmTransactionResult;
        }
        try {
            return await this._send_evm_tx(tx, statusCallback, txOptions);
        } catch (err: any) {
            throw new Error(`Failed to ${action}: ${err?.message ?? err}`);
        }
    }
} 