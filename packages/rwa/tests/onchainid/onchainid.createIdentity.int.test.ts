import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

// This is a smoke test that requires env vars and a live endpoint.
// It will be skipped automatically if env vars are missing.

const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

// Integration test that creates or returns an existing identity
(shouldRun ? describe : describe.skip)('OnchainID.createIdentity [integration]', () => {
  it('creates or returns existing identity', async () => {
    const provider = new JsonRpcProvider(HTTPS_BASE_URL);
    const rwa = new RWA({ chainId: Chain.AGUNG, provider });
    const admin = new Wallet(ADMIN_PRIVATE_KEY!, provider);

    const salt = 'identity-' + Date.now().toString();
    const result = await rwa.onchainid.createIdentity({ admin, eoa: ALICE_PUBLIC_ADDRESS!, salt });
    console.log(result);

    expect(['created', 'exists']).toContain(result.status);
    expect(result.identity).toMatch(/^0x[a-fA-F0-9]{40}$/);
  }, 60_000);
});