

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

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
    const vault = "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656";

    // 3. Deposit Yield
    const result = await rwa_sdk.vault.depositYield({
      depositorSigner: alice,
      vault: vault,
      erc20: rwa_sdk.getAddresses().erc20.peaq,
      decimals: 18,
      humanReadableAmount: "1"
    });
    // console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Yield deposited for vault');
    expect(result.result).toContain(vault);
    expect(result.result).toContain('with amount');
    expect(result.result).toContain(1);

  }, 60_000);
});