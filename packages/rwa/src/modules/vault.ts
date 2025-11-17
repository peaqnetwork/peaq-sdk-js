
import type { NetworkAddresses } from '../types/core';
import type { 
  CreateVaultAndToken, 
  CreateVaultAndTokenResult, 
  MintSecurityTokens, 
  MintSecurityTokensResult, 
  UnpauseToken, 
  UnpauseTokenResult, 
  Transfer, 
  TransferResult, 
  BatchTransfer,
  BatchTransferResult,
  RegisterIdentity, 
  RegisterIdentityResult, 
  ApproveVaultAsOperator, 
  ApproveVaultAsOperatorResult
 } from '../types/vaults';

import type { Provider, Signer } from 'ethers';
import { getAddress, parseUnits } from 'ethers';

import { waitForTx } from '../utils/txs';
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { SDKError } from '../errors/errors';

import {
  IMachineVaultFactory__factory,
  IMachineVault__factory,
  IIdentityRegistry__factory,
  IToken__factory,
  IMachineNft__factory,
} from '../typechain';

/**
 * Vaults module provides functionality for creating, registering, and managing MachineVaults and their associated tokens.
 * 
 * @class Vaults
 * @param {NetworkAddresses} addresses - The network addresses for the Vaults module
 * @param {Provider} provider - The provider for the Vaults module
 */
export class Vault {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider,
  ) {}

  private _vaultFactory(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.vault.factory);
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

  private _mnfts(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IMachineNft__factory.connect(addr, runner);
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
    // validate and parse parameter type options for improved error messages for user
    const { admin, name, symbol, irs, tokenIdentity, claimIssuers, claimTopics } = parseOptions<CreateVaultAndToken>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      name: { required: true, validator: validators.string, expected: 'string' },
      symbol: { required: true, validator: validators.string, expected: 'string' },
      irs: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenIdentity: { required: true, validator: validators.address, expected: 'EVM address string' },
      claimIssuers: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
      claimTopics: { required: true, validator: validators.arrayOf(validators.number), expected: 'array of numbers' },
    }, 'createVaultAndToken');

    const vaultFactory = this._vaultFactory(admin);

    // preflight check
    try {
      await vaultFactory.createVaultAndToken.staticCall(name, symbol, irs, tokenIdentity, claimIssuers, claimTopics);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/CREATE_VAULT', 'VaultFactory callStatic failed; creation would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await vaultFactory.createVaultAndToken.populateTransaction(name, symbol, irs, tokenIdentity, claimIssuers, claimTopics);
    const receipt = await waitForTx(admin, tx);

    const iface = IMachineVaultFactory__factory.createInterface();
    const args = await getArgsFromTxEvent(receipt, 'VaultCreated', iface);
    const vault = args[0];
    const token = args[1];

    return {vault: vault, token: token, receipt: receipt}
  }

  /**
   * Registers an identity for a given token.
   * 
   * @type {RegisterIdentity} - The parameter type options for registering an identity
   * @returns {RegisterIdentityResult} The result of registering an identity
   */
  public async registerIdentity(opts: RegisterIdentity): Promise<RegisterIdentityResult> {
    // validate and parse parameter type options forimproved error messages for user
    const { admin, token, eoa, identity, country } = parseOptions<RegisterIdentity>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      token: { required: true, validator: validators.address, expected: 'EVM address string' },
      eoa: { required: true, validator: validators.address, expected: 'EVM address string' },
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      country: { required: true, validator: validators.string, expected: 'string' },
    }, 'registerIdentity');

    const tokenContract = this._token(this.provider, token);

    const tokenRegistry = await tokenContract.identityRegistry();
    const identityRegistry = this._identityRegistry(admin, tokenRegistry);
    // preflight check
    try {
      await identityRegistry.registerIdentity.staticCall(eoa, identity, country);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/REGISTER_TOKEN_IDENTITY', 'IdentityRegistry callStatic failed; registration would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await identityRegistry.registerIdentity.populateTransaction(eoa, identity, country);
    const result = await waitForTx(admin, tx);
    
    return {result: "Registered identity for recipient: " + identity, receipt: result};
  }

  /**
   * Approves a vault as an operator for a given machine NFT.
   * 
   * @type {ApproveVaultAsOperator} - The parameter type options for approving a vault as an operator
   * @returns {ApproveVaultAsOperatorResult} The result of approving a vault as an operator
   */
  public async approveVaultAsOperator(opts: ApproveVaultAsOperator): Promise<ApproveVaultAsOperatorResult> {
    // validate and parse parameter type options for improved error messages for user
    const { machineNFT, tokenOwner, vault } = parseOptions<ApproveVaultAsOperator>(opts, {
      machineNFT: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'approveVaultAsOperator');

    const mnfts = this._mnfts(tokenOwner, machineNFT)
    // preflight check
    try {
      await mnfts.setApprovalForAll.staticCall(vault, true);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/APPROVE_VAULT_AS_OPERATOR', 'MachineNFTs callStatic failed; approval would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await mnfts.setApprovalForAll.populateTransaction(vault, true);
    const receipt = await waitForTx(tokenOwner, tx);

    return {result: "Approved vault as operator", receipt: receipt};
  }

  /**
   * Mints security tokens for a given vault.
   * 
   * @type {MintSecurityTokens} - The parameter type options for minting security tokens
   * @returns {MintSecurityTokensResult} The result of minting security tokens
   */
  public async mintSecurityTokens(opts: MintSecurityTokens): Promise<MintSecurityTokensResult> {
    const { tokenOwner, vault, machineNFTs, tokenIds, amount } = opts;
      const machineVaultContract = this._machineVault(tokenOwner, vault);
      const tx3 = await machineVaultContract.depositAndMint.populateTransaction(machineNFTs, tokenIds, amount);
      const receipt3 = await waitForTx(tokenOwner, tx3);

    return {result: "Minted " + amount + " security tokens for vault: " + vault};
  }
  

  /**
   * Unpauses a token for a given vault.
   * 
   * @type {UnpauseToken} - The parameter type options for unpausing a token
   * @returns {UnpauseTokenResult} The result of unpausing a token
   */
  public async unpauseToken(opts: UnpauseToken): Promise<UnpauseTokenResult> {
    // validate and parse parameter type options for improved error messages for user
    const { admin, vault } = parseOptions<UnpauseToken>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'unpauseToken');

    const machineVault = this._machineVault(admin, vault);
    // preflight check
    try {
      await machineVault.unpauseToken.staticCall();
    } catch (cause: any) {
      throw new SDKError('SIMULATE/UNPAUSE_TOKEN', 'MachineVault callStatic failed; unpausing would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await machineVault.unpauseToken.populateTransaction();
    const result = await waitForTx(admin, tx);

    return {result: "Unpaused token for vault: " + vault, receipt: result};
  }


  /**
   * Transfers tokens from one address to another.
   * 
   * @type {Transfer} - The parameter type options for transferring tokens
   * @returns {TransferResult} The result of transferring tokens
   */
  public async transfer(opts: Transfer): Promise<TransferResult> {
    // validate and parse parameter type options for improved error messages for user
    const { token, sender, recipientAddr, amount } = parseOptions<Transfer>(opts, {
      token: { required: true, validator: validators.address, expected: 'EVM address string' },
      sender: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      recipientAddr: { required: true, validator: validators.address, expected: 'EVM address string' },
      amount: { required: true, validator: validators.number, expected: 'number' },
    }, 'transfer');

    const tokenContract = this._token(sender, token);

    // Scale amount according to token decimals. If decimals not provided, fetch from token.
    const tokenDecimals = Number(await tokenContract.decimals());
    const scaledAmount = parseUnits(amount.toString(), tokenDecimals);
    // preflight check
    try {
      await tokenContract.transfer.staticCall(recipientAddr, scaledAmount);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/TRANSFER_TOKENS', 'Token callStatic failed; transfer would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx2 = await tokenContract.transfer.populateTransaction(recipientAddr, scaledAmount);
    const result = await waitForTx(sender, tx2);

    return {result: "Transferred " + amount + " tokens (scaled by " + tokenDecimals + " decimals) from one address to another"};
  }

  /**
   * Batch transfers tokens to multiple recipients.
   * Mirrors contract `batchTransfer` which loops over `transfer`.
   *
   * @type {BatchTransfer}
   * @returns {BatchTransferResult}
   */
  public async batchTransfer(opts: BatchTransfer): Promise<BatchTransferResult> {
    // validate and parse parameter type options for improved error messages for user
    const { token, sender, recipients, amounts } = parseOptions<BatchTransfer>(opts, {
      token: { required: true, validator: validators.address, expected: 'EVM address string' },
      sender: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      recipients: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
      amounts: { required: true, validator: validators.arrayOf((v: any) => typeof v === 'number' || typeof v === 'bigint'), expected: 'array of numbers or bigints' },
    }, 'batchTransfer');

    if (recipients.length !== amounts.length) {
      throw new SDKError('SIMULATE/BATCH_TRANSFER', 'recipients and amounts must be the same length');
    }
    const tokenContract = this._token(sender, token);
    const tokenDecimals = Number(await tokenContract.decimals());
    const scaledAmounts = amounts.map((a) => BigInt(parseUnits(a.toString(), tokenDecimals)));

    try {
      await tokenContract.batchTransfer.staticCall(recipients, scaledAmounts);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/BATCH_TRANSFER', 'Token callStatic failed; batch transfer would revert', { cause });
    }

    const tx = await tokenContract.batchTransfer.populateTransaction(
      recipients,
      scaledAmounts
    );
    await waitForTx(sender, tx);

    return { result: `Transferred to ${recipients.length} recipients (scaled by ${tokenDecimals} decimals)` };
  }
}