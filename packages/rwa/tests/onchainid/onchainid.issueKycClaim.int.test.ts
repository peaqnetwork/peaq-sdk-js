import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { ClaimTopics } from '../../src/enums/claimTopics';


// Integration test that issues a KYC claim
describe.sequential('OnchainID.issueKycClaim [integration]', () => {
  it.skip('issues a KYC claim', async () => {
    // 0. Create RWA instance and provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL!);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Claim Issuer admin wallet
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);

    // 2. Get User to KYC
    const alice = await rwa_sdk.onchainid.getIdentity({ subject: process.env.ALICE_PUBLIC_ADDRESS! });

    // 3. Create claim + signature
    const { claim, signature } = await rwa_sdk.onchainid.issueKycClaim({
        claimIssuerSigner: claimIssuer,
        claimIssuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!,
        subjectIdentity: alice.identity,
        name: 'Alice',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        placeOfBirth: 'New York',
        uri: 'https://example.com/kyc'
    });

    expect(claim).toBeDefined();
    expect(typeof claim).toBe('object');
    
    expect(claim.identity).toBe(alice.identity);
    expect(claim.issuer).toBe(process.env.CLAIM_ISSUER_CONTRACT_ADDRESS);
    
    expect(typeof claim.topic).toBe('number');
    expect(claim.topic).toBe(ClaimTopics.CT_KYC_APPROVED);
    
    expect(typeof claim.scheme).toBe('number');
    expect(claim.scheme).toBe(1); // expected for ECDSA
    
    expect(typeof claim.data).toBe('string');
    expect(claim.data.startsWith('0x')).toBe(true);
    expect(claim.data.length).toBeGreaterThan(10); // hashed payload
    
    expect(claim.uri).toBe('https://example.com/kyc');
    
    expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(signature.length).toBeGreaterThanOrEqual(132); // 65-byte ECDSA => 0x + 130 hex
  }, 60_000);
});