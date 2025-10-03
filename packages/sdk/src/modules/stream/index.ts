// external imports
import { ApiPromise } from '@polkadot/api';
import { JsonRpcProvider, Eip1193Provider } from 'ethers';
import { StreamrClient } from '@streamr/sdk';

// local imports
import { SDKMetadata } from '../../types/common.js';
import { Base } from '../base.js';

/**
 * Provides methods to interact with the peaq on-chain storage precompile (EVM)
 * or pallet (Substrate). Supports add, get, update, and remove operations.
 */
export class Streamr extends Base {
    // private abiCoder = new ethers.AbiCoder();

    /**
     * Initializes Storage with a connected API instance and shared SDK metadata.
     * 
     * @param api - The blockchain API connection, which may be ApiPromise (Substrate) or JsonRpcProvider (EVM)
     * @param metadata - Shared metadata, including chain type and optional signer
     */
    constructor(api: ApiPromise | JsonRpcProvider, metadata: SDKMetadata) {
        super(api, metadata);
    }


    public async createInstancePeaq(
        privateKey: string
    ): Promise<StreamrClient> {
        const streamr = new StreamrClient({
            auth: {
                privateKey: privateKey
            },
            environment: 'peaq'
        })
        return streamr
    }

    public async createInstanceClient(
        provider: Eip1193Provider
    ): Promise<StreamrClient> {
        const streamr = new StreamrClient({
            auth: {
                ethereum: provider
            },
            environment: 'peaq'
        })
        return streamr
    }

    public async createInstancePublic(): Promise<StreamrClient> {
        const streamr = new StreamrClient({environment: 'peaq'})
        return streamr
    }
}