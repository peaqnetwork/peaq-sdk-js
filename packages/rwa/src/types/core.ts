import agung from '../addresses/agung.json';
import peaq from '../addresses/peaq.json';

export enum Chain {
  AGUNG = 9990,
  PEAQ = 3338
}
  
export interface SDKInit {
  chainId: Chain;
}

export type NetworkAddresses = typeof agung | typeof peaq;
