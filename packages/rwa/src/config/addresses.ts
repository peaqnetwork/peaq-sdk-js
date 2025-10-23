import agung from '../addresses/agung.json';
import peaq from '../addresses/peaq.json';
import type { NetworkAddresses } from '../types/core';

import { getAddress } from 'ethers';

export type NetworkId = 9990 | 3338; // add as needed

export type RwaAddresses = {
  onchainid: {
    identity: string;
    implementationAuthority: string;
    idFactory: string;
    kycVerifier: string;
    mnftIssuerVerifier: string;
    mnftRegulatorVerifier: string;
  };
  trex: {
    trexImplementationAuthority: string;
    iaFactory: string;
    trexFactory: string;
    trexGateway: string;
    modularComplianceProxy: string;
    identityRegistryProxy: string;
    identityRegistryStorageProxy: string;
    trustedIssuersRegistryProxy: string;
    claimTopicsRegistryProxy: string;
  };
  mnfts: {
    peaqMachineNfts: string;
    machineNft: string;
    proxyAdmin: string;
  };
  vaults: {
    factory: string;
    proxyAdmin: string;
  };
  erc20: {
    peaq: string;
  };
};

const maps: Record<NetworkId, RwaAddresses> = {
  9990: agung as RwaAddresses,
  3338: peaq as RwaAddresses
};

export function loadAddresses(chainId: NetworkId): RwaAddresses {
  const a = maps[chainId];
  if (!a) throw new Error(`Unsupported chainId: ${chainId}`);
  // checksum at load (fail-fast)
  for (const section of Object.values(a)) {
    for (const [k, v] of Object.entries(section as Record<string, string>)) {
      (section as any)[k] = getAddress(v);
    }
  }
  return a;
}
export function getAddresses(chainId: number): NetworkAddresses {
  const a = byChainId[chainId];
  if (!a) throw new Error(`Unsupported chainId: ${chainId}`);
  return a;
}
const byChainId: Record<number, NetworkAddresses> = {
  9990: agung,
  3338: peaq
};