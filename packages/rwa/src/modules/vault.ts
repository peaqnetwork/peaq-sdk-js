
import type { NetworkAddresses } from '../types/core';
import type { 
  CreateVault,
  CreateVaultResult,
  UnpauseToken,
  UnpauseTokenResult,
  PauseToken,
  PauseTokenResult,
  RegisterIdentity,
  RegisterIdentityResult,
  NftApproval,
  NftApprovalResult,
  DepositAndMint,
  DepositAndMintResult,
  EnsureTransferFeeAllowance,
  EnsureTransferFeeAllowanceResult,
  Transfer,
  TransferResult,
  DepositYield,
  DepositYieldResult,
  ClaimYield,
  ClaimYieldResult,
  ClaimYieldTo,
  ClaimYieldToResult,
 } from '../types/vault';

import type { Provider, Signer } from 'ethers';
import { getAddress, parseUnits, ZeroAddress } from 'ethers';

import { IDImplementationType } from '../types/core';
import { ClaimTopics } from '../enums/claimTopics';
import { waitForTx } from '../utils/txs';
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { SDKError } from '../errors/errors';

import {
  IPeaqVault__factory,
  IPeaqVaultFactory__factory,
  IIdentityRegistry__factory,
  IInfoDesk__factory,
  IERC721__factory,
  NativeTransferFeeModule__factory,
  ModuleProxy__factory,
  IERC20__factory,
  IToken__factory,
  IRewardDistributor__factory
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
    return IPeaqVaultFactory__factory.connect(addr, runner);
  }

  private _infoDesk(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.vault.factory);
    return IInfoDesk__factory.connect(addr, runner);
  }

  private _peaqVault(runner: Signer | Provider, address: string) {
    return IPeaqVault__factory.connect(address, runner);
  }

  private _vaultIdentityRegistry(runner: Signer | Provider, address: string) {
    return IIdentityRegistry__factory.connect(address, runner);
  }

  private _nft(runner: Signer | Provider, address: string) {
    return IERC721__factory.connect(address, runner);
  }

  private _erc20(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IERC20__factory.connect(addr, runner);
  }

  private _token(runner: Signer | Provider, address: string) {
    return IToken__factory.connect(getAddress(address), runner);
  }

  private _rewardDistributor(runner: Signer | Provider, address: string) {
    return IRewardDistributor__factory.connect(address, runner);
  }

  public async createVault(opts: CreateVault): Promise<CreateVaultResult> {
    const { vaultDeployer, vaultController, vaultFactory, infoDesk, trustedClaimIssuers, tokenName, tokenSymbol, payoutToken } = parseOptions<CreateVault>(opts, {
      vaultDeployer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vaultController: { required: true, validator: validators.address, expected: 'EVM address string' },
      vaultFactory: { required: true, validator: validators.address, expected: 'EVM address string' },
      infoDesk: { required: true, validator: validators.address, expected: 'EVM address string' },
      trustedClaimIssuers: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
      tokenName: { required: true, validator: validators.string, expected: 'string' },
      tokenSymbol: { required: true, validator: validators.string, expected: 'string' },
      payoutToken: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'createVault');

    const vaultFactoryContract = this._vaultFactory(vaultDeployer, vaultFactory);
    const complianceModules = await this._deployVaultComplianceModule(infoDesk, vaultDeployer);

    try {
        await vaultFactoryContract.createVault.staticCall(vaultController, tokenName, tokenSymbol, payoutToken, ZeroAddress, trustedClaimIssuers, [ClaimTopics.CT_KYC_APPROVED], complianceModules);
      } catch (cause: any) {
        console.log(cause)
        throw new SDKError('SIMULATE/CREATE_VAULT', 'VaultFactory callStatic failed; creating vault would revert', { cause });
      }
  
    const createVaultTx = await vaultFactoryContract.createVault.populateTransaction(vaultController, tokenName, tokenSymbol, payoutToken, ZeroAddress, trustedClaimIssuers, [ClaimTopics.CT_KYC_APPROVED], complianceModules);
    const receipt = await waitForTx(vaultDeployer, createVaultTx);

    const iface = IPeaqVaultFactory__factory.createInterface();
    const args = await getArgsFromTxEvent(receipt, 'VaultCreated', iface);
    const vaultAddr = args[0];
    const tokenAddr = args[1];
    const distributorAddr = args[2];
  
    return { status: 'created', vault: vaultAddr, token: tokenAddr, distributor: distributorAddr, receipt: receipt };
  }

  /**
   * Unpauses a token for a given vault.
   * 
   * @type {UnpauseToken} - The parameter type options for unpausing a token
   * @returns {UnpauseTokenResult} The result of unpausing a token
   */
  public async unpauseToken(opts: UnpauseToken): Promise<UnpauseTokenResult> {
    const { vaultDeployer, vaultFactory, vault } = parseOptions<UnpauseToken>(opts, {
      vaultDeployer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vaultFactory: { required: true, validator: validators.address, expected: 'EVM address string' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'unpauseToken');

    const vaultFactoryContract = this._vaultFactory(vaultDeployer, vaultFactory);
    const deployerAddr = await vaultDeployer.getAddress();
    // preflight check
    try {
      await vaultFactoryContract.unpauseVaultToken.staticCall(vault);
    } catch (cause: any) {
        console.log(cause)
      throw new SDKError('SIMULATE/UNPAUSE_TOKEN', 'VaultFactory callStatic failed; unpausing would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await vaultFactoryContract.unpauseVaultToken.populateTransaction(vault);
    const result = await waitForTx(vaultDeployer, tx);

    return {status: 'unpaused', vault: vault, vaultFactory: vaultFactory, unpausedBy: deployerAddr, receipt: result};
  }

  /**
   * Pauses a token for a given vault.
   * 
   * @type {PauseToken} - The parameter type options for pausing a token
   * @returns {PauseTokenResult} The result of pausing a token
   */
  public async pauseToken(opts: PauseToken): Promise<PauseTokenResult> {
    // validate and parse parameter type options for improved error messages for user
    const { vaultDeployer, vaultFactory, vault } = parseOptions<PauseToken>(opts, {
      vaultDeployer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vaultFactory: { required: true, validator: validators.address, expected: 'EVM address string' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'pauseToken');

    // NOTE: `vault` is the vault address to be unpaused. The tx must be sent to the VaultFactory.
    const vaultFactoryContract = this._vaultFactory(vaultDeployer, vaultFactory);
    const deployerAddr = await vaultDeployer.getAddress();
    // preflight check
    try {
      await vaultFactoryContract.pauseVaultToken.staticCall(vault);
    } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
      throw new SDKError('SIMULATE/PAUSE_TOKEN', 'VaultFactory callStatic failed; pausing would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await vaultFactoryContract.pauseVaultToken.populateTransaction(vault);
    const result = await waitForTx(vaultDeployer, tx);

    return {status: 'paused', vault: vault, vaultFactory: vaultFactory, pausedBy: deployerAddr, receipt: result};
  }

  /**
   * Registers an identity for a given token.
   * 
   * @type {RegisterIdentity} - The parameter type options for registering an identity
   * @returns {RegisterIdentityResult} The result of registering an identity
   */
  public async registerIdentity(opts: RegisterIdentity): Promise<RegisterIdentityResult> {
    const { vaultDeployer, vault, subject, subjectIdentity, country } = parseOptions<RegisterIdentity>(opts, {
      vaultDeployer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      subject: { required: true, validator: validators.address, expected: 'EVM address string' },
      subjectIdentity: { required: true, validator: validators.address, expected: 'EVM address string' },
      country: { required: true, validator: validators.string, expected: 'string' },
    }, 'registerIdentity');

    const peaqVault = this._peaqVault(this.provider, vault);
    const irAddr = await peaqVault.identityRegistry();
    const identityRegistry = this._vaultIdentityRegistry(vaultDeployer, irAddr);
    const deployerAddr = await vaultDeployer.getAddress();
    try {
      await identityRegistry.registerIdentity.staticCall(subject, subjectIdentity, country);
    } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
      throw new SDKError('SIMULATE/REGISTER_IDENTITY', 'IdentityRegistry callStatic failed; registration would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await identityRegistry.registerIdentity.populateTransaction(subject, subjectIdentity, country);
    const result = await waitForTx(vaultDeployer, tx);
    return {
      status: 'registered',
      vault: vault, 
      identityRegistry: irAddr, 
      subject: subject, 
      subjectIdentity: subjectIdentity, 
      country: country, 
      registeredBy: deployerAddr, 
      receipt: result };
  }

  /**
   * Approves a vault as an operator for a given machine / contract NFT at the given token IDs.
   * 
   * @type {NftApproval} - The parameter type options for approving a vault as an operator for a machine / contract NFT
   * @returns {NftApprovalResult} The result of approving a vault as an operator for a machine / contract NFT
   */
  public async nftApproval(opts: NftApproval): Promise<NftApprovalResult> {
    const { machineController, nft, vault, tokenIds } = parseOptions<NftApproval>(opts, {
      machineController: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      nft: { required: true, validator: validators.address, expected: 'EVM address string' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenIds: { required: true, validator: validators.arrayOf(validators.string), expected: 'array of numbers' },
    }, 'nftApproval');
    const tokenIdsBigInt = tokenIds.map((id: string) => BigInt(id));
    const nftContract = this._nft(machineController, nft);
    const receipts = [];
    for (const tokenId of tokenIdsBigInt) {
      try {
          await nftContract.approve.staticCall(vault, tokenId);
      } catch (cause: any) {
          console.log(cause)
        throw new SDKError('SIMULATE/NFT_APPROVAL', 'MachineNFT callStatic failed; approval would revert', { cause });
      }
      const approvalTx = await nftContract.approve.populateTransaction(vault, tokenId);
      const receipt = await waitForTx(machineController, approvalTx);
      receipts.push(receipt);
  }

    return {status: 'approved', nft: nft, vault: vault, newlyApprovedTokenIds: tokenIds, receipts: receipts};
  }

  /**
   * Deposits and mints tokens for a given vault.
   * 
   * @type {DepositAndMint} - The parameter type options for depositing and minting tokens
   * @returns {DepositAndMintResult} The result of depositing and minting tokens
   */
  public async depositAndMint(opts: DepositAndMint): Promise<DepositAndMintResult> {
    const { vaultController, vault, rwaNfts, tokenIds, amount } = parseOptions<DepositAndMint>(opts, {
      vaultController: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      rwaNfts: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
      tokenIds: { required: true, validator: validators.arrayOf(validators.string), expected: 'array of numbers' },
      amount: { required: true, validator: validators.number, expected: 'number' },
    }, 'depositAndMint');

    // Normalize tokenIds to bigint
    const tokenIdsBigInt = tokenIds.map((id) => BigInt(id));
    const deployerAddr = await vaultController.getAddress();
    const peaqVault = this._peaqVault(vaultController, vault);

    try {
      await peaqVault.depositAndMint.staticCall(rwaNfts, tokenIdsBigInt, amount);
    } catch (cause: any) {
        console.log(cause)
      throw new SDKError('SIMULATE/DEPOSIT_AND_MINT', 'PeaqVault callStatic failed; deposit and mint would revert', { cause });
    }
    const depositAndMintTx = await peaqVault.depositAndMint.populateTransaction(rwaNfts, tokenIdsBigInt, amount);  
    const result = await waitForTx(vaultController, depositAndMintTx);

    return {status: 'deposited_and_minted', vault: vault, controller: deployerAddr, rwaNfts: rwaNfts, tokenIds: tokenIds, amount: amount, receipt: result}; 
  }


  /**
   * Ensures a transfer fee allowance is set for a given token.
   * 
   * @type {EnsureTransferFeeAllowance} - The parameter type options for ensuring a transfer fee allowance is set
   * @returns {EnsureTransferFeeAllowanceResult} The result of ensuring a transfer fee allowance is set
   */
  public async ensureTransferFeeAllowance(opts: EnsureTransferFeeAllowance): Promise<EnsureTransferFeeAllowanceResult> {
    const { allowanceSigner, vault, token, erc20, transferAmountHuman } = parseOptions<EnsureTransferFeeAllowance>(opts, {  
      allowanceSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      token: { required: true, validator: validators.address, expected: 'EVM address string' },
      erc20: { required: true, validator: validators.address, expected: 'EVM address string' },
      transferAmountHuman: { required: true, validator: validators.string, expected: 'string' },
    }, 'ensureTransferFeeAllowance');

    const tokenContract = this._token(this.provider, token);
    const tokenDecimals = Number(await tokenContract.decimals());
    const scaledAmount = parseUnits(transferAmountHuman, tokenDecimals);

    const peaqVault = this._peaqVault(this.provider, vault);

    const [fee, account] = await peaqVault.transactionFeeAndAccount(scaledAmount);

    const erc20Contract = this._erc20(allowanceSigner, erc20);
    const allowanceAddr = await allowanceSigner.getAddress();
    const allowance = await erc20Contract.allowance(allowanceAddr, account);
    const deployerAddr = await allowanceSigner.getAddress();


    if (allowance >= fee * 2n) {
      return {status: 'already_sufficient', vault: vault, feeToken: erc20, transfer: {token: token, amountHuman: transferAmountHuman, amountUnits: scaledAmount, tokenDecimals: tokenDecimals}, fee: {requiredAllowance: fee, allowanceBefore: allowance, allowanceAfter: allowance}, approvedBy: deployerAddr};
    }
    // preflight check
    try {
      await erc20Contract.approve.staticCall(account, fee * 2n);
    } catch (cause: any) {
      console.log(cause)
      throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
    }
    const approveTx = await erc20Contract.approve.populateTransaction(account, fee * 2n);
    const receipt = await waitForTx(allowanceSigner, approveTx);
    const allowanceAfter = await erc20Contract.allowance(allowanceAddr, account);
    return {
      status: 'approved', 
      vault: vault, 
      feeToken: erc20, 
      transfer: {
        token: token, 
        amountHuman: transferAmountHuman,
        amountUnits: scaledAmount, 
        tokenDecimals: tokenDecimals }, 
      fee: {
        requiredAllowance: fee * 2n,
        allowanceBefore: allowance,
        allowanceAfter: allowanceAfter,
      },
      approvedBy: deployerAddr, 
      receipt: receipt};  
  }

  /**
   * Transfers tokens from one address to another.
   * 
   * @type {Transfer} - The parameter type options for transferring tokens
   * @returns {TransferResult} The result of transferring tokens
   */
    public async transfer(opts: Transfer): Promise<TransferResult> {
      // validate and parse parameter type options for improved error messages for user
      const { from, to, token, transferAmountHuman } = parseOptions<Transfer>(opts, {
        from: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
        to: { required: true, validator: validators.address, expected: 'EVM address string' },
        token: { required: true, validator: validators.address, expected: 'EVM address string' },
        transferAmountHuman: { required: true, validator: validators.string, expected: 'string' },
      }, 'transfer');

      const tokenContract = this._token(from, token);
  
      // Scale amount according to token decimals. If decimals not provided, fetch from token.
      const tokenDecimals = Number(await tokenContract.decimals());
      const scaledAmount = parseUnits(transferAmountHuman, tokenDecimals);
      const senderAddr = await from.getAddress();
      // preflight check
      try {
        await tokenContract.transfer.staticCall(to, scaledAmount);
      } catch (cause: any) {
        console.log(cause)
        throw new SDKError('SIMULATE/TRANSFER_TOKENS', 'Token callStatic failed; transfer would revert', { cause });
      }
      // if it doesn't revert, send the transaction
      const tx2 = await tokenContract.transfer.populateTransaction(to, scaledAmount);
      const result = await waitForTx(from, tx2);
  
      return {status: 'transferred', token: token, sender: senderAddr, recipient: to, amount: {human: transferAmountHuman, units: scaledAmount, decimals: tokenDecimals}, receipt: result};
    }


  /**
   * Deposits yield to a given vault.
   * 
   * @type {DepositYield} - The parameter type options for depositing yield to a vault
   * @returns {DepositYieldResult} The result of depositing yield to a vault
   */
    public async depositYield(opts: DepositYield): Promise<DepositYieldResult> {
      const { depositorSigner, vault, erc20, decimals, humanReadableAmount } = parseOptions<DepositYield>(opts, {  
        depositorSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
        vault: { required: true, validator: validators.address, expected: 'EVM address string' },
        erc20: { required: true, validator: validators.address, expected: 'EVM address string' },
        decimals: { required: true, validator: validators.number, expected: 'number' },   
        humanReadableAmount: { required: true, validator: validators.string, expected: 'string' },
      }, 'depositYield');

      const rewardDistributorAddr = await this._getRewardDistributor(vault);
      const rewardDistributor = this._rewardDistributor(depositorSigner, rewardDistributorAddr);

      const erc20Contract = this._erc20(depositorSigner, erc20);
      const scaledAmount = parseUnits(humanReadableAmount, decimals);

      const depositorAddr = await depositorSigner.getAddress();
      const allowance = await erc20Contract.allowance(depositorAddr, rewardDistributorAddr);

      // TODO maybe split up again...
      try {
        await erc20Contract.approve.staticCall(rewardDistributorAddr, scaledAmount);
      } catch (cause: any) {
        console.log(cause)
        throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
      }
      const approveTx = await erc20Contract.approve.populateTransaction(rewardDistributorAddr, scaledAmount);
      await waitForTx(depositorSigner, approveTx);

      try {
        await rewardDistributor.depositYield.staticCall(scaledAmount);
      } catch (cause: any) { 
        console.log(cause)
        throw new SDKError('SIMULATE/DEPOSIT_YIELD', 'RewardDistributor callStatic failed; deposit yield would revert', { cause });
      }
      const depositYieldTx = await rewardDistributor.depositYield.populateTransaction(scaledAmount);
      const receipt = await waitForTx(depositorSigner, depositYieldTx);

      return {
        status: 'deposited', 
        vault: vault,
        rewardDistributor: rewardDistributorAddr,
        depositor: depositorAddr,
        token: {address: erc20, decimals: decimals}, 
        amount: {human: humanReadableAmount, units: scaledAmount}, 
        approval: {status: 'approved', spender: rewardDistributorAddr, allowanceBefore: allowance, allowanceAfter: scaledAmount}, 
        receipt: receipt
      }; 
    }

  /**
   * Claims yield from a given vault.
   * 
   * @type {ClaimYield} - The parameter type options for claiming yield from a vault
   * @returns {ClaimYieldResult} The result of claiming yield from a vault
   */
    public async claimYield(opts: ClaimYield): Promise<ClaimYieldResult> {
      const { claimerSigner, vault } = parseOptions<ClaimYield>(opts, {
        claimerSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
        vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      }, 'claimYield');

      const rewardDistributorAddr = await this._getRewardDistributor(vault);
      const rewardDistributor = this._rewardDistributor(claimerSigner, rewardDistributorAddr);
      const claimerAddr = await claimerSigner.getAddress();
      try {
        await rewardDistributor.claim.staticCall();
      } catch (cause: any) { 
        console.log(cause)
        throw new SDKError('SIMULATE/CLAIM_YIELD', 'RewardDistributor callStatic failed; claim yield would revert', { cause });
      }
      const depositYieldTx = await rewardDistributor.claim.populateTransaction();
      const receipt = await waitForTx(claimerSigner, depositYieldTx);

      return {status: 'claimed', vault: vault, rewardDistributor: rewardDistributorAddr, claimer: claimerAddr, receipt: receipt};
    }

  /**
   * Claims yield to a given address.
   * 
   * @type {ClaimYieldTo} - The parameter type options for claiming yield from a vault
   * @returns {ClaimYieldToResult} The result of claiming yield from a vault
   */
    public async claimYieldTo(opts: ClaimYieldTo): Promise<ClaimYieldToResult> {
      const { claimerSigner, vault, to } = parseOptions<ClaimYieldTo>(opts, {  
        claimerSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
        vault: { required: true, validator: validators.address, expected: 'EVM address string' },
        to: { required: true, validator: validators.address, expected: 'EVM address string' },
      }, 'claimYieldTo');

      const rewardDistributorAddr = await this._getRewardDistributor(vault);
      const rewardDistributor = this._rewardDistributor(claimerSigner, rewardDistributorAddr);
      const claimerAddr = await claimerSigner.getAddress();
      try {
        await rewardDistributor.claimTo.staticCall(to);
      } catch (cause: any) { 
        console.log(cause)
        throw new SDKError('SIMULATE/CLAIM_YIELD_TO', 'RewardDistributor callStatic failed; claim yield would revert', { cause });
      }
      const depositYieldTx = await rewardDistributor.claimTo.populateTransaction(to);
      const receipt = await waitForTx(claimerSigner, depositYieldTx);  

      return  {status: 'claimed', vault: vault, rewardDistributor: rewardDistributorAddr, claimer: claimerAddr, recipient: to, receipt: receipt};
    }


  private async _deployVaultComplianceModule(infoDesk: string, owner: Signer) {
    let complianceModuleAddrs: string[] = [];

    const infoDeskContract = this._infoDesk(this.provider, infoDesk);

    const iface = NativeTransferFeeModule__factory.createInterface();
    const initData = iface.encodeFunctionData("initialize", [infoDesk]);

    const addr = await infoDeskContract.getImplementation(IDImplementationType.NativeTransferFeeModule);

    const moduleAddress = await this._deployComplianceModule(addr, initData, owner);
    complianceModuleAddrs.push(moduleAddress);
    return complianceModuleAddrs;
  }

  private async _deployComplianceModule(implAddr: string, initData: string, owner: Signer) {

    const factory = new ModuleProxy__factory(owner);
    const proxy = await factory.deploy(implAddr, initData);
    await proxy.waitForDeployment();

    // Get the deployed address
    const address = await proxy.getAddress();
    return address;
  }

  private async _getRewardDistributor(vault: string) {
    const peaqVault = this._peaqVault(this.provider, vault);
    const rewardDistributor = await peaqVault.rewardDistributor();
    return rewardDistributor;
  }
}