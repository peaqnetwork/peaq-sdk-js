import IMachineVaultFactoryABI from '../abis/IMachineVaultFactory.json';
import IMachineVaultABI from '../abis/IMachineVault.json';
import IIdentityRegistryABI from '../abis/IIdentityRegistry.json';
import ITokenABI from '../abis/IToken.json';
import IMachineNFTsABI from '../abis/IMachineNFTs.json';

import type { NetworkAddresses } from '../types/core';
import type { CreateVaultAndToken, CreateVaultAndTokenResult, MintSecurityTokens, MintSecurityTokensResult, UnpauseToken, UnpauseTokenResult, Transfer, TransferResult, RegisterIdentity, RegisterIdentityResult } from '../types/vault';

import type { Provider, Signer } from 'ethers';
import { parseUnits } from 'ethers';

import { getContract, waitForTx } from '../utils/txs';
import { getArgsFromTxEvent } from '../utils/helpers';
// import { RegisterIdentity } from '../types/trex';

export class Vaults {
  private addresses: NetworkAddresses;
  private provider: Provider;
  constructor(addresses: NetworkAddresses, provider: Provider) {
    this.addresses = addresses;
    this.provider = provider;
  }

  private _vaultFactory(runner: Signer | Provider, address?: string) {
    const addr = address ?? this.addresses.vaults.factory;
    return getContract(addr, IMachineVaultFactoryABI, runner);
  }

  private _machineVault(runner: Signer | Provider, address: string) {
    const addr = address;
    return getContract(addr, IMachineVaultABI, runner);
  }

  private _identityRegistry(runner: Signer | Provider, address: string) {
    const addr = address;
    return getContract(addr, IIdentityRegistryABI, runner);
  }

  private _token(runner: Signer | Provider, address: string) {
    const addr = address;
    return getContract(addr, ITokenABI, runner);
  }

  private _machineNFTs(runner: Signer | Provider, address?: string) {
    const addr = address ?? this.addresses.mnfts.machineNft;
    return getContract(addr, IMachineNFTsABI, runner);
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

    // TODO maybe log token ids?

    return {vault: vault, token: token}
  }

  // TODO maybe spilt up into different functions for each step?
  // 
  // allow user to pass an array of machine nft addresses to be minted
  public async mintSecurityTokens(opts: MintSecurityTokens): Promise<MintSecurityTokensResult> {
    const { admin, tokenOwner, tokenOwnerIdentity, country, vault, token, tokenIds, amount } = opts;
    const tokenContract = this._token(this.provider, token);
    const tokenRegistry = await tokenContract.identityRegistry();

    const tokenOwnerAddress = await tokenOwner.getAddress();
    const identityRegistry = this._identityRegistry(admin, tokenRegistry);
    const tx = await identityRegistry.registerIdentity.populateTransaction(tokenOwnerAddress, tokenOwnerIdentity, country);
    const receipt = await waitForTx(admin, tx);

    // TODO request mnftAddresses, find them at this location from token owner. and iterate over to populate the vault
    const mnfts = this._machineNFTs(tokenOwner)
    const tx2 = await mnfts.setApprovalForAll.populateTransaction(vault, true);
    const receipt2 = await waitForTx(tokenOwner, tx2);

    const mnftAddr = this.addresses.mnfts.machineNft;
    const machineVaultContract = this._machineVault(tokenOwner, vault);
    // TODO change from hardcoded values to dynamic values (aka mnftAddr values arg 1 here)
    const tx3 = await machineVaultContract.depositAndMint.populateTransaction([mnftAddr,mnftAddr,mnftAddr], tokenIds, amount);
    const receipt3 = await waitForTx(tokenOwner, tx3);

    return {result: "Minted " + amount + " security tokens for vault: " + vault};
  }
  

  public async unpauseToken(opts: UnpauseToken): Promise<UnpauseTokenResult> {
    const { admin, vault } = opts;

    const machineVault = this._machineVault(admin, vault);
    const tx = await machineVault.unpauseToken.populateTransaction();
    const receipt = await waitForTx(admin, tx);

    return {result: "Unpaused token for vault: " + vault, receipt: receipt};
  }

  public async registerIdentity(opts: RegisterIdentity): Promise<RegisterIdentityResult> {
    const { admin, token, recipientAddr, recipientIdentity } = opts;

    const tokenContract = this._token(this.provider, token);

    const tokenRegistry = await tokenContract.identityRegistry();
    const identityRegistry = this._identityRegistry(admin, tokenRegistry);
    const tx = await identityRegistry.registerIdentity.populateTransaction(recipientAddr, recipientIdentity, 0);
    const receipt = await waitForTx(admin, tx);
    
    return {result: "Registered identity for recipient: " + recipientIdentity, receipt: receipt};
  }

  public async transfer(opts: Transfer): Promise<TransferResult> {
    // TODO token owner better name than sender
    const { token, sender, recipientAddr, amount } = opts;
    const tokenContract = this._token(sender, token);

    // Scale amount according to token decimals. If decimals not provided, fetch from token.
    const tokenDecimals = Number(await tokenContract.decimals());
    const scaledAmount = parseUnits(amount.toString(), tokenDecimals);
    const tx2 = await tokenContract.transfer.populateTransaction(recipientAddr, scaledAmount);
    const receipt2 = await waitForTx(sender, tx2);

    return {result: "Transfered " + amount + " tokens (scaled by " + tokenDecimals + " decimals) from one address to another"};
  }
}