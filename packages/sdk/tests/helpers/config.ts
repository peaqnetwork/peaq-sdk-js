import 'dotenv/config';
import { Wallet } from 'ethers';

export type EvmNetwork = {
  label: string;
  baseUrl: string;
  wallet: Wallet;
};

const wallet = new Wallet(process.env.EVM_PRIVATE || '');

const maybe = (label: string, baseUrl?: string | null): EvmNetwork | null => {
  if (!baseUrl) return null;
  if (!wallet) return null;
  return { label, baseUrl, wallet };
};

export const EVM_NETWORKS: EvmNetwork[] = [
  maybe('peaq', process.env.PEAQ_HTTPS),
  maybe('agung', process.env.AGUNG_HTTPS),
].filter(Boolean) as EvmNetwork[];