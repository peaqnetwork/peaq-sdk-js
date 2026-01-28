

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

    // 1. Get  vault controller owner
    const vaultController = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get contracts pre-approved MNFT and CNFT tokenIds
    const mnft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
    const cnft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
    const tokenIds = ["1262843802665614120367007478296348432923457422026", "880598419457374294774049460835571533031091411284", "110399289532161649501907442204937966168773206671183427730650359857010370852178"]

    // 3. Deposit and mint tokens
    const result = await rwa_sdk.vault.depositAndMint({
      vaultController: vaultController,
      vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
      rwaNfts: [mnft, mnft, cnft],
      tokenIds: tokenIds,
      amount: 10000
    });
    console.log(result);
    expect(['deposited_and_minted']).toContain(result.status);
    expect(result).toBeDefined();
    expect(result.vault).toBe("0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3");
    expect(result.controller).toBe(await vaultController.getAddress());
    expect(result.rwaNfts).toEqual([mnft, mnft, cnft]);
    expect(result.tokenIds).toEqual(tokenIds);
    expect(result.amount).toBe(10000);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);
  }, 60_000);
});