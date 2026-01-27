

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('rwa.findContractNft [integration]', () => {    
  it('finds a contract NFT by contract ID', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    const contractId = "100029413485835746184994811893588555499363699086818240224380117841719712643928";
    const contractNft = await rwa_sdk.rwa.findContractNft({ contractId: contractId });
    console.log(contractNft);
    // confused on why this is failing
  }, 60_000);
});