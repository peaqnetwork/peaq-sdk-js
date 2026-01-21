import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256, toUtf8Bytes } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { contractId as computeContractId } from '../../src/utils/nft';


const HTTPS_BASE_URL = process.env.HTTPS_BASE_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ALICE_PUBLIC_ADDRESS = process.env.ALICE_PUBLIC_ADDRESS;

const shouldRun = Boolean(HTTPS_BASE_URL && ADMIN_PRIVATE_KEY && ALICE_PUBLIC_ADDRESS);

(shouldRun ? describe.sequential : describe.skip)('vault.transfer [integration]', () => {
  it('transfers tokens', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet to send tokens
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get bob wallet to receive tokens
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);

    // 3. Get Charlie wallet to receive tokens
    const charlie = new Wallet(process.env.CHARLIE_PRIVATE_KEY!, provider);

    // 4. Get token
    const token = "0x3fD8e53fA4a548Fd485c98cbF8e5A3B2D3574729";

    // 5. Ensure transfer fee allowance is set
    const result = await rwa_sdk.vault.ensureTransferFeeAllowance({
      token: token,
      sender: alice,
      erc20: "0x0000000000000000000000000000000000000809",
      vault: "0x1B6c40647589dfF2172F0Cfa4C37cbC8a78aE955",
      amount: 1
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Transfer fee allowance set for token');
    expect(result.result).toContain('in vault');

    // 6. Transfer tokens to Bob
    const resp = await rwa_sdk.vault.transfer({
      token: token,
      sender: alice,
      recipientAddr: bob.address,
      amount: 1
    });

    console.log(resp);
    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('result');
    expect(typeof resp.result).toBe('string');
    expect(resp.result).toContain('Transferred 1 tokens (scaled by 18 decimals) from one address to another');

    // 7. Transfer tokens to Charlie
    const resp2 = await rwa_sdk.vault.transfer({
        token: token,
        sender: alice,
        recipientAddr: charlie.address,
        amount: 1
    });
    expect(resp2).toBeDefined();
    expect(resp2).toHaveProperty('result');
    expect(typeof resp2.result).toBe('string');
    expect(resp2.result).toContain('Transferred 1 tokens (scaled by 18 decimals) from one address to another');



  }, 60_000);
});