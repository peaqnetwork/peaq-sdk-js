

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.depositAndMint [integration]', () => {  
  it.skip('deposits and mints tokens', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get vault owner
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get machine NFT
    const mnft = "0xaBB3961281123C336596153C4dfE83E11498fc54";

    // 3. Get contract NFT
    const cnft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";

    // 4. Get token IDs from known machine NFTs and contract NFTs deployments
    const tokenIds = ["818540095949850881411904093260269153730132668043", "1339290029631912298803623556477400365133144058127", "100029413485835746184994811893588555499363699086818240224380117841719712643928"]

    // 5. Deposit and mint tokens
    const result = await rwa_sdk.vault.depositAndMint({
      vaultController: alice,
      vault: "0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af",
      rwaNfts: [mnft, mnft, cnft],
      tokenIds: tokenIds,
      amount: 10000
    });
    console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Deposited and minted tokens for vault');
    expect(result.result).toContain("0x807C971828bfc2CcfF326e86e9C4c8787DcC46Af");
  }, 60_000);
});