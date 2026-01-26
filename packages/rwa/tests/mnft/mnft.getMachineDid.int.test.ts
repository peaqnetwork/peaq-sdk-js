

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


describe.sequential('mnft.getMachineDid [integration]', () => {
  it.skip('gets a Machine DID', async () => {
    
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get a known Machine NFT and tokenId
    const mnft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
    const tokenId = "95044317769373976152348576528544002775282921045"; 

    // 2. Create MachineNFT(s) for Alice
    const did = await rwa_sdk.mnft.getMachineDid({
        machineNft: mnft,
        tokenId: tokenId
    });

    // Remove comments to see the result
    console.log('Result', did);
    console.log('Services', (did.didDocument as any).services);
    console.log('Verifiable Credential', (did.didDocument as any).verifiable_credential);


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