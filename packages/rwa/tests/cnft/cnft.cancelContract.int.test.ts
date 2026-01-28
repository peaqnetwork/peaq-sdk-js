

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { contractId as computeContractId } from '../../src/utils/nft';


describe.sequential('cnft.cancelContract [integration]', () => {
  it.skip('cancels a Contract NFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Contract initiator wallet (submits tx and pays native deposit)
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Counterparty wallets (co-signs the contract)
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);
    const charlie = new Wallet(process.env.CHARLIE_PRIVATE_KEY!, provider);


    // 3. Get a known Contract NFT address
    const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
    const url = "https://example.com";
    const content = `This is a test contract ${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const hashDigest = keccak256(toUtf8Bytes(content));

    // 4. Create MachineNFT(s) for Alice
    const result = await rwa_sdk.cnft.createContract({
        contractController: alice,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        counterparties: [bob.address, charlie.address],
        contractNft: contractNft,
        contractHash: hashDigest,
        url: url
    });
    expect(['created']).toContain(result.status);
    expect(result.contractNft).toBe(contractNft);
    expect(result.contractId).toBeDefined();
    expect(result.contractId).toMatch(/^\d+$/);
    expect(result.contractController).toBe(alice.address);
    expect(result.counterparties).toBeDefined();
    expect(result.counterparties.length).toBe(2);
    expect(result.counterparties).toContain(bob.address);
    expect(result.counterparties).toContain(charlie.address);
    expect(result.content.hash).toBe(hashDigest);
    expect(result.content.url).toBe(url);
    expect(result.fee.token).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result.fee.tokenDecimals).toBe(18);
    expect(result.fee.setupAmount).toBe(1000000000000000000n);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);

    // contractId should match deterministic hash
    const expectedId = computeContractId({
      initiator: alice.address,
      counterparties: [bob.address, charlie.address],
      hashDigest: BigInt(hashDigest),
      url,
    });
    expect(result.contractId).toBe(expectedId);

    // 5. Get the draft of the contract
    const draft = await rwa_sdk.cnft.getDraft({
      contractNft: contractNft,
      contractId: result.contractId
    });
    expect(draft).toBeDefined();
    expect(draft).toHaveProperty('draft');
    const d: any = (draft as any).draft;
    expect(Array.isArray(d)).toBe(true);
    expect(d.length).toBe(2);

    const dContent: any = d[0];
    const dSignatures: any = d[1];

    // content struct
    expect(dContent).toBeDefined();
    expect(dContent.length).toBe(4);
    expect(dContent[0]).toBe(alice.address);
    expect(Array.isArray(dContent[1])).toBe(true);
    expect(dContent[1]).toContain(bob.address);
    expect(dContent[1]).toContain(charlie.address);
    expect(dContent[2]).toBe(BigInt(hashDigest));
    expect(dContent[3]).toBe(url);
    expect(Array.isArray(dSignatures)).toBe(true);
    expect(dSignatures.length).toBeGreaterThanOrEqual(1);
    expect(dSignatures).toContain(alice.address);

    // recompute contractId from draft content
    const idFromDraft = computeContractId({
      initiator: dContent[0],
      counterparties: dContent[1],
      hashDigest: dContent[2],
      url: dContent[3],
    });
    expect(idFromDraft).toBe(result.contractId);

    
    // 6. Have Bob sign the contract
    const signResult = await rwa_sdk.cnft.signContract({
      counterpartySigner: bob,
      contractNft: contractNft,
      contractId: result.contractId
    });
    expect(['signed']).toContain(signResult.status);
    expect(signResult.contractId).toBe(result.contractId);
    expect(signResult.counterpartySigner).toBe(bob.address);
    expect(signResult.receipt).toBeDefined();
    expect(signResult.receipt.status).toBe(1);


    // 7. Rather than having Charlie sign the contract, cancel it from the initiator (Alice)
    const cancelResult = await rwa_sdk.cnft.cancelContract({
      contractController: alice,
      contractNft: contractNft,
      contractId: result.contractId
    });
    expect(['cancelled']).toContain(cancelResult.status);
    expect(cancelResult.contractNft).toBe(contractNft);
    expect(cancelResult.contractId).toBe(result.contractId);
    expect(cancelResult.cancelledBy).toBe(alice.address);
    expect(cancelResult.receipt).toBeDefined();
    expect(cancelResult.receipt.status).toBe(1);

    // 8. Try to get the draft of the contract (expected failure)
    await expect(
      rwa_sdk.cnft.getDraft({
        contractNft: contractNft,
        contractId: result.contractId,
      })
    ).rejects.toThrow(/Not found/i);

  }, 60_000);
});