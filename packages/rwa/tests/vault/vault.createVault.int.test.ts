

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

(shouldRun ? describe.sequential : describe.skip)('vault.createVault [integration]', () => {
  it('creates a Vault', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Claim Issuer admin wallet
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);

    // 2. Get vault recipient
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Create Vault
    const result = await rwa_sdk.vault.createVault({
      recipient: alice.address,
      tokenName: "Test Token",
      tokenSymbol: "TT",
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      infoDesk: "0x3F2c72Ba389632079DA68Ee13E8b955d69D1B5c1",
      trustedClaimIssuers: [claimIssuer.address],
      owner: admin,
      erc20Address: rwa_sdk.getAddresses().erc20.peaq
    });
    console.log(result);
    // recipient: string;
    // tokenName: string;
    // tokenSymbol: string;
    // vaultFactory: string;
    // infoDesk: string;
    // trustedClaimIssuers: string[];
    // owner: Signer;
    // erc20Address: string;

  }, 60_000);
});