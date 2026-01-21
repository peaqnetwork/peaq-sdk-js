

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

(shouldRun ? describe.sequential : describe.skip)('vault.mnftApproval [integration]', () => {
  it.skip('approves an MNFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet to approve vault as operator for MNFT
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Approve MNFT for vault
    const resp = await rwa_sdk.vault.mnftApprovalForAll({
      owner: alice,
      mnft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
      vault: "0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955",
      approved: true
    });
    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('result');
    expect(typeof resp.result).toBe('string');
    expect(resp.result).toContain('Set approval of vault');
    expect(resp.result).toContain("0xaBB3961281123C336596153C4dfE83E11498fc54");
    expect(resp.result).toContain("0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955");
    expect(resp.result).toContain("true");

  }, 60_000);
});