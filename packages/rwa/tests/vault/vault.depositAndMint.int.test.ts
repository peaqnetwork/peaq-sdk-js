

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
    const tokenIds = ["264584815634051302201818132358169219281326857171", "1175434611957131102776221217067939161297023915810", "107806479518792391728058199253344978782040793924169118583220839015139915080183"]

    // 3. Deposit and mint tokens
    const result = await rwa_sdk.vault.depositAndMint({
      vaultController: vaultController,
      vault: "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656",
      rwaNfts: [mnft, mnft, cnft],
      tokenIds: tokenIds,
      amount: 10000
    });
    console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Deposited and minted tokens for vault');
    expect(result.result).toContain("0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656");
  }, 60_000);
});