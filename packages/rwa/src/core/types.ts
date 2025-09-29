import type { JsonRpcProvider, JsonRpcSigner, ContractRunner } from 'ethers';

export type Runner = ContractRunner; // signer or provider
export type Address = `0x${string}`;

export enum Chain {
  AGUNG = 9990,
  PEAQ = 3338
}

export interface SDKInit {
  chainId: Chain;
  runner: Runner; // signer preferred for write ops
  overrides?: {
    addresses?: Partial<import('../addresses').NetworkAddresses>;
  };
}