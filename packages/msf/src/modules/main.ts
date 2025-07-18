import { JsonRpcProvider, Signer } from 'ethers';

import { Base } from './base';
import { ChainType, SDKMetadata, ConfirmationMode, VerificationMethodType, CreateMachineStationInstanceOptions } from '../types/common';
import { MachineStation } from './machineStation';

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

    public readonly machineStation: MachineStation;

    /**
     * Initializes the Main class with machine station functionality for EVM operations.
     * 
     * @param options - Configuration options for the machine station instance including EVM RPC URL and signers
     */
    constructor(
        options: CreateMachineStationInstanceOptions
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
    static async createMachineStationInstance(
        options: CreateMachineStationInstanceOptions
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
}