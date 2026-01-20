

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

(shouldRun ? describe.sequential : describe.skip)('vault.unpauseToken [integration]', () => {    
  it('unpauses a token', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get known vault address
    const vault = "0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955";

    // 3. Unpause Token
    const result = await rwa_sdk.vault.unpauseToken({
      admin: admin,
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      vault: vault
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('receipt');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Unpaused token for vault:');
    expect(result.result).toContain(vault);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);

  }, 60_000);
});