

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
(shouldRun ? describe.sequential : describe.skip)('mnft.getMachineDid [integration]', () => {
  it('gets a Machine DID', async () => {
    
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get a known Machine NFT and tokenId
    const mnft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
    const tokenId = "619681761651764163179645917096521812807432994659"; 

    // 2. Create MachineNFT(s) for Alice
    const did = await rwa_sdk.mnft.getMachineDid({
        machineNFT: mnft,
        tokenId: tokenId
    });

    // // Remove comments to see the result
    // console.log('Result', did);
    // console.log('Services', did.didDocument.services);
    // console.log('Verifiable Credential', did.didDocument.verifiable_credential);


    // Top-level result
    expect(did).toBeDefined();
    expect(did.didDocument).toBeDefined();

    // DID Document structure
    const doc = did.didDocument as any;
    expect(typeof doc.id).toBe('string');
    expect(doc.id).toContain('did:peaq:');
    expect(typeof doc.controller).toBe('string');
    expect(Array.isArray(doc.verification_methods)).toBe(true);
    expect(Array.isArray(doc.services)).toBe(true);
    expect(Array.isArray(doc.authentications)).toBe(true);

    // Services array
    expect(doc.services.length).toBeGreaterThanOrEqual(1);
    for (const svc of doc.services) {
      expect(typeof svc.id).toBe('string');
      expect(typeof svc.type).toBe('string');
      expect(typeof svc.service_endpoint).toBe('string');
    }

    // Verifiable Credential
    const vc = doc.verifiable_credential;
    expect(vc).toBeDefined();
    expect(typeof vc.id).toBe('string');
    expect(typeof vc.type).toBe('string');
    expect(vc.type).toBe('MachineNft');
    expect(typeof vc.issuer).toBe('string');
    expect(typeof vc.issuance_date).toBe('string');

    // Credential Subject
    const cs = vc.credential_subject;
    expect(cs).toBeDefined();
    expect(cs.machine).toBeDefined();

    // Machine metadata
    const machine = cs.machine;
    expect(typeof machine.type).toBe('string');
    expect(typeof machine.manufacturer).toBe('string');
    expect(typeof machine.model).toBe('string');
    expect(typeof machine.serial_number).toBe('string');
  }, 60_000);
});