import { ApiPromise, WsProvider } from '@polkadot/api';
import { JsonRpcProvider } from 'ethers';

import { cryptoWaitReady, mnemonicValidate } from '@polkadot/util-crypto';

import { Base } from './base';
import { ChainType, SDKMetadata, CreateInstanceOptions, KeyType, ConfirmationMode, VerificationMethodType } from '../types/common';

import { Did } from './did';
import { DIDVersion } from '../types/did';
import { Storage } from './storage';
import { MachineStation } from './machineStation';

/**
 * Entry point for the TypeScript SDK.
 * 
 * The Main class serves as the primary interface for the SDK, providing methods for 
 * initializing the signer, creating the API connection, and handling blockchain-specific operations.
 * It inherits from Base, which contains common logic for both EVM and Substrate operations.
 */
export class Main extends Base {
    static ChainType = ChainType;
    static ConfirmationMode = ConfirmationMode;
    static VerificationMethodType = VerificationMethodType;

    public readonly did: Did;
    public readonly storage: Storage;
    public machineStation?: MachineStation;


    /**
     * Initializes the Main class, representing the primary interface for the SDK.
     * 
     * @param options - Configuration options for the SDK instance
     */
    constructor(
        options: CreateInstanceOptions
    ) {
        const metadata: SDKMetadata = {
            baseUrl: options.baseUrl,
            chainType: options.chainType,
            pair: undefined,
            machineStation: options.machineStation || false,
            didVersion: DIDVersion.V2_1_0, // HARDCODE to V2.1.0 until v3.0.0 is released
            keyType: options.chainType === ChainType.EVM 
                ? KeyType.ECDSA  // EVM always uses ECDSA (no user override)
                : (options.keyType || KeyType.SR25519)  // Substrate allows SR25519 or ED25519 choice
        };

        const api = Main.createApi(metadata);
        super(api, metadata);

        this.did = new Did(api, metadata);
        this.storage = new Storage(api, metadata);
    }

    /**
     * Creates and returns a new instance of the SDK, connecting to the specified network.
     * 
     * @param baseUrl - The connection URL for the blockchain
     * @param chainType - Indicates whether the blockchain is EVM or Substrate
     * @param seed - The secret (mnemonic phrase or private key) used to generate the signer
     * @returns An initialized SDK object ready for executing blockchain operations
     */
    static async createInstance(
        options: CreateInstanceOptions
    ): Promise<Main> {
        await cryptoWaitReady();
        const sdk = new Main(options);
        await sdk.connect();
        await sdk.initializeSigner(options.seed);
        return sdk;
    }

    /**
     * Creates and returns a new instance of the SDK configured for a machine station.
     * 
     * @param baseUrl - The connection URL for the blockchain
     * @param machineStationAddress - The address of the machine station
     * @param machineStationOwnerPrivateKey - Private key for the machine station owner
     * @returns An initialized SDK object with machine station module
     */
    static async createMachineStationInstance(
        baseUrl: string,
        machineStationAddress: string,
        machineStationOwnerPrivateKey: string
    ): Promise<Main> {
        await cryptoWaitReady();
        const options: CreateInstanceOptions = {
            baseUrl,
            chainType: ChainType.EVM,
            machineStation: true
        };
        const sdk = new Main(options);
        await sdk.connect();
        await sdk.initializeSigner(machineStationOwnerPrivateKey);

        sdk.machineStation = new MachineStation(
            sdk,
            sdk.api as JsonRpcProvider,
            sdk.metadata,
            machineStationAddress,
            machineStationOwnerPrivateKey
        );

        return sdk;
    }

  /**
   * Connects the SDK to the network. 
   * 
   * If chainType is EVM no connection is established.
   */
  public async connect(): Promise<void> {
    try {
      if (this.metadata.chainType === ChainType.EVM) {
        return
      }
      if (this.api instanceof ApiPromise) {
        await this.api.isReadyOrError;
      }
    } catch (e) {
      throw new Error(`Connection error: ${e}`);
    }
  }

 /**
   * Disconnects the SDK from the network and cleans up all connections.
   */
  public async disconnect(): Promise<void> {
    try {
        if (this.api instanceof ApiPromise) {
            // Substrate connection cleanup
            await this.api.disconnect();
        } 
        else if (this.api instanceof JsonRpcProvider) {
            this.api.removeAllListeners();
        }
    } catch (error) {
        console.error('Failed to disconnect:', error);
    }
  }

    /**
     * Creates the appropriate blockchain API instance based on the chain type.
     */
    private static createApi(metadata: SDKMetadata): ApiPromise | JsonRpcProvider {
        const { baseUrl, chainType } = metadata;

        if (chainType === ChainType.EVM) {
            if (!baseUrl.startsWith('https://')) {
                throw new Error('Invalid base URL for EVM chain. Must start with https://');
            }
            return new JsonRpcProvider(baseUrl);
        } else {
            if (!baseUrl.startsWith('wss://')) {
                throw new Error('Invalid base URL for Substrate chain. Must start with wss://');
            }
            const provider = new WsProvider(baseUrl);
            return new ApiPromise({ provider });
        }
    }
    /**
     * Initializes the signer by validating and setting the secret used for generating the key pair/account.
     * @param seed - The mnemonic phrase or private key used to generate the key pair
     */
    private async initializeSigner(seed?: string): Promise<void> {
        await this.validateSecret(seed);
        await this.setMetadata(seed);
    }

    /**
     * Validates that the provided seed is compatible with EVM or Substrate.
     * @param seed - The private key (for EVM) or mnemonic phrase (for Substrate) to validate
     * @throws Error if the EVM private key is invalid or if the substrate mnemonic is invalid
     */
    private async validateSecret(seed?: string): Promise<void> {
        if (!seed) return;

        if (this.metadata.chainType === ChainType.EVM) {
            const keyStr = seed.startsWith('0x') ? seed.slice(2) : seed;
            if (keyStr.length !== 64) {
                throw new Error('Invalid EVM private key length. Expected 64 hex characters (excluding "0x" prefix).');
            }
            try {
                parseInt(keyStr, 16);
            } catch {
                throw new Error('Invalid EVM private key. It must be a valid hexadecimal string.');
            }
        } else {
            const words = seed.trim().split(' ');
            if (![12, 24].includes(words.length)) {
                this.disconnect();
                throw new Error('Invalid substrate mnemonic. Expected 12 or 24 words.');
            }
            if (!mnemonicValidate(seed)) {
                this.disconnect();
                throw new Error('Invalid substrate mnemonic format.');
            }
        }
    }

    /**
     * Generates a cryptographic key pair from the provided seed and stores it in the SDK metadata.
     * @param seed - The mnemonic phrase (for Substrate) or private key (for EVM)
     */
    private async setMetadata(seed?: string): Promise<void> {
        if (!seed) return;
        this._createKeyPair(seed, this.metadata.keyType);
    }
}