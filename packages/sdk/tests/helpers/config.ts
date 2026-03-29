import 'dotenv/config';
import { Wallet } from 'ethers';

export type EvmNetwork = {
  label: string;
  baseUrl: string;
  wallet: Wallet;
};

const createWallet = (): Wallet | null => {
  const privateKey = process.env.EVM_PRIVATE;
  if (!privateKey) return null;

  try {
    return new Wallet(privateKey);
  } catch {
    return null;
  }
};

export const EVM_NETWORKS: EvmNetwork[] = [
  { label: 'peaq', baseUrl: process.env.PEAQ_HTTPS!, wallet: createWallet() },
  { label: 'agung', baseUrl: process.env.AGUNG_HTTPS!, wallet: createWallet() }
].filter(Boolean) as EvmNetwork[];