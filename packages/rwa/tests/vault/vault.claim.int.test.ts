

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.claimYield [integration]', () => {    
  it.skip('claims yield from a vault', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get known vault address
    const vault = "0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af";

    // 3. Claim Yield
    const result = await rwa_sdk.vault.claimYield({
        claimerSigner: alice,
        vault: vault
    });
    // console.log(result);  
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Yield claimed for vault');
    expect(result.result).toContain(vault);
  }, 60_000);
});