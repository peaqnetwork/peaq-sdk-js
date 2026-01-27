

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('rwa.setMachineNftBlockState [integration]', () => {    
  it.skip('sets the block state of a machine issuer or contract NFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get Machine Regulator wallet
    const machineRegulator = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get a new machine issuer address (need to add the claim that alice is a machine issuer)
    const aliceMachineIssuer = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    // const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";

    // 3. Set the block state of the machine issuer
    const result = await rwa_sdk.rwa.setMachineNftBlockState({
        machineRegulatorSigner: machineRegulator,
        issuerOrContractNft: aliceMachineIssuer.address,
        blocked: true
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Machine issuer or contract NFT at address');
    expect(result.result).toContain(aliceMachineIssuer.address);
    expect(result.result).toContain('blocked to true');

    // 4. Set the block state of the machine issuer to false
    const result2 = await rwa_sdk.rwa.setMachineNftBlockState({
        machineRegulatorSigner: machineRegulator,
        issuerOrContractNft: aliceMachineIssuer.address,
        blocked: false
    });
    expect(result2).toBeDefined();
    expect(result2).toHaveProperty('result');
    expect(typeof result2.result).toBe('string');
    expect(result2.result).toContain('Machine issuer or contract NFT at address');
    expect(result2.result).toContain(aliceMachineIssuer.address);
    expect(result2.result).toContain('blocked to false');

  }, 60_000);
});