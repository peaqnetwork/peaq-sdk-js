

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256, toUtf8Bytes } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { contractId as computeContractId } from '../../src/utils/nft';

// This is a smoke test that requires env vars and a live endpoint.
// It will be skipped automatically if env vars are missing.

const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

(shouldRun ? describe.sequential : describe.skip)('cnft.blockContract [integration]', () => {
  it.skip('blocks a Contract NFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Contract NFT Owner (entity who originally mints Contract Nft contract)
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Counterparty wallets (co-signs the contract)
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);
    const charlie = new Wallet(process.env.CHARLIE_PRIVATE_KEY!, provider);


    // 3. Block the contract before it is created
    const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
    const blockedResult = await rwa_sdk.cnft.setBlocked({
        contractNftOwner: admin,
        contractNft: contractNft,
        blocked: true
    });
    console.log(blockedResult);
    expect(blockedResult).toBeDefined();
    expect(blockedResult).toHaveProperty('message');
    expect(typeof blockedResult.message).toBe('string');
    expect(blockedResult.message).toContain(`Contract set blocked to ${true}.`);

    // 4. Check if the contract is blocked
    const isBlockedResult = await rwa_sdk.cnft.isBlocked({
        contractNft: contractNft
    });
    console.log(isBlockedResult);
    expect(isBlockedResult).toBeDefined();
    expect(isBlockedResult).toHaveProperty('blocked');
    expect(typeof isBlockedResult.blocked).toBe('boolean');
    expect(isBlockedResult.blocked).toBe(true);


    // 5. Try to create the contract (expected failure)
    const url = "https://example.com";
    const content = `This is a test contract ${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const hashDigest = keccak256(toUtf8Bytes(content));
    await expect(
      rwa_sdk.cnft.createContract({
        contractInitiator: alice,
        counterparties: [bob.address, charlie.address],
        contractNft: contractNft,
        hashDigest: hashDigest,
        url: url,
      })
    ).rejects.toMatchObject({
      name: 'SDKError',
      code: 'SIMULATE/INIT_CONTRACT',
      cause: expect.objectContaining({
        reason: expect.stringMatching(/blocked/i),
      }),
    });

    // 6. Set contract blocked to false
    const blockedResult2 = await rwa_sdk.cnft.setBlocked({
        contractNftOwner: admin,
        contractNft: contractNft,
        blocked: false
    });
    expect(blockedResult2).toBeDefined();
    expect(blockedResult2).toHaveProperty('message');
    expect(typeof blockedResult2.message).toBe('string');
    expect(blockedResult2.message).toContain(`Contract set blocked to ${false}.`);


    const isBlockedResult2 = await rwa_sdk.cnft.isBlocked({
        contractNft: contractNft
    });
    expect(isBlockedResult2).toBeDefined();
    expect(isBlockedResult2).toHaveProperty('blocked');
    expect(typeof isBlockedResult2.blocked).toBe('boolean');
    expect(isBlockedResult2.blocked).toBe(false);

    // 7. Create the contract
    const result = await rwa_sdk.cnft.createContract({
        contractInitiator: alice,
        counterparties: [bob.address, charlie.address],
        contractNft: contractNft,
        hashDigest: hashDigest,
        url: url
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('contractId');
    expect(typeof result.message).toBe('string');
    expect(result.message).toContain('Contract setup fees paid:');
    expect(typeof result.contractId).toBe('string');
    expect(result.contractId).toMatch(/^\d+$/);

    // Cancel the contract for cleanup
    await rwa_sdk.cnft.cancelContract({
        contractInitiator: alice,
        contractNft: contractNft,
        contractId: result.contractId
      });

  }, 60_000);
});