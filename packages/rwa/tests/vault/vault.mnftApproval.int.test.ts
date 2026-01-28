

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
    const mnftTokenIds = ["264584815634051302201818132358169219281326857171", "1175434611957131102776221217067939161297023915810"]
    const mnftApprovalResult = await rwa_sdk.vault.mnftApproval({
      machineController: machineController,
      machineNft: mnft,
      vault: "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656",
      tokenIds: mnftTokenIds
    });
    console.log(mnftApprovalResult);
    expect(mnftApprovalResult).toBeDefined();
    expect(mnftApprovalResult).toHaveProperty('result');
    expect(typeof mnftApprovalResult.result).toBe('string');
    expect(mnftApprovalResult.result).toContain('Set approval of vault');
    expect(mnftApprovalResult.result).toContain(mnft);
    expect(mnftApprovalResult.result).toContain("0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656");
    expect(mnftApprovalResult.result).toContain(mnftTokenIds.join(','));

  }, 60_000);
});