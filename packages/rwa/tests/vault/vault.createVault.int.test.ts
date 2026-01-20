

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
  it.skip('creates a Vault', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Claim Issuer admin wallet
    const claimIssuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!;

    // 3. Get vault recipient
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    console.log(rwa_sdk.getAddresses().erc20.peaq);

    // 4. Create Vault
    const result = await rwa_sdk.vault.createVault({
      recipient: alice.address,
      tokenName: "Test Token T",
      tokenSymbol: "TTT",
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      infoDesk: "0x3F2c72Ba389632079DA68Ee13E8b955d69D1B5c1",
      trustedClaimIssuers: [claimIssuerContract],
      owner: admin,
      erc20Address: rwa_sdk.getAddresses().erc20.peaq
    });
    console.log(result);
// TODO write test case to make sure return object is expected
// {
//     vault: '0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955',
//     token: '0x3fD8e53fA4a548Fd485c98cbF8e5A3B2D3574729',
//     distributor: '0x0e92EC28592B092227C07B7c0B0B5A1725106C0C'
//   }

  }, 60_000);
});