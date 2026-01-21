

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256, toUtf8Bytes } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { contractId as computeContractId } from '../../src/utils/nft';


const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

(shouldRun ? describe.sequential : describe.skip)('vault.registerIdentity [integration]', () => {
  it.skip('registers an identity', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet to register identity
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get alice wallet to register identity
    const alice = await rwa_sdk.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_ADDRESS! });

    // 3. Create Vault
    const result = await rwa_sdk.vault.registerIdentity({
      admin: admin,
      vault: "0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955",
      eoa: process.env.ALICE_PUBLIC_ADDRESS!,
      identity: alice.identity,
      country: "0"
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Registered eoa');
    expect(result.result).toContain(process.env.ALICE_PUBLIC_ADDRESS!);
    expect(result.result).toContain(alice.identity);

  }, 60_000);
});