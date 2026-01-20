import agung from '../addresses/agung.json';
import peaq from '../addresses/peaq.json';
import { Chain } from '../enums/core';
import type { Provider } from 'ethers';

export type SDKInit = {
  chainId: Chain;
  provider: Provider;
}

export type NetworkAddresses = typeof agung | typeof peaq;

export enum IDImplementationType {
  PeaqVault = 0,
  MachineNft = 1,
  ContractNft = 2,
  RewardDistributor = 3,
  NativeTransferFeeModule = 4
}