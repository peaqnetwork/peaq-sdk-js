

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';


// Integration test that ensures a Machine NFT allowance is set for a given machine value, and then issues a Machine NFT to a designated owner.
describe.sequential('mnft.issueMachineNFT [integration]', () => {
  it.skip('issues a Machine NFT', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Machine Issuer wallet (submits tx and pays native deposit)
    const machineIssuer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Machine owner (receives NFT and pays ERC20 fee via allowance)
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 3. Ensure Machine NFT allowance is set for a given machine value
    const machineNft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
    const count = 2;
    const result = await rwa_sdk.mnft.ensureMachineNftAllowance({
        machineController: alice,
        machineNft: machineNft,
        machineValueHuman: "10",
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        machineCount: count
    });
    expect(['approved', 'already_sufficient']).toContain(result.status);
    expect(result.machineNft).toBe(machineNft);
    expect(result.feeToken).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result.feePerMachine).toBe(10000000000000000000n);

    // 4. Create MachineNFT(s) for Alice
    const result2 = await rwa_sdk.mnft.issueMachineNft({
        machineIssuer: machineIssuer,
        machineNft: machineNft,
        machineValueHuman: "10",
        machineControllerAddr: alice.address,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        salt: Math.floor(Math.random() * 10000),
        count: count
    });
    console.log(result2);
    expect(['issued']).toContain(result2.status);
    expect(result2.machineNft).toBe(machineNft);
    expect(result2.machineIssuer).toBe(machineIssuer.address);
    expect(result2.machineController).toBe(alice.address);
    expect(result2.machineValue.human).toBe('10');
    expect(result2.machineValue.units).toBe(10000000000000000000n);
    expect(result2.machineValue.tokenDecimals).toBe(18);
    expect(result2.machineValue.feeToken).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result2.count).toBe(count);
    expect(result2.machines).toBeDefined();
    expect(result2.machines.length).toBe(count);
    
  }, 60_000);
});