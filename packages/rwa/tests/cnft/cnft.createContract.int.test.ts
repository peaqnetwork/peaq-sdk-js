

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

(shouldRun ? describe.sequential : describe.skip)('cnft.createContract [integration]', () => {
  it('creates a Contract NFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Contract initiator wallet (submits tx and pays native deposit)
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Counterparty wallet (co-signs the contract)
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);

    // 3. Create MachineNFT(s) for Alice
    const result = await rwa_sdk.cnft.createContract({
        contractInitiator: alice,
        counterparties: [bob.address],
        contractNft: "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E",
        content: "This is a test contract",
        hashDigest: "0x1234567890",
        url: "https://example.com"
    });

    console.log('Result', result);

  }, 60_000);
});