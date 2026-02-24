

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
      const result = await rwa_sdk.vault.registerIdentity({
        vaultDeployer: vaultDeployer,
        vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
        subject: wallet,
        subjectIdentity: identity.identity!,
        country: "0"
      });
      expect(['registered']).toContain(result.status);
      expect(result.status).toBe('registered');
      expect(result.vault).toBe('0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3');
      expect(result.subject).toBe(wallet);
      expect(result.subjectIdentity).toBe(identity.identity!);
      expect(result.country).toBe('0');
      expect(result.registeredBy).toBe(vaultDeployer.address);
      expect(result.receipt).toBeDefined();
      expect(result.receipt.status).toBe(1);
    }

  }, 60_000);
});