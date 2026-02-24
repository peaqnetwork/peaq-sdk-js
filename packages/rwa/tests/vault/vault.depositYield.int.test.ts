

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, parseUnits, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.depositYield [integration]', () => {
  it.skip('deposits yield to a vault', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get known vault address
    const vault = "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3";

    // 3. Deposit Yield
    const result = await rwa_sdk.vault.depositYield({
      depositorSigner: alice,
      vault: vault,
      erc20: rwa_sdk.getAddresses().erc20.peaq,
      decimals: 18,
      humanReadableAmount: "1"
    });
    expect(['deposited']).toContain(result.status);
    expect(result).toBeDefined();
    expect(result.vault).toBe(vault);
    expect(result.rewardDistributor).toBeDefined();
    expect(result.rewardDistributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.depositor).toBe(await alice.getAddress());
    expect(result.token.address).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result.token.decimals).toBe(18);
    expect(result.amount.human).toBe("1");
    expect(result.amount.units).toBe(parseUnits("1", 18));
    expect(result.approval.status).toBe('approved');
    expect(result.approval.spender).toBe(result.rewardDistributor);
    expect(result.approval.allowanceBefore).toBe(0n);
    expect(result.approval.allowanceAfter).toBe(parseUnits("1", 18));
    expect(result.receipt.status).toBe(1);

  }, 60_000);
});