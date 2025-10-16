import type { JsonRpcProvider, JsonRpcSigner, Signer } from 'ethers';

// Maybe ContractRunner instead of Signer?

export enum Chain {
  AGUNG = 9990,
  PEAQ = 3338
}

export interface SDKInit {
  chainId: Chain;
}

export interface DeployClaimIssuerParams {
  ownerAddress: string;
  signer: Signer;
  artifact: { abi: any; bytecode: string };
}

export interface AddClaimParams {
  signer: Signer;
}