

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
    const vault = "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3";   

    // 3. Claim Yield
    const result = await rwa_sdk.vault.claimYieldTo({
        claimerSigner: alice,
        vault: vault,
        to: bob.address
    });
    expect(['claimed']).toContain(result.status);
    expect(result).toBeDefined();
    expect(result.vault).toBe(vault);
    expect(result.rewardDistributor).toBeDefined();
    expect(result.rewardDistributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.claimer).toBe(await alice.getAddress());
    expect(result.recipient).toBe(bob.address);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);
  }, 60_000);
});