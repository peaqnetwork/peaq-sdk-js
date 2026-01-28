

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

    // 1. Get Machine Controller
    const machineController = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Call cnft approval for tokenIds
    const mnft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
    const mnftTokenIds = ["1262843802665614120367007478296348432923457422026", "880598419457374294774049460835571533031091411284"]
    const mnftApprovalResult = await rwa_sdk.vault.mnftApproval({
      machineController: machineController,
      machineNft: mnft,
      vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
      tokenIds: mnftTokenIds
    });
    expect(['approved']).toContain(mnftApprovalResult.status);
    expect(mnftApprovalResult).toBeDefined();
    expect(mnftApprovalResult.machineNft).toBe(mnft);
    expect(mnftApprovalResult.vault).toBe("0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3");
    expect(mnftApprovalResult.newlyApprovedTokenIds).toBe(mnftTokenIds);
    expect(mnftApprovalResult.receipts).toBeDefined();
    expect(mnftApprovalResult.receipts.length).toBe(mnftTokenIds.length);
    expect(mnftApprovalResult.receipts[0].status).toBe(1);

  }, 60_000);
});