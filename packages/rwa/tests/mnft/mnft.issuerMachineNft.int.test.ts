

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256 } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

// This is a smoke test that requires env vars and a live endpoint.
// It will be skipped automatically if env vars are missing.

const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

// Integration test that creates or returns an existing identity
(shouldRun ? describe.sequential : describe.skip)('mnft.issueMachineNFT [integration]', () => {
  it.skip('issues a Machine NFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Admin wallet (submits tx and pays native deposit)
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Machine owner (receives NFT and pays ERC20 fee via allowance)
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 3. Create MachineNFT(s) for Alice
    const result = await rwa_sdk.mnft.issueMachineNFT({
        machineValue: 10n,
        machineIssuer: admin,
        machineOwner: alice,
        machineNFT: "0xaBB3961281123C336596153C4dfE83E11498fc54",
        runSeed: Math.floor(Math.random() * 10000),
        count: 2
    });

    console.log('Result', result);

    expect(result.result).toContain('Machine registration fees paid');
  }, 60_000);
});