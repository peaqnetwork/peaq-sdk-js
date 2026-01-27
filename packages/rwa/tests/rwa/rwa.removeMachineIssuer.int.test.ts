

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('rwa.removeMachineIssuer [integration]', () => {    
  it.skip('removes a machine issuer from the PeaqRwaNft contract', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get Machine Regulator wallet
    const machineRegulator = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get a new machine issuer address
    const aliceMachineIssuer = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 3. Get existing machine issuers
    const existingMachineIssuers = await rwa_sdk.rwa.getMachineIssuers();

    // 4. Remove Machine Issuer
    const result = await rwa_sdk.rwa.removeMachineIssuer({
        machineRegulatorSigner: machineRegulator,
        machineIssuer: aliceMachineIssuer.address
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Machine issuer at address');
    expect(result.result).toContain(aliceMachineIssuer.address);

    // 7. Get updated machine issuers, and make sure machine issuer in list and length is incremented by 1
    const updatedMachineIssuers = await rwa_sdk.rwa.getMachineIssuers();
    expect(updatedMachineIssuers).toBeDefined();
    expect(updatedMachineIssuers).toHaveProperty('machineIssuers');
    expect(updatedMachineIssuers.machineIssuers).toBeDefined();
    expect(updatedMachineIssuers.machineIssuers).toHaveLength(existingMachineIssuers.machineIssuers.length - 1);
    expect(updatedMachineIssuers.machineIssuers).not.toContain(aliceMachineIssuer.address);
  }, 60_000);
});