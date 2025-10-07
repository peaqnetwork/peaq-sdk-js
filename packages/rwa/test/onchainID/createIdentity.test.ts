import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet, isAddress, ZeroAddress } from 'ethers';

describe('OnchainID', () => {
  it('creates an identity via IdFactory', async () => {
    const sdk = new RWA({ chainId: Chain.AGUNG });

    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

    const { receipt, identityAddress } = await sdk.onchainid.createIdentity({
      walletAddr: wallet.address,
      salt: `vitest-${Date.now()}`,
      signer: wallet,
    });

    console.log('Receipt:', receipt);
    console.log('Identity address:', identityAddress);

    expect(receipt?.hash).toBeDefined();
    expect(identityAddress).toBeDefined();
    expect(identityAddress && isAddress(identityAddress)).toBe(true);
    expect(identityAddress).not.toBe(ZeroAddress);
  }, 120_000);
});