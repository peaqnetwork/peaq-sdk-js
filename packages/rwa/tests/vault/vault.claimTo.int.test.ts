

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('vault.claimYieldTo [integration]', () => {    
  it.skip('claims yield to a given address', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get bob wallet
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);

    // 3. Get known vault address
    const vault = "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656";   

    // 3. Claim Yield
    const result = await rwa_sdk.vault.claimYieldTo({
        claimerSigner: alice,
        vault: vault,
        to: bob.address
    });
    // console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Yield claimed for vault');
    expect(result.result).toContain(vault);
  }, 60_000);
});