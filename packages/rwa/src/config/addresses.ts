import agung from '../addresses/agung.json';
import peaq from '../addresses/peaq.json';
import type { NetworkAddresses } from '../types/core';

const byChainId: Record<number, NetworkAddresses> = {
  9990: agung,
  3338: peaq
};

export function getAddresses(chainId: number): NetworkAddresses {
  const a = byChainId[chainId];
  if (!a) throw new Error(`Unsupported chainId: ${chainId}`);
  return a;
}