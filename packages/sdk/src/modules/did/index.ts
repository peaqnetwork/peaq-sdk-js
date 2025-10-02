import { ApiPromise } from '@polkadot/api';
import { JsonRpcProvider } from 'ethers';
import { SDKMetadata, txOptions } from '../../types/common.js';
import { Base } from '../base.js';
import { DIDVersion, CreateDIDOptions, UpdateDIDOptions, RemoveDIDOptions, ReadDIDOptions, ReadDIDResult, DidWriteResult } from '../../types/did.js';
import { DIDV2Implementation } from './v2_implementation.js';
import { DIDV3Implementation } from './v3_implementation.js';
import { TransactionStatusCallback } from '../../types/base.js';
export class Did extends Base {
    private implementation: DIDV2Implementation | DIDV3Implementation;

    constructor(api: ApiPromise | JsonRpcProvider, metadata: SDKMetadata) {
        super(api, metadata);
        
        // Default to V2.1.0 if no version specified (future should be V3.0.0)
        const version = metadata.didVersion || DIDVersion.V2_1_0;
        
        // Select implementation based on version
        this.implementation = this.getImplementation(version);

        
    }

    private getImplementation(version: DIDVersion): DIDV2Implementation | DIDV3Implementation {
        switch (version) {
            case DIDVersion.V2_1_0:
                return new DIDV2Implementation(this.api, this.metadata);
            case DIDVersion.V3_0_0:
                return new DIDV3Implementation(this.api, this.metadata);
            default:
                throw new Error(`Unsupported DID version: ${version}`);
        }
    }

    /**
     * Creates a new DID document based on the specified version
     */
    public async create(options: CreateDIDOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<DidWriteResult> {
        return this.implementation.create(options, statusCallback, txOptions);
    }

    /**
     * Retrieves a DID document
     * Reads a DID document with enhanced options including EVM chain support
     */
    public async read(options: ReadDIDOptions): Promise<ReadDIDResult | null> {
        return (this.implementation as any).read(options);
    }

    /**
     * Updates a DID document
     */
    public async update(options: UpdateDIDOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<DidWriteResult> {
        return (this.implementation as any).update(options, statusCallback, txOptions);
    }

    /**
     * Deactivates a DID
     */
    public async remove(options: RemoveDIDOptions,
        statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
        txOptions?: txOptions
    ): Promise<DidWriteResult> {
        return (this.implementation as any).remove(options, statusCallback, txOptions);
    }
} 