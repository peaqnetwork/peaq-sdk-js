

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
    const vault = "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3";

    // 3. Unpause Token
    const result = await rwa_sdk.vault.unpauseToken({
      vaultDeployer: vaultDeployer,
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      vault: vault
    });
    expect(['unpaused']).toContain(result.status);
    expect(result.vault).toBe(vault);
    expect(result.vaultFactory).toBe('0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53');
    expect(result.unpausedBy).toBe(vaultDeployer.address);
    expect(result.receipt).toBeDefined();
    expect(result.receipt?.status).toBe(1);

  }, 60_000);
});