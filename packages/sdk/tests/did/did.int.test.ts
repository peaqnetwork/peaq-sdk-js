import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { Wallet } from 'ethers';

import { Sdk, ChainType } from '../../src/index';
import { EVM_NETWORKS } from '../helpers/config';

const _randSuffix = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const CASES: [string, string, Wallet | null][] = EVM_NETWORKS.length
  ? EVM_NETWORKS.map((n) => [n.label, n.baseUrl, n.wallet as unknown as Wallet | null])
  : [['skipped', '', null]];

describe.sequential.each(CASES)('did module [integration] %s', (_label, baseUrl, wallet) => {
  const canRun = Boolean(baseUrl && wallet instanceof Wallet);

  (canRun ? it : it.skip)('CRUD roundtrip (create/read/update/remove) with same controller and didAddress', async () => {
    console.log(`[did][${_label}] baseUrl=${baseUrl}`)
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet as Wallet,
    });

    const controller = (wallet as Wallet).address;
    const didAddress = (wallet as Wallet).address;
    const name = `did:peaq:test:${_randSuffix()}`;

    try {
      const createRes: any = await sdk.did.create({
        name,
        controller,
        didAddress,
        verificationMethods: [{ type: Sdk.VerificationMethodType.ECDSA }],
        services: [{ id: '#ipfs', type: 'peaqStorage', data: 'v1' }],
        signature: { type: Sdk.VerificationMethodType.ECDSA, issuer: controller, hash: 'v1' },
      });
      expect((await createRes.receipt).status).toBe(1);

      const did1 = await sdk.did.read({ name, address: didAddress });
      expect(did1).toBeDefined();
      expect(did1?.name).toBe(name);
      expect(did1?.document?.id).toBe(`did:peaq:${didAddress}`);
      expect(did1?.document?.controller).toBe(`did:peaq:${controller}`);
      expect(did1?.document?.service?.[0]?.data).toBe('v1');

      const updateRes: any = await sdk.did.update({
        name,
        controller,
        didAddress,
        verificationMethods: [{ type: Sdk.VerificationMethodType.ECDSA }],
        services: [{ id: '#ipfs', type: 'peaqStorage', data: 'v2' }],
        signature: { type: Sdk.VerificationMethodType.ECDSA, issuer: controller, hash: 'v2' },
      });
      expect((await updateRes.receipt).status).toBe(1);

      const did2 = await sdk.did.read({ name, address: didAddress });
      expect(did2).toBeDefined();
      expect(did2?.document?.service?.[0]?.data).toBe('v2');
      expect(did2?.document?.signature?.hash).toBe('v2');

      const removeRes: any = await sdk.did.remove({ name, address: didAddress });
      expect((await removeRes.receipt).status).toBe(1);

      const didAfterDelete = await sdk.did.read({ name, address: didAddress });
      expect(didAfterDelete).toBeNull();
    } finally {
      await sdk.disconnect();
    }
  }, 90_000);

  (canRun ? it : it.skip)('create/read/remove with different didAddress', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet as Wallet,
    });

    const controller = (wallet as Wallet).address;
    const didAddress = '0x48C9774C88736F7c169D2598278876727AFD3599';
    const name = `did:peaq:ext:${_randSuffix()}`;

    try {
      const createRes: any = await sdk.did.create({
        name,
        controller,
        didAddress,
        verificationMethods: [{ type: Sdk.VerificationMethodType.ECDSA }],
        services: [{ id: '#ipfs', type: 'peaqStorage', data: 'hello-world' }],
        signature: { type: Sdk.VerificationMethodType.ECDSA, issuer: controller, hash: 'hello-world' },
      });
      expect((await createRes.receipt).status).toBe(1);

      const did = await sdk.did.read({ name, address: didAddress });
      expect(did).toBeDefined();
      expect(did?.name).toBe(name);
      expect(did?.document?.id).toBe(`did:peaq:${didAddress}`);
      expect(did?.document?.controller).toBe(`did:peaq:${controller}`);

      const removeRes: any = await sdk.did.remove({ name, address: didAddress });
      expect((await removeRes.receipt).status).toBe(1);
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRun ? it : it.skip)('create rejects service without serviceEndpoint or data', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet as Wallet,
    });

    const controller = (wallet as Wallet).address;
    const didAddress = (wallet as Wallet).address;
    const name = `did:peaq:bad:${_randSuffix()}`;

    try {
      await expect(
        sdk.did.create({
          name,
          controller,
          didAddress,
          verificationMethods: [],
          services: [{ id: '#bad', type: 'peaqStorage' }],
        } as any)
      ).rejects.toThrow(/must have either serviceEndpoint or data/i);
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRun ? it : it.skip)('read requires address when no signer is configured', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
    });

    try {
      await expect(
        sdk.did.read({ name: `did:peaq:noaddr:${_randSuffix()}` } as any)
      ).rejects.toThrow(/Address is required/i);
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);
});
