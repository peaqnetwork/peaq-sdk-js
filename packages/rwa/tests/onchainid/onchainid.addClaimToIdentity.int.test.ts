

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256 } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

// This is a smoke test that requires env vars and a live endpoint.
// It will be skipped automatically if env vars are missing.

const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

// Integration test that creates or returns an existing identity
(shouldRun ? describe.sequential : describe.skip)('OnchainID.addClaimToIdentity [integration]', () => {
  it.skip('adds a KYC claim to an identity', async () => {
    // 0. Create RWA instance and provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Claim Issuer admin wallet
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);

    // 2. Get User to KYC
    const alice = await rwa_sdk.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_ADDRESS! });

    // 3. Create claim + signature
    const { claim, signature } = await rwa_sdk.onchainid.issueKycClaim({
        claimIssuer: claimIssuer,
        issuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!,
        identity: alice.identity,
        name: 'Alice',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        placeOfBirth: 'New York',
        uri: 'https://example.com/kyc'
    });

      // 4. Identity owner signs and submits addClaim
    const aliceSigner = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    const { receipt } = await rwa_sdk.onchainid.addClaimToIdentity({
        identity: alice.identity,
        identityOwner: aliceSigner,
        claim: claim,
        kycSignature: signature,
    });
    expect(receipt.status).toBe(1);

    // get claim to check it has been added to alice's identity contract
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;
    const topic = 777;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));

    // 3. Fetch claim
    const fetchedClaim = await rwa_sdk.onchainid.getClaim({
      identity: alice.identity,
      claimId: claimId
    });
    console.log("fetchedClaim", fetchedClaim);

    expect(fetchedClaim).toBeDefined();
    expect(typeof fetchedClaim.claim.topic).toBe('number');
    expect(fetchedClaim.claim.topic).toBe(777);

    expect(typeof fetchedClaim.claim.scheme).toBe('number');
    expect(fetchedClaim.claim.scheme).toBe(1);

    expect(typeof fetchedClaim.claim.issuer).toBe('string');
    expect(fetchedClaim.claim.issuer.toLowerCase()).toBe(String(issuerContract).toLowerCase());
    expect(/^0x[a-fA-F0-9]{40}$/.test(claim.issuer)).toBe(true);

    expect(typeof fetchedClaim.claim.signature).toBe('string');
    expect(/^0x[0-9a-fA-F]+$/.test(fetchedClaim.claim.signature)).toBe(true);
    expect(fetchedClaim.claim.signature.length).toBeGreaterThanOrEqual(132); // 65-byte ECDSA

    expect(typeof fetchedClaim.claim.data).toBe('string');
    expect(fetchedClaim.claim.data.startsWith('0x')).toBe(true);
    expect(fetchedClaim.claim.data.length).toBeGreaterThan(10);

    expect(fetchedClaim.claim.uri).toBe('https://example.com/kyc');

  }, 60_000);
});