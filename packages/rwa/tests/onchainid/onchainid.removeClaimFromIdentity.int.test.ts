

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256 } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


// Integration test that removes a KYC claim from an identity
describe.sequential('OnchainID.removeClaimFromIdentity [integration]', () => { 
  it.skip('Creates and then removes a KYC claim', async () => {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Claim Issuer admin wallet
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);

    // 2. Get User to KYC
    const alice = await rwa_sdk.onchainid.getIdentity({ subject: process.env.ALICE_PUBLIC_ADDRESS! });

    // 3. Create claim + signature
    const { claim, signature } = await rwa_sdk.onchainid.issueKycClaim({
        claimIssuerSigner: claimIssuer,
        claimIssuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!,
        subjectIdentity: alice.identity!,
        name: 'Alice',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        placeOfBirth: 'New York',
        uri: 'https://example.com/kyc'
    });

    // 4. Identity owner signs and submits addClaim
    const aliceSigner = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    const result = await rwa_sdk.onchainid.addClaimToIdentity({
        identityController: aliceSigner,
        subjectIdentity: alice.identity!,
        claim: claim,
        claimSignature: signature,
    });
    expect(result.receipt.status).toBe(1);
    expect(result.claimId).toBeDefined();
    expect(result.claimId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(['added', 'updated']).toContain(result.status);

    // 5. Compute claimId = keccak256(abi.encode(issuer, topic))
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;
    const topic = 777;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));
    expect(claimId).toBe(result.claimId);

    // 6. Remove claim from identity
    const result2 = await rwa_sdk.onchainid.removeClaimFromIdentity({
      identityController: aliceSigner,
      subjectIdentity: alice.identity!,
      claimId: claimId
    });
    expect(result2.receipt.status).toBe(1);
    expect(result2.claimId).toBeDefined();
    expect(result2.claimId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(result2.claimId).toBe(result.claimId);

    // 7. Expected failure - claim should not be found in identity contract and throw an error
    await expect(rwa_sdk.onchainid.getClaim({
        subjectIdentity: alice.identity!,
        claimId: claimId
      })
    ).rejects.toThrow(/Claim not found/i);

  }, 60_000);
});