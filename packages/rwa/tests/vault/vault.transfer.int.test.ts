import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, parseUnits, Wallet } from 'ethers';

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
    const token = "0x811247945f5fcBD9068F71298a69e71B2A4Ba66f";

    // 5. Ensure transfer fee allowance is set
    const result = await rwa_sdk.vault.ensureTransferFeeAllowance({
      allowanceSigner: alice,
      vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
      token: token,
      erc20: rwa_sdk.getAddresses().erc20.peaq,
      transferAmountHuman: "2"
    });
    expect(['approved']).toContain(result.status);
    expect(result.vault).toBe("0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3");
    expect(result.feeToken).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result.transfer.token).toBe(token);
    expect(result.transfer.amountHuman).toBe("2");
    expect(result.transfer.amountUnits).toBe(parseUnits("2", 18));
    expect(result.transfer.tokenDecimals).toBe(18);
    expect(result.fee.feeAmount).toBe(1000000000000000000n);

    // 6. Transfer tokens to Bob
    const resp = await rwa_sdk.vault.transfer({
      from: alice,
      to: bob.address,
      token: token,
      transferAmountHuman: "1"
    });
    expect(['transferred']).toContain(resp.status);
    expect(resp).toBeDefined();
    expect(resp.token).toBe(token);
    expect(resp.sender).toBe(alice.address);
    expect(resp.recipient).toBe(bob.address);
    expect(resp.amount.human).toBe("1");
    expect(resp.amount.units).toBe(parseUnits("1", 18));
    expect(resp.amount.decimals).toBe(18);
    expect(resp.receipt).toBeDefined();
    expect(resp.receipt.status).toBe(1);

    // 7. Transfer tokens to Charlie
    const resp2 = await rwa_sdk.vault.transfer({
      from: alice,
      to: charlie.address,
      token: token,
      transferAmountHuman: "1"
    });
    expect(['transferred']).toContain(resp2.status);
    expect(resp2).toBeDefined();
    expect(resp2.token).toBe(token);
    expect(resp2.sender).toBe(alice.address);
    expect(resp2.recipient).toBe(charlie.address);
    expect(resp2.amount.human).toBe("1");
    expect(resp2.amount.units).toBe(parseUnits("1", 18));
    expect(resp2.amount.decimals).toBe(18);
    expect(resp2.receipt).toBeDefined();
    expect(resp2.receipt.status).toBe(1);
  }, 60_000);
});