import agung from './agung.json';
import peaq from './peaq.json';

export type NetworkAddresses = typeof agung | typeof peaq;

const byChainId: Record<number, NetworkAddresses> = {
  9990: agung,
  3338: peaq
};

export function getAddresses(chainId: number): NetworkAddresses {
  const a = byChainId[chainId];
  if (!a) throw new Error(`Unsupported chainId: ${chainId}`);
  return a;
}