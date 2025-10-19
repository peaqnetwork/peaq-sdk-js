import IMachineVaultFactoryABI from '../abis/IMachineVaultFactory.json';

import type { NetworkAddresses } from '../types/core';
import type { CreateVaultAndToken, CreateVaultAndTokenResult, MintSecurityTokens, MintSecurityTokensResult } from '../types/vault';

import type { Provider, Signer } from 'ethers';

import { getContract, waitForTx } from '../utils/txs';
import { getArgsFromTxEvent } from '../utils/helpers';

export class Vaults {
  private addresses: NetworkAddresses;
  private provider: Provider;
  constructor(addresses: NetworkAddresses, provider: Provider) {
    this.addresses = addresses;
    this.provider = provider;
  }

  private _vaultFactory(runner: Signer | Provider, address?: string) {
    const addr = address ?? this.addresses.machineVaults.factory;
    return getContract(addr, IMachineVaultFactoryABI, runner);
  }

/**
 * Creates a new MachineVault and its associated token, allowing the caller to specify
 * existing Identity Registry Storage (IRS) and ONCHAINID addresses. Passing zero addresses
 * instructs the TREX factory to auto-deploy missing components.
 * 
 * @type {CreateVaultAndToken} - The parameter type options for creating a MachineVault and its associated token
 * @returns {CreateVaultAndTokenResult} The result of creating a MachineVault and its associated token
 */
  public async createVaultAndToken(opts: CreateVaultAndToken): Promise<CreateVaultAndTokenResult> {
    const { admin, name, symbol, irs, tokenIdentity, claimIssuers, claimTopics } = opts;
    const vaultFactory = this._vaultFactory(admin);

    // TODO - for simplicity we are avoiding using populate tx so we can get tx logs easier
    const tx = await vaultFactory.createVaultAndToken(name, symbol, irs, tokenIdentity, claimIssuers, claimTopics);
    // const receipt = await waitForTx(admin, tx);

    const args = await getArgsFromTxEvent(tx, 'VaultCreated');
    const vault = args[0];
    const token = args[1];

    return {vault: vault, token: token}
  }
}