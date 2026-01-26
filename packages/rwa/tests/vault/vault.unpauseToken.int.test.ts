

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('vault.unpauseToken [integration]', () => {    
  it.skip('unpauses a token', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet
    const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get known vault address
    const vault = "0xc5233ACEe90e6f756D506f3a79179401ae4B3977";

    // 3. Unpause Token
    const result = await rwa_sdk.vault.unpauseToken({
      vaultDeployer: vaultDeployer,
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      vault: vault
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('receipt');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Unpaused token for vault:');
    expect(result.result).toContain(vault);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);

  }, 60_000);
});