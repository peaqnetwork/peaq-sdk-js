

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { ClaimTopics } from '../../src/enums/claimTopics';

describe.sequential('rwa.addMachineIssuer [integration]', () => {    
  it.skip('adds a machine issuer claim to an identity and then adds the eoa of the identity to the PeaqRwaNft contract as a machine issuer', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get Machine Regulator wallet
    const machineRegulator = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get a new machine issuer address (need to add the claim that alice is a machine issuer)
    const aliceMachineIssuer = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    const aliceIdentity = await rwa_sdk.onchainid.getIdentity({ subject: aliceMachineIssuer.address });

    // // 3. Issue role claim for alice to be a machine issuer (only needs to be done once per identity)
    // const { claim, signature } = await rwa_sdk.onchainid.issueRoleClaim({
    //     claimIssuerSigner: machineRegulator,
    //     claimIssuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!,
    //     subjectIdentity: aliceIdentity.identity,
    //     roleTopic: ClaimTopics.CT_MNFT_ISSUER,
    //     roleDescription: 'Machine Issuer'
    // });

    // // 4. Add claim to alice's identity
    // await rwa_sdk.onchainid.addClaimToIdentity({
    //     identityController: aliceMachineIssuer,
    //     subjectIdentity: aliceIdentity.identity,
    //     claim: claim,
    //     claimSignature: signature,
    // });

    // 5. Get existing machine issuers
    const existingMachineIssuers = await rwa_sdk.rwa.getMachineIssuers();

    // 6. Add Machine Issuer
    const result = await rwa_sdk.rwa.addMachineIssuer({
        machineRegulatorSigner: machineRegulator,
        newMachineIssuer: aliceMachineIssuer.address
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Machine issuer at address');
    expect(result.result).toContain(aliceMachineIssuer.address);

    // 7. Get updated machine issuers, and make sure machine issuer in list and length is incremented by 1
    const updatedMachineIssuers = await rwa_sdk.rwa.getMachineIssuers();
    console.log('Updated machine issuers:', updatedMachineIssuers);
    expect(updatedMachineIssuers).toBeDefined();
    expect(updatedMachineIssuers).toHaveProperty('machineIssuers');
    expect(updatedMachineIssuers.machineIssuers).toBeDefined();
    expect(updatedMachineIssuers.machineIssuers).toHaveLength(existingMachineIssuers.machineIssuers.length + 1);
    expect(updatedMachineIssuers.machineIssuers).toContain(aliceMachineIssuer.address);
  }, 60_000);
});