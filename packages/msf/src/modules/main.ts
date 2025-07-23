import { JsonRpcProvider, Signer } from 'ethers';

import { Base } from './base';
import { ChainType, SDKMetadata, ConfirmationMode, VerificationMethodType, CreateInstanceOptions, txOptions } from '../types/common';
import { MachineStation } from './machineStation';
import { TransactionStatusCallback } from '../types/base';
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
} from '../types/machineStation';

/**
 * Entry point for the Machine Station SDK.
 * 
 * The Main class serves as the primary interface for interacting with Machine Station Factory
 * smart contracts on EVM-compatible blockchains. It provides methods for initializing ethers
 * signers, creating JsonRpcProvider connections, and managing machine station operations.
 * This is a standalone module that only supports EVM chains via ethers.js.
 */
export class Main extends Base {
    static ChainType = ChainType;
    static ConfirmationMode = ConfirmationMode;
    static VerificationMethodType = VerificationMethodType;

    private machineStation: MachineStation;

    /**
     * Initializes the Main class with machine station functionality for EVM operations.
     * 
     * @param options - Configuration options for the machine station instance including EVM RPC URL and signers
     */
    constructor(
        options: CreateInstanceOptions
    ) {
        const metadata: SDKMetadata = {
            baseUrl: options.baseUrl,
            chainType: ChainType.EVM,
            pair: undefined,
            machineStation: true
        };

        const api = Main.createApi(metadata);
        super(api, metadata);

        // Initialize machine station with properly connected signers
        this.machineStation = new MachineStation(
            api,
            metadata,
            options.machineStationAddress,
            options.stationAdmin.connect(api),
            options.stationManager?.connect(api)
        );
    }

    /**
     * Creates and returns a new instance of the Machine Station SDK configured for EVM operations.
     * 
     * @param options - Configuration options including EVM RPC baseUrl, machineStationAddress, stationAdmin, and optional stationManager signers
     * @returns An initialized Machine Station SDK instance ready for smart contract interactions
     */
    static async createInstance(
        options: CreateInstanceOptions
    ): Promise<Main> {
        const sdk = new Main(options);
        
        // Set the station admin as the primary signer for base operations
        sdk._setSigner(options.stationAdmin);

        return sdk;
    }

    /**
     * Creates an EVM JsonRpcProvider instance for connecting to EVM-compatible blockchains.
     */
    private static createApi(metadata: SDKMetadata): JsonRpcProvider {
        const { baseUrl, chainType } = metadata;

        if (chainType === ChainType.EVM) {
            if (!baseUrl.startsWith('https://')) {
                throw new Error('Invalid base URL for EVM chain. Must start with https://');
            }
            return new JsonRpcProvider(baseUrl);
        } else {
            throw new Error('Only EVM chain type is supported by Machine Station SDK');
        }
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
        return this.machineStation.updateConfigs(options, statusCallback, txOptions);
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
        return this.machineStation.deployMachineSmartAccount(options, statusCallback, txOptions);
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
        return this.machineStation.transferMachineStationBalance(options, statusCallback, txOptions);
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
        return this.machineStation.executeTransaction(options, statusCallback, txOptions);
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
        return this.machineStation.executeMachineTransaction(options, statusCallback, txOptions);
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
        return this.machineStation.executeMachineBatchTransactions(options, statusCallback, txOptions);
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
        return this.machineStation.executeMachineTransferBalance(options, statusCallback, txOptions);
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
        return this.machineStation.adminSignDeployMachineSmartAccount(options);
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
        return this.machineStation.adminSignTransferMachineStationBalance(options);
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
        return this.machineStation.adminSignTransaction(options);
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
        return this.machineStation.adminSignMachineTransaction(options);
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
        return this.machineStation.adminSignMachineBatchTransactions(options);
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
        return this.machineStation.adminSignTransferMachineBalance(options);
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
        machineOwnerSigner?: Signer
    ): Promise<string | EIP712SignableMessage> {
        return this.machineStation.machineSignMachineTransaction(options, machineOwnerSigner);
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
        return this.machineStation.machineSignTransferMachineBalance(options, machineOwnerSigner);
    }
}