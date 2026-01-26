import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.cnftApproval [integration]', () => {
  it.skip('approves a CNFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet to approve vault as operator for CNFT
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Approve CNFT for vault
    const resp = await rwa_sdk.vault.cnftApprovalForAll({
      contractController: alice,
      contractNft: "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E",
      vault: "0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af",
      approved: true
    });
    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('result');
    expect(typeof resp.result).toBe('string');
    expect(resp.result).toContain('Set approval of vault');
    expect(resp.result).toContain("0xA00ee5b948E3E1cb293f57F7008721353416Aa2E");
    expect(resp.result).toContain("0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af");
    expect(resp.result).toContain("true");

  }, 60_000);
});