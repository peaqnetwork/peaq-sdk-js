import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256 } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { ClaimTopics } from '../../src/enums/claimTopics';
import { ClaimScheme } from '../../src/enums/claimSchemes';

// Integration test that adds a KYC claim to an identity
describe.sequential('OnchainID.addClaimToIdentity [integration]', () => {
  it.skip('adds a KYC claim to an identity', async () => {
    // 0. Create RWA instance and provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

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

    // get claim to check it has been added to alice's identity contract
    const claimIssuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;
    const topic = ClaimTopics.CT_KYC_APPROVED;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [claimIssuerContract, topic]));

    expect(claimId).toBe(result.claimId);

    // 5. Fetch claim
    const fetchedClaim = await rwa_sdk.onchainid.getClaim({
      subjectIdentity: alice.identity!,
      claimId: claimId
    });

    expect(fetchedClaim).toBeDefined();
    expect(typeof fetchedClaim.claim.topic).toBe('number');
    expect(fetchedClaim.claim.topic).toBe(ClaimTopics.CT_KYC_APPROVED);

    expect(typeof fetchedClaim.claim.scheme).toBe('number');
    expect(fetchedClaim.claim.scheme).toBe(ClaimScheme.ECDSA);

    expect(typeof fetchedClaim.claim.issuer).toBe('string');
    expect(fetchedClaim.claim.issuer.toLowerCase()).toBe(String(claimIssuerContract).toLowerCase());
    expect(/^0x[a-fA-F0-9]{40}$/.test(fetchedClaim.claim.issuer)).toBe(true);

    expect(typeof fetchedClaim.claim.signature).toBe('string');
    expect(/^0x[0-9a-fA-F]+$/.test(fetchedClaim.claim.signature)).toBe(true);
    expect(fetchedClaim.claim.signature.length).toBeGreaterThanOrEqual(132); // 65-byte ECDSA

    expect(typeof fetchedClaim.claim.data).toBe('string');
    expect(fetchedClaim.claim.data.startsWith('0x')).toBe(true);
    expect(fetchedClaim.claim.data.length).toBeGreaterThan(10);

    expect(fetchedClaim.claim.uri).toBe('https://example.com/kyc');

  }, 60_000);
});