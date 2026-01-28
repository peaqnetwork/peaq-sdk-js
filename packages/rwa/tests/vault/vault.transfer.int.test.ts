import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';

describe.sequential('vault.transfer [integration]', () => {
  it.skip('transfers tokens', async () => {
    // 0. Create RWA instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // 1. Get alice wallet to send tokens
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 2. Get bob wallet to receive tokens
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);

    // 3. Get Charlie wallet to receive tokens
    const charlie = new Wallet(process.env.CHARLIE_PRIVATE_KEY!, provider);

    // 4. Get security token address
    const token = "0x9E23427EA607DFE224DA6DF9b75E2f50B8e7AFE5";

    // 5. Ensure transfer fee allowance is set
    const result = await rwa_sdk.vault.ensureTransferFeeAllowance({
      allowanceSigner: alice,
      vault: "0x4dBF70cD5407F8b1014c238387ce8EEf85Cc2656",
      token: token,
      erc20: rwa_sdk.getAddresses().erc20.peaq,
      transferAmountHuman: "2"
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('result');
    expect(typeof result.result).toBe('string');
    expect(result.result).toContain('Transfer fee allowance set for token');
    expect(result.result).toContain('in vault');

    // 6. Transfer tokens to Bob
    const resp = await rwa_sdk.vault.transfer({
      from: alice,
      to: bob.address,
      token: token,
      transferAmountHuman: "1"
    });

    console.log(resp);
    expect(resp).toBeDefined();
    expect(resp).toHaveProperty('result');
    expect(typeof resp.result).toBe('string');
    expect(resp.result).toContain('Transferred 1 tokens (scaled by 18 decimals) from one address to another');

    // 7. Transfer tokens to Charlie
    const resp2 = await rwa_sdk.vault.transfer({
      from: alice,
      to: charlie.address,
      token: token,
      transferAmountHuman: "1"
    });
    expect(resp2).toBeDefined();
    expect(resp2).toHaveProperty('result');
    expect(typeof resp2.result).toBe('string');
    expect(resp2.result).toContain('Transferred 1 tokens (scaled by 18 decimals) from one address to another');



  }, 60_000);
});