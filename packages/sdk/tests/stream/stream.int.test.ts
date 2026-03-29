import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { Wallet } from 'ethers';
import { StreamPermission } from '@streamr/sdk';

import { ChainType, Sdk } from '../../src/index';
import { EVM_NETWORKS } from '../helpers/config';

const PEAQ_NETWORK = EVM_NETWORKS.find((n) => n.label === 'peaq');
const canRunPeaq = Boolean(
  PEAQ_NETWORK &&
  PEAQ_NETWORK.baseUrl &&
  PEAQ_NETWORK.wallet instanceof Wallet
);
const canRunPubSub = Boolean(
  canRunPeaq &&
  process.env.STREAM_ID &&
  process.env.PUBLISHER_KEY
);

describe.sequential('stream module [integration] peaq only', () => {
  (canRunPeaq ? it : it.skip)('creates a Streamr client instance for peaq', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl: PEAQ_NETWORK!.baseUrl,
      chainType: ChainType.EVM,
      auth: PEAQ_NETWORK!.wallet,
    });

    try {
      expect(sdk.stream).toBeDefined();
      const streamr = await sdk.stream.createInstancePeaq(process.env.EVM_PRIVATE!);
      expect(streamr).toBeDefined();
      await streamr.destroy();
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRunPeaq ? it : it.skip)('creates a public Streamr client instance', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl: PEAQ_NETWORK!.baseUrl,
      chainType: ChainType.EVM,
    });

    try {
      const streamr = await sdk.stream.createInstancePublic();
      expect(streamr).toBeDefined();
      await streamr.destroy();
    } finally {
      await sdk.disconnect();
    }
  }, 60_000);

  (canRunPubSub ? it : it.skip)('publish/subscribe flow against a public stream', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl: PEAQ_NETWORK!.baseUrl,
      chainType: ChainType.EVM,
    });

    const streamId = process.env.STREAM_ID!;
    const publisherKey = process.env.PUBLISHER_KEY!;
    const message = { hello: 'world', ts: Date.now() };

    try {
      const publisher = await sdk.stream.createInstancePeaq(publisherKey);
      const subscriber = await sdk.stream.createInstancePublic();

      const stream = await publisher.getOrCreateStream({ id: streamId });
      await stream.grantPermissions({
        public: true,
        permissions: [StreamPermission.SUBSCRIBE],
      });

      const received = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for message')), 20_000);
        subscriber.subscribe({ id: streamId }, (content) => {
          if ((content as any)?.ts === message.ts) {
            clearTimeout(timeout);
            resolve(content);
          }
        }).catch(reject);
      });

      await publisher.publish(streamId, message);
      await expect(received).resolves.toMatchObject(message);

      await subscriber.destroy();
      await publisher.destroy();
    } finally {
      await sdk.disconnect();
    }
  }, 90_000);

  (canRunPubSub ? it : it.skip)('publish/subscribe flow against a private stream', async () => {
    const sdk = await Sdk.createInstance({
      baseUrl: PEAQ_NETWORK!.baseUrl,
      chainType: ChainType.EVM,
    });

    const streamId = process.env.STREAM_ID!;
    const publisherKey = process.env.PUBLISHER_KEY!;
    const message = { hello: 'world', ts: Date.now() };

    try {
      const publisher = await sdk.stream.createInstancePeaq(publisherKey);
      const subscriber = await sdk.stream.createInstancePeaq(process.env.SUBSCRIBER_KEY!);

      const stream = await publisher.getOrCreateStream({ id: streamId });
      await stream.grantPermissions({
        userId: process.env.SUBSCRIBER!,
        permissions: [StreamPermission.SUBSCRIBE],
      });

      const received = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for message')), 20_000);
        subscriber.subscribe({ id: streamId }, (content) => {
          if ((content as any)?.ts === message.ts) {
            clearTimeout(timeout);
            resolve(content);
          }
        }).catch(reject);
      });

      await publisher.publish(streamId, message);
      await expect(received).resolves.toMatchObject(message);

      await subscriber.destroy();
      await publisher.destroy();
    } finally {
      await sdk.disconnect();
    }
  }, 90_000);
});
