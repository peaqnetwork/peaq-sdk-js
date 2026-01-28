

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('vault.pauseToken [integration]', () => {    
  it.skip('pauses a token', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet
    const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get known vault address
    const vault = "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656";

    // 3. Pause Token
    const result = await rwa_sdk.vault.pauseToken({
      vaultDeployer: vaultDeployer,
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      vault: vault
    });
    console.log(result);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('receipt');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Paused token for vault:');
    expect(result.result).toContain(vault);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);

  }, 60_000);
});