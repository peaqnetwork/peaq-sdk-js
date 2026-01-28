

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.createVault [integration]', () => {
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

    // 4. Create Vault
    const result = await rwa_sdk.vault.createVault({
      vaultDeployer: admin,
      vaultController: alice.address,
      vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
      infoDesk: "0x3F2c72Ba389632079DA68Ee13E8b955d69D1B5c1",
      trustedClaimIssuers: [claimIssuerContract],
      tokenName: "Test Token Q",
      tokenSymbol: "TTQ",
      payoutToken: rwa_sdk.getAddresses().erc20.peaq,
    });
    console.log(result);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('vault');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('distributor');
    expect(typeof result.vault).toBe('string');
    expect(typeof result.token).toBe('string');
    expect(typeof result.distributor).toBe('string');
    expect(result.vault).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.token).toMatch(/^0x[a-fA-F0-9]{40}$/);


    // {
    //   vault: '0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656',
    //   token: '0x9E23427EA607DFE224DA6DF9b75E2f50B8e7AFE5',
    //   distributor: '0x9AD7737A380253283a447C86cE650A7ABC515945'
    // }
  }, 60_000);
});