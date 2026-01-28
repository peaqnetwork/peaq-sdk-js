

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
    const result = await rwa_sdk.mnft.ensureMachineNftAllowance({
        machineController: alice,
        machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
        machineValueHuman: "10",
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        machineCount: 2
    });
    expect(result).toBeDefined();
    expect(result.result).toContain('Machine registration fees approved');

    // 4. Create MachineNFT(s) for Alice
    const result2 = await rwa_sdk.mnft.issueMachineNft({
        machineIssuer: machineIssuer,
        machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
        machineValueHuman: "10",
        machineControllerAddr: alice.address,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        salt: Math.floor(Math.random() * 10000),
        count: 2
    });
    expect(result2).toBeDefined();
    expect(result2.result).toContain('Machine registration fees paid');
  }, 60_000);
});