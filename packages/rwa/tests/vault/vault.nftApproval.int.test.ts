

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.nftApproval [integration]', () => {
  it.skip('approves an MNFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get Machine Controller
    const controller = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Call nft approval for MNFT tokenIds
    const mnft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
    const mnftTokenIds = ["1262843802665614120367007478296348432923457422026", "880598419457374294774049460835571533031091411284"]
    const nftApprovalResult = await rwa_sdk.vault.nftApproval({
      machineController: controller,
      nft: mnft,
      vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
      tokenIds: mnftTokenIds
    });
    expect(['approved']).toContain(nftApprovalResult.status);
    expect(nftApprovalResult).toBeDefined();
    expect(nftApprovalResult.nft).toBe(mnft);
    expect(nftApprovalResult.vault).toBe("0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3");
    expect(nftApprovalResult.newlyApprovedTokenIds).toBe(mnftTokenIds);
    expect(nftApprovalResult.receipts).toBeDefined();
    expect(nftApprovalResult.receipts.length).toBe(mnftTokenIds.length);
    expect(nftApprovalResult.receipts[0].status).toBe(1);

    // 3. Call nft approval for CNFT tokenIds
    const cnft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
    const cnftTokenIds = ["110399289532161649501907442204937966168773206671183427730650359857010370852178"]
    const nftApprovalResult2 = await rwa_sdk.vault.nftApproval({
      machineController: controller,
      nft: cnft,
      vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
      tokenIds: cnftTokenIds
    });
    expect(['approved']).toContain(nftApprovalResult2.status);
    expect(nftApprovalResult2).toBeDefined();
    expect(nftApprovalResult2.nft).toBe(cnft);
    expect(nftApprovalResult2.vault).toBe("0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3");
    expect(nftApprovalResult2.newlyApprovedTokenIds).toBe(cnftTokenIds);
    expect(nftApprovalResult2.receipts).toBeDefined();
    expect(nftApprovalResult2.receipts.length).toBe(cnftTokenIds.length);
    expect(nftApprovalResult2.receipts[0].status).toBe(1);

  }, 60_000);
});