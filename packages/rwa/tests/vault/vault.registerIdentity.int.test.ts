

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('vault.registerIdentity [integration]', () => {
  it.skip('registers an identity', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet to register identity
    const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get alice wallet to register identity
    const alice = await rwa_sdk.onchainid.getIdentity({ subject: process.env.CHARLIE_PUBLIC_ADDRESS! });

    // 3. Create Vault
    const result = await rwa_sdk.vault.registerIdentity({
      vaultDeployer: vaultDeployer,
      vault: "0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af",
      subject: process.env.CHARLIE_PUBLIC_ADDRESS!,
      subjectIdentity: alice.identity,
      country: "0"
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Registered eoa');
    expect(result.result).toContain(process.env.CHARLIE_PUBLIC_ADDRESS!);
    expect(result.result).toContain(alice.identity);

  }, 60_000);
});