

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.mnftApproval [integration]', () => {
  it.skip('approves an MNFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet to approve vault as operator for MNFT
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Approve MNFT for vault
    const resp = await rwa_sdk.vault.mnftApprovalForAll({
      machineController: alice,
      machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
      vault: "0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af",
      approved: true
    });
    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('result');
    expect(typeof resp.result).toBe('string');
    expect(resp.result).toContain('Set approval of vault');
    expect(resp.result).toContain("0xaBB3961281123C336596153C4dfE83E11498fc54");
    expect(resp.result).toContain("0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af");
    expect(resp.result).toContain("true");

  }, 60_000);
});