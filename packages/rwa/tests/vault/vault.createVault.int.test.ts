

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
      tokenName: "Test Token JJJ",
      tokenSymbol: "JJJ",
      payoutToken: rwa_sdk.getAddresses().erc20.peaq,
    });
    console.log(result);
    expect(['created']).toContain(result.status);
    expect(result).toBeDefined();
    expect(result.vault).toBeDefined();
    expect(result.vault).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.distributor).toBeDefined();
    expect(result.distributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.receipt.status).toBe(1);


    // vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
    // token: '0x811247945f5fcBD9068F71298a69e71B2A4Ba66f',
    // distributor: '0x4210D83E736789e361DC96CC07756cb573e23CEd',
  }, 60_000);
});