

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256, toUtf8Bytes } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { contractId as computeContractId } from '../../src/utils/nft';


const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

(shouldRun ? describe.sequential : describe.skip)('vault.depositAndMint [integration]', () => {  
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
    const tokenIds = ["619809729955663709200066324440823927748836589420", "1033422660510920705117856572557101252624822136052", "682100740353899182308567996234555735561375161997", "23375677926214297807553453747266887912894362665331870115284728124913140803958"]


    // 2. Deposit and mint tokens
    const result = await rwa_sdk.vault.depositAndMint({
      owner: alice,
      vault: "0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955",
      rwaNfts: [mnft, mnft, mnft, cnft],
      tokenIds: tokenIds,
      amount: 10000
    });
    console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Deposited and minted tokens for vault');
    expect(result.result).toContain("0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955");
  }, 60_000);
});