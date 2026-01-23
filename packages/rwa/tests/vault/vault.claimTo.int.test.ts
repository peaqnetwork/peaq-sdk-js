

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

(shouldRun ? describe.sequential : describe.skip)('vault.claimYieldTo [integration]', () => {    
  it.skip('claims yield to a given address', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get bob wallet
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);

    // 3. Get known vault address
    const vault = "0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955";

    // 3. Claim Yield
    const result = await rwa_sdk.vault.claimYieldTo({
        sender: alice,
        vault: vault,
        to: bob.address
    });
    console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Yield claimed for vault');
    expect(result.result).toContain(vault);
  }, 60_000);
});