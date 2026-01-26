

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('cnft.isContractIdAvailable [integration]', () => {
  it('checks if a Contract ID is available', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Check if a Contract ID is available
    const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
    const isContractIdAvailableResult = await rwa_sdk.cnft.isContractIdAvailable({
        contractNft: contractNft,
        contractId: "1"
    });
    expect(isContractIdAvailableResult).toBeDefined();
    expect(isContractIdAvailableResult).toHaveProperty('available');
    expect(typeof isContractIdAvailableResult.available).toBe('boolean');
    expect(isContractIdAvailableResult.available).toBe(true);

  }, 60_000);
});