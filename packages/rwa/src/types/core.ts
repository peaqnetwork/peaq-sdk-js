import agung from '../addresses/agung.json';
import peaq from '../addresses/peaq.json';
import { Chain } from '../enums/core';

export interface SDKInit {
  chainId: Chain;
}

export type NetworkAddresses = typeof agung | typeof peaq;