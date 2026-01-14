

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
(shouldRun ? describe.sequential : describe.skip)('OnchainID.removeClaimFromIdentity [integration]', () => {
  it.skip('Creates and then removes a KYC claim', async () => {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

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

    // 5. Compute claimId = keccak256(abi.encode(issuer, topic))
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;
    const topic = 777;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));

    // 6. Remove claim from identity
    const result = await rwa_sdk.onchainid.removeClaimFromIdentity({
      identity: alice.identity,
      identityOwner: aliceSigner,
      claimId: claimId
    });
    expect(result.receipt.status).toBe(1);
    expect(result.result).toBe(`Successfully removed claim for Identity ${alice.identity}`);

  }, 60_000);
});