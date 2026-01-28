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

    // 1. Get Contract Controller
    const contractController = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Call cnft approval for tokenIds
    const cnft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
    const cnftTokenIds = ["110399289532161649501907442204937966168773206671183427730650359857010370852178"]
    const cnftApprovalResult = await rwa_sdk.vault.cnftApproval({
      contractController: contractController,
      contractNft: cnft,
      vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
      tokenIds: cnftTokenIds
    });
    expect(['approved']).toContain(cnftApprovalResult.status);
    expect(cnftApprovalResult).toBeDefined();
    expect(cnftApprovalResult.contractNft).toBe(cnft);
    expect(cnftApprovalResult.vault).toBe("0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3");
    expect(cnftApprovalResult.newlyApprovedTokenIds).toBe(cnftTokenIds);
    expect(cnftApprovalResult.receipts).toBeDefined();
    expect(cnftApprovalResult.receipts.length).toBe(cnftTokenIds.length);
    expect(cnftApprovalResult.receipts[0].status).toBe(1);

  }, 60_000);
});