import { describe, it, expect } from 'vitest';
import { type Wallet } from 'ethers';

import { Sdk, ChainType } from '../../src/index';
import { EVM_NETWORKS } from '../helpers/config';

// Build tuple cases so only the label is printed in test titles (no secrets in logs)
const CASES: [string, string, Wallet | string][] = EVM_NETWORKS.length
  ? EVM_NETWORKS.map((n) => [n.label, n.baseUrl, n.wallet])
  : [['skipped', '', '']];

describe.skip.each(CASES)('[did] EVM %s', (_label, baseUrl, wallet) => {
  const run = baseUrl && wallet ? it : it.skip;

  run('DID controller and didAddress the same', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet,
    });
    const controller = (wallet as Wallet).address!;
    const didAddress = (wallet as Wallet).address!;

    const name = `did:peaq:${(wallet as Wallet).address!}`;

    const createRes: any = await sdk.did.create({
      name,
      controller: controller,
      didAddress: didAddress,
      verificationMethods: [{ type: Sdk.VerificationMethodType.ECDSA }],
      services: [{ id: '#ipfs', type: 'peaqStorage', data: 'hello-world' }],
      signature: { type: Sdk.VerificationMethodType.ECDSA, issuer: controller, hash: 'hello-world' },
    });
    const createReceipt = await createRes.receipt;
    expect(createReceipt.status).toBe(1);

    // Should be able to read the DID & confirm controller and didAddress are set as defined
    const did = await sdk.did.read({name: name, address: didAddress});
    expect(did).toBeDefined();
    expect(did?.name).toBe(name);
    expect(did?.document).toBeDefined();
    expect(did?.document?.id).toBe(`did:peaq:${didAddress}`);
    expect(did?.document?.controller).toBe(`did:peaq:${controller}`);

    const removeRes: any = await sdk.did.remove({ name, address: didAddress });
    const removeReceipt = await removeRes.receipt;
    expect(removeReceipt.status).toBe(1);
  });

  run('DID controller and didAddress different', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet,
    });
    const controller = (wallet as Wallet).address!;
    const didAddress = "0x48C9774C88736F7c169D2598278876727AFD3599";

    const name = `did:peaq:test:${(wallet as Wallet).address!}`;

    const createRes: any = await sdk.did.create({
      name,
      controller: controller,
      didAddress: didAddress,
      verificationMethods: [{ type: Sdk.VerificationMethodType.ECDSA }],
      services: [{ id: '#ipfs', type: 'peaqStorage', data: 'hello-world' }],
      signature: { type: Sdk.VerificationMethodType.ECDSA, issuer: controller, hash: 'hello-world' },
    });
    const createReceipt = await createRes.receipt;
    expect(createReceipt.status).toBe(1);

    // Should be able to read the DID & confirm controller and didAddress are set as defined
    const did = await sdk.did.read({name: name, address: didAddress});
    expect(did).toBeDefined();
    expect(did?.name).toBe(name);
    expect(did?.document).toBeDefined();
    expect(did?.document?.id).toBe(`did:peaq:${didAddress}`);
    expect(did?.document?.controller).toBe(`did:peaq:${controller}`);

    const removeRes: any = await sdk.did.remove({ name, address: didAddress });
    const removeReceipt = await removeRes.receipt;
    expect(removeReceipt.status).toBe(1);
  });
});


