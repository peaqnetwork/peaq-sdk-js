

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('vault.registerIdentity [integration]', () => {
  it.skip('registers 3 identities', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet to register identity
    const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Iterate through 3 wallets and register the identities
    for (const wallet of [process.env.ALICE_PUBLIC_ADDRESS!, process.env.BOB_PUBLIC_ADDRESS!, process.env.CHARLIE_PUBLIC_ADDRESS!]) {
      const identity = await rwa_sdk.onchainid.getIdentity({ subject: wallet });
      console.log(identity.identity);
      console.log(wallet);
      const result = await rwa_sdk.vault.registerIdentity({
        vaultDeployer: vaultDeployer,
        vault: "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656",
        subject: wallet,
        subjectIdentity: identity.identity!,
        country: "0"
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('result');
      expect(typeof result.result).toBe('string');
      expect(result.result).toContain('Registered eoa');
      expect(result.result).toContain(wallet);
      expect(result.result).toContain(identity.identity);
    }

  }, 60_000);
});