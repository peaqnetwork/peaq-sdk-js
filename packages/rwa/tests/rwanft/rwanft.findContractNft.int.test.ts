

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('rwa.findContractNft [integration]', () => {    
  it.skip('finds a contract NFT by contract ID', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    const contractId = "1234567890";
    const contractNft = await rwa_sdk.rwanft.findContractNft({ contractId: contractId });
    expect(contractNft).toBeDefined();
    expect(contractNft).toHaveProperty('contractNft');
    expect(typeof contractNft.contractNft).toBe('string');
    expect(contractNft.contractNft).toBe('0xA00ee5b948E3E1cb293f57F7008721353416Aa2E');

    const usedContractId = "100029413485835746184994811893588555499363699086818240224380117841719712643928";
    await expect(
      rwa_sdk.rwanft.findContractNft({
        contractId: usedContractId,
      })
    ).rejects.toThrow(/Not available, please contact owner/i); 
  }, 60_000);
});