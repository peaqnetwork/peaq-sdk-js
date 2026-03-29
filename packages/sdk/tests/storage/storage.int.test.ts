import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { Wallet } from 'ethers';

import { ChainType, Sdk } from '../../src/index';
import { EVM_NETWORKS } from '../helpers/config';

const _randSuffix = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const CASES: [string, string, Wallet | null][] = EVM_NETWORKS.length
  ? EVM_NETWORKS.map((n) => [n.label, n.baseUrl, n.wallet as unknown as Wallet | null])
  : [['skipped', '', null]];

describe.skip.each(CASES)('storage module [integration] %s', (_label, baseUrl, wallet) => {
  const canRun = Boolean(baseUrl && wallet instanceof Wallet);

  (canRun ? it : it.skip)('add/get/update/remove string item', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet as Wallet,
    });

    const itemType = `storage:str:${_randSuffix()}`;
    const address = (wallet as Wallet).address;

    try {
      try {
        await sdk.storage.removeItem({ itemType });
      } catch {
        // ignore
      }

      const addRes: any = await sdk.storage.addItem({ itemType, item: 'hello'});
      expect((await addRes.receipt).status).toBe(1);

      const got = await sdk.storage.getItem({ itemType, address });
      expect(got?.[itemType]).toBe('hello');

      const updRes: any = await sdk.storage.updateItem({ itemType, item: 'world'});
      expect((await updRes.receipt).status).toBe(1);

      const got2 = await sdk.storage.getItem({ itemType, address });
      expect(got2?.[itemType]).toBe('world');

      const rmRes: any = await sdk.storage.removeItem({ itemType });
      expect((await rmRes.receipt).status).toBe(1);

      const got3 = await sdk.storage.getItem({ itemType, address });
      expect(got3).toBeNull();
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRun ? it : it.skip)('JSON payload roundtrip', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet as Wallet,
    });

    const itemType = `storage:json:${_randSuffix()}`;
    const address = (wallet as Wallet).address;
    const payload = { k: 'v', n: 1, nested: { ok: true } };

    try {
      try {
        await sdk.storage.removeItem({ itemType });
      } catch {
        // ignore
      }

      const addRes: any = await sdk.storage.addItem({ itemType, item: payload});
      expect((await addRes.receipt).status).toBe(1);

      const got = await sdk.storage.getItem({ itemType, address });
      expect(typeof got?.[itemType]).toBe('string');
      expect(JSON.parse(got![itemType])).toEqual(payload);

      const rmRes: any = await sdk.storage.removeItem({ itemType });
      expect((await rmRes.receipt).status).toBe(1);
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRun ? it : it.skip)('missing item returns null', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
      auth: wallet as Wallet,
    });

    try {
      const got = await sdk.storage.getItem({
        itemType: `storage:missing:${_randSuffix()}`,
        address: (wallet as Wallet).address,
      });
      expect(got).toBeNull();
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRun ? it : it.skip)('getItem requires address if no signer is configured', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl,
      chainType: ChainType.EVM,
    });

    try {
      await expect(
        sdk.storage.getItem({ itemType: `storage:noaddr:${_randSuffix()}` })
      ).rejects.toThrow(/Address is required/);
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);
});
