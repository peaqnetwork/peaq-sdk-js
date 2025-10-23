import agung from '../addresses/agung.json';
import peaq from '../addresses/peaq.json';
import { Chain } from '../enums/core';
import type { Provider } from 'ethers';

export type SDKInit = {
  chainId: Chain;
  provider: Provider;
}

export type NetworkAddresses = typeof agung | typeof peaq;