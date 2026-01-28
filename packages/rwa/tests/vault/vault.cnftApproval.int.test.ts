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
    const cnftTokenIds = ["107806479518792391728058199253344978782040793924169118583220839015139915080183"]
    const cnftApprovalResult = await rwa_sdk.vault.cnftApproval({
      contractController: contractController,
      contractNft: cnft,
      vault: "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656",
      tokenIds: cnftTokenIds
    });
    console.log(cnftApprovalResult);
    expect(cnftApprovalResult).toBeDefined();
    expect(cnftApprovalResult).toHaveProperty('result');
    expect(typeof cnftApprovalResult.result).toBe('string');
    expect(cnftApprovalResult.result).toContain('Set approval of vault');
    expect(cnftApprovalResult.result).toContain(cnft);
    expect(cnftApprovalResult.result).toContain("0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656");
    expect(cnftApprovalResult.result).toContain(cnftTokenIds.join(','));

  }, 60_000);
});