// external imports
import { ApiPromise } from '@polkadot/api';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';

// local imports
import { Main } from '../main';
import { 
    ChainType,
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
    MachineStationConfigKeys,
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
    private machineStationOwnerWallet: Wallet;

    /**
     * Initializes MachineStation with a connected API instance and shared SDK metadata.
     * 
     * @param sdk - Instance of the peaq SDK to create and send txs
     * @param api - The blockchain API connection (JsonRpcProvider for EVM)
     * @param metadata - Shared metadata, including chain type and optional signer
     * @param machineStationAddress - The address of the machine station factory contract
     * @param machineStationOwnerPrivateKey - Optional private key for machine station owner operations
     */
    constructor(
        sdk: Main,
        api: JsonRpcProvider, 
        metadata: SDKMetadata, 
        machineStationAddress: string,
        machineStationOwnerPrivateKey: string
    ) {
        super(api, metadata);
        this.sdk = sdk;
        this.machineStationAddress = machineStationAddress;
        this.machineStationOwnerWallet = new Wallet(machineStationOwnerPrivateKey, api);
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
                    transaction_data: tx,
                    message: "Transaction data ready for manual submission",
                    machine_station_address: this.machineStationAddress,
                    function: "update_configs",
                    config_key: key,
                    config_value: Number(value),
                    required_role: "STATION_MANAGER_ROLE"
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
        // TODO: Implement smart account deployment logic
        throw new Error('deployMachineSmartAccount not yet implemented');
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
        // TODO: Implement balance transfer logic
        throw new Error('transferMachineStationBalance not yet implemented');
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
        // TODO: Implement transaction execution logic
        throw new Error('executeTransaction not yet implemented');
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
        // TODO: Implement machine transaction execution logic
        throw new Error('executeMachineTransaction not yet implemented');
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
        // TODO: Implement batch transaction execution logic
        throw new Error('executeMachineBatchTransactions not yet implemented');
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
        // TODO: Implement machine balance transfer logic
        throw new Error('executeMachineTransferBalance not yet implemented');
    }

    // =====================================================================
    // EIP-712 SIGNATURE GENERATION METHODS (ADMIN)
    // =====================================================================

    /**
     * Generates an admin signature for deploying a machine smart account.
     * Requires machineStationOwnerWallet to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignDeployMachineSmartAccount(
        options: AdminSignDeployMachineSmartAccountOptions
    ): Promise<string> {
        if (!this.machineStationOwnerWallet) {
            throw new Error('Machine station owner wallet is required for admin signatures');
        }
        // TODO: Implement EIP-712 signature generation for deploy smart account
        throw new Error('adminSignDeployMachineSmartAccount not yet implemented');
    }

    /**
     * Generates an admin signature for transferring machine station balance.
     * Requires machineStationOwnerWallet to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransferMachineStationBalance(
        options: AdminSignTransferMachineStationBalanceOptions
    ): Promise<string> {
        if (!this.machineStationOwnerWallet) {
            throw new Error('Machine station owner wallet is required for admin signatures');
        }
        // TODO: Implement EIP-712 signature generation for balance transfer
        throw new Error('adminSignTransferMachineStationBalance not yet implemented');
    }

    /**
     * Generates an admin signature for executing a transaction.
     * Requires machineStationOwnerWallet to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransaction(
        options: AdminSignTransactionOptions
    ): Promise<string> {
        if (!this.machineStationOwnerWallet) {
            throw new Error('Machine station owner wallet is required for admin signatures');
        }
        // TODO: Implement EIP-712 signature generation for transaction
        throw new Error('adminSignTransaction not yet implemented');
    }

    /**
     * Generates an admin signature for executing a machine transaction.
     * Requires machineStationOwnerWallet to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignMachineTransaction(
        options: AdminSignMachineTransactionOptions
    ): Promise<string> {
        if (!this.machineStationOwnerWallet) {
            throw new Error('Machine station owner wallet is required for admin signatures');
        }
        // TODO: Implement EIP-712 signature generation for machine transaction
        throw new Error('adminSignMachineTransaction not yet implemented');
    }

    /**
     * Generates an admin signature for executing batch transactions.
     * Requires machineStationOwnerWallet to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignMachineBatchTransactions(
        options: AdminSignMachineBatchTransactionsOptions
    ): Promise<string> {
        if (!this.machineStationOwnerWallet) {
            throw new Error('Machine station owner wallet is required for admin signatures');
        }
        // TODO: Implement EIP-712 signature generation for batch transactions
        throw new Error('adminSignMachineBatchTransactions not yet implemented');
    }

    /**
     * Generates an admin signature for transferring machine balance.
     * Requires machineStationOwnerWallet to be initialized.
     * 
     * @param options - The signature options
     * @returns Promise resolving to the EIP-712 signature string
     */
    public async adminSignTransferMachineBalance(
        options: AdminSignTransferMachineBalanceOptions
    ): Promise<string> {
        if (!this.machineStationOwnerWallet) {
            throw new Error('Machine station owner wallet is required for admin signatures');
        }
        // TODO: Implement EIP-712 signature generation for machine balance transfer
        throw new Error('adminSignTransferMachineBalance not yet implemented');
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
        // TODO: Implement EIP-712 message creation for machine transaction
        throw new Error('machineSignMachineTransaction not yet implemented');
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
        // TODO: Implement EIP-712 message creation for machine balance transfer
        throw new Error('machineSignTransferMachineBalance not yet implemented');
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