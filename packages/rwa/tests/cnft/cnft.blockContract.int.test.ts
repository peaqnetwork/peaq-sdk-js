

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('cnft.blockContract [integration]', () => {
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
        contractNftSigner: admin,
        contractNft: contractNft,
        blocked: true
    });
    expect(blockedResult).toBeDefined();
    expect(blockedResult).toHaveProperty('message');
    expect(typeof blockedResult.message).toBe('string');
    expect(blockedResult.message).toContain(`Contract set blocked to ${true}.`);

    // 4. Check if the contract is blocked
    const isBlockedResult = await rwa_sdk.cnft.isBlocked({
        contractNft: contractNft
    });
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
        contractController: alice,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        counterparties: [bob.address, charlie.address],
        contractNft: contractNft,
        contractHash: hashDigest,
        url: url,
      })
    ).rejects.toThrow(/ContractNFTs callStatic failed; initialization would revert/i); 

    // 6. Set contract blocked to false
    const blockedResult2 = await rwa_sdk.cnft.setBlocked({
        contractNftSigner: admin,
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
        contractController: alice,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        counterparties: [bob.address, charlie.address],
        contractNft: contractNft,
        contractHash: hashDigest,
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
        contractController: alice,
        contractNft: contractNft,
        contractId: result.contractId
      });

  }, 60_000);
});