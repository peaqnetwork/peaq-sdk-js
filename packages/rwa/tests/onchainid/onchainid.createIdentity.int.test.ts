import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


// Integration test that creates or returns an existing identity
describe.sequential('OnchainID.createIdentity [integration]', () => {
  it.skip('creates or returns existing identity', async () => {
    // 0. Create RWA instance and provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL!);
    const rwa = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get ID Factory admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Create identity
    const salt = 'identity-' + Date.now().toString();
    const result = await rwa.onchainid.createIdentity({ idFactoryAdmin: admin, subject: process.env.ALICE_PUBLIC_ADDRESS!, deploymentSalt: salt });

    expect(['created', 'exists']).toContain(result.status);
    expect(result.identity).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // 3. Check if the identity was created
    const identity = await rwa.onchainid.getIdentity({ subject: process.env.ALICE_PUBLIC_ADDRESS! });
    expect(result.identity).toBe(identity.identity);

  }, 60_000);
});