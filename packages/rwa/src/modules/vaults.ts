// import IMachineVaultFactoryABI from '../abis/IMachineVaultFactory.json';
// import IMachineVaultABI from '../abis/IMachineVault.json';
// import IIdentityRegistryABI from '../abis/IIdentityRegistry.json';
// import ITokenABI from '../abis/IToken.json';
// import IMachineNFTsABI from '../abis/IMachineNFTs.json';

import type { NetworkAddresses } from '../types/core';
import type { CreateVaultAndToken, CreateVaultAndTokenResult, MintSecurityTokens, MintSecurityTokensResult, UnpauseToken, UnpauseTokenResult, Transfer, TransferResult, RegisterIdentity, RegisterIdentityResult, ApproveVaultAsOperator, ApproveVaultAsOperatorResult } from '../types/vault';

import type { Provider, Signer } from 'ethers';
import { getAddress, parseUnits } from 'ethers';

import { getContract, waitForTx } from '../utils/txs';
import { getArgsFromTxEvent } from '../utils/helpers';

import {
  IMachineVaultFactory__factory,
  IMachineVault__factory,
  IIdentityRegistry__factory,
  IToken__factory,
  IMachineNFTs__factory,
} from '../typechain';

export class Vaults {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider,
  ) {}

  private _vaultFactory(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.vaults.factory);
    return IMachineVaultFactory__factory.connect(addr, runner);
  }

  private _machineVault(runner: Signer | Provider, address: string) {
    return IMachineVault__factory.connect(getAddress(address), runner);
  }

  private _identityRegistry(runner: Signer | Provider, address: string) {
    return IIdentityRegistry__factory.connect(getAddress(address), runner);
  }

  private _token(runner: Signer | Provider, address: string) {
    return IToken__factory.connect(getAddress(address), runner);
  }

  private _mnfts(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.mnfts.machineNft);
    return IMachineNFTs__factory.connect(addr, runner);
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

  public async registerIdentity(opts: RegisterIdentity): Promise<RegisterIdentityResult> {
    const { admin, token, eoa, identity, country } = opts;

    const tokenContract = this._token(this.provider, token);

    const tokenRegistry = await tokenContract.identityRegistry();
    const identityRegistry = this._identityRegistry(admin, tokenRegistry);
    const tx = await identityRegistry.registerIdentity.populateTransaction(eoa, identity, country);
    const receipt = await waitForTx(admin, tx);
    
    return {result: "Registered identity for recipient: " + identity, receipt: receipt};
  }

  public async approveVaultAsOperator(opts: ApproveVaultAsOperator): Promise<ApproveVaultAsOperatorResult> {
    const { machineNFT, tokenOwner, vault } = opts;
    const mnfts = this._mnfts(tokenOwner, machineNFT)
    const tx2 = await mnfts.setApprovalForAll.populateTransaction(vault, true);
    const receipt = await waitForTx(tokenOwner, tx2);

    return {result: "Approved vault as operator", receipt: receipt};
  }

  public async mintSecurityTokens(opts: MintSecurityTokens): Promise<MintSecurityTokensResult> {
    const { tokenOwner, vault, machineNFTs, tokenIds, amount } = opts;
      const machineVaultContract = this._machineVault(tokenOwner, vault);
      const tx3 = await machineVaultContract.depositAndMint.populateTransaction(machineNFTs, tokenIds, amount);
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