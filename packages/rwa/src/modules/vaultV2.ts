
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
  MnftApprovalForAll,
  MnftApprovalForAllResult,
  CnftApprovalForAll,
  CnftApprovalForAllResult,
  DepositAndMint,
  DepositAndMintResult,
 } from '../types/vaults';

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
  IMachineNft__factory,
  IContractNft__factory,
  NativeTransferFeeModule__factory,
  ModuleProxy__factory
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

  private _mnft(runner: Signer | Provider, address: string) {
    return IMachineNft__factory.connect(address, runner);
  }

  private _cnft(runner: Signer | Provider, address: string) {
    return IContractNft__factory.connect(address, runner);
  }
//   private _token(runner: Signer | Provider, address: string) {
//     return IToken__factory.connect(getAddress(address), runner);
//   }

//   private _mnfts(runner: Signer | Provider, address: string) {
//     const addr = getAddress(address);
//     return IMachineNft__factory.connect(addr, runner);
//   }

  public async createVault(opts: CreateVault): Promise<CreateVaultResult> {
    const { recipient, tokenName, tokenSymbol, vaultFactory, infoDesk, trustedClaimIssuers, owner, erc20Address } = parseOptions<CreateVault>(opts, {
      recipient: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenName: { required: true, validator: validators.string, expected: 'string' },
      tokenSymbol: { required: true, validator: validators.string, expected: 'string' },
      vaultFactory: { required: true, validator: validators.address, expected: 'EVM address string' },
      infoDesk: { required: true, validator: validators.address, expected: 'EVM address string' },
      trustedClaimIssuers: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
      owner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      erc20Address: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'createVault');

    const vaultFactoryContract = this._vaultFactory(owner, vaultFactory);

    const complianceModules = await this._deployVaultComplianceModule(infoDesk, owner);

    try {
        await vaultFactoryContract.createVault.staticCall(recipient, tokenName, tokenSymbol, erc20Address, ZeroAddress, trustedClaimIssuers, [ClaimTopics.CT_KYC_APPROVED], complianceModules);
      } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
        throw new SDKError('SIMULATE/CREATE_VAULT', 'VaultFactory callStatic failed; creating vault would revert', { cause });
      }
  
    const createVaultTx = await vaultFactoryContract.createVault.populateTransaction(recipient, tokenName, tokenSymbol, erc20Address, ZeroAddress, trustedClaimIssuers, [ClaimTopics.CT_KYC_APPROVED], complianceModules);
    const receipt = await waitForTx(owner, createVaultTx);

    const iface = IPeaqVaultFactory__factory.createInterface();
    const args = await getArgsFromTxEvent(receipt, 'VaultCreated', iface);
    const vaultAddr = args[0];
    const tokenAddr = args[1];
    const distributorAddr = args[2];
    console.log('✅ Vault created successfully:');
    console.log(`   - Vault address:       ${vaultAddr}`);
    console.log(`   - Token address:       ${tokenAddr}`);
    console.log(`   - Distributor address: ${distributorAddr}`);
  
    return { vault: vaultAddr, token: tokenAddr, distributor: distributorAddr };
    
  }

  /**
   * Unpauses a token for a given vault.
   * 
   * @type {UnpauseToken} - The parameter type options for unpausing a token
   * @returns {UnpauseTokenResult} The result of unpausing a token
   */
  public async unpauseToken(opts: UnpauseToken): Promise<UnpauseTokenResult> {
    // validate and parse parameter type options for improved error messages for user
    const { admin, vaultFactory, vault } = parseOptions<UnpauseToken>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vaultFactory: { required: true, validator: validators.address, expected: 'EVM address string' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'unpauseToken');

    const vaultFactoryContract = this._vaultFactory(admin, vaultFactory);

    // preflight check
    try {
      await vaultFactoryContract.unpauseVaultToken.staticCall(vault);
    } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
      throw new SDKError('SIMULATE/UNPAUSE_TOKEN', 'VaultFactory callStatic failed; unpausing would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await vaultFactoryContract.unpauseVaultToken.populateTransaction(vault);
    const result = await waitForTx(admin, tx);

    return {result: "Unpaused token for vault: " + vault, receipt: result};
  }

  /**
   * Pauses a token for a given vault.
   * 
   * @type {PauseToken} - The parameter type options for pausing a token
   * @returns {PauseTokenResult} The result of pausing a token
   */
  public async pauseToken(opts: PauseToken): Promise<PauseTokenResult> {
    // validate and parse parameter type options for improved error messages for user
    const { admin, vaultFactory, vault } = parseOptions<PauseToken>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vaultFactory: { required: true, validator: validators.address, expected: 'EVM address string' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'pauseToken');

    // NOTE: `vault` is the vault address to be unpaused. The tx must be sent to the VaultFactory.
    const vaultFactoryContract = this._vaultFactory(admin, vaultFactory);

    // preflight check
    try {
      await vaultFactoryContract.pauseVaultToken.staticCall(vault);
    } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
      throw new SDKError('SIMULATE/PAUSE_TOKEN', 'VaultFactory callStatic failed; pausing would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await vaultFactoryContract.pauseVaultToken.populateTransaction(vault);
    const result = await waitForTx(admin, tx);

    return {result: "Paused token for vault: " + vault, receipt: result};
  }

  /**
   * Registers an identity for a given token.
   * 
   * @type {RegisterIdentity} - The parameter type options for registering an identity
   * @returns {RegisterIdentityResult} The result of registering an identity
   */
  public async registerIdentity(opts: RegisterIdentity): Promise<RegisterIdentityResult> {
    const { admin, vault, eoa, identity, country } = parseOptions<RegisterIdentity>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      eoa: { required: true, validator: validators.address, expected: 'EVM address string' },
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      country: { required: true, validator: validators.string, expected: 'string' },
    }, 'registerIdentity');

    const peaqVault = this._peaqVault(this.provider, vault);
    const irAddr = await peaqVault.identityRegistry();
    const identityRegistry = this._vaultIdentityRegistry(admin, irAddr);

    try {
      await identityRegistry.registerIdentity.staticCall(eoa, identity, country);
    } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
      throw new SDKError('SIMULATE/REGISTER_IDENTITY', 'IdentityRegistry callStatic failed; registration would revert', { cause });
    }
    // if it doesn't revert, send the transaction
    const tx = await identityRegistry.registerIdentity.populateTransaction(eoa, identity, country);
    const result = await waitForTx(admin, tx);
    return {result: `Registered eoa ${eoa} with identity ${identity} in vault ${vault}.`};
    
  }

  /**
   * Approves a vault as an operator for a given machine NFT.
   * 
   * @type {MnftApprovalForAll} - The parameter type options for approving a vault as an operator for a machine NFT
   * @returns {MnftApprovalForAllResult} The result of approving a vault as an operator for a machine NFT
   */
  public async mnftApprovalForAll(opts: MnftApprovalForAll): Promise<MnftApprovalForAllResult> {
    const { owner, mnft, vault, approved } = parseOptions<MnftApprovalForAll>(opts, {
      owner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      mnft: { required: true, validator: validators.address, expected: 'EVM address string' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      approved: { required: true, validator: validators.boolean, expected: 'boolean' },
    }, 'mnftApprovalForAll');
    
    const mnftContract = this._mnft(owner, mnft);

    try {
      await mnftContract.setApprovalForAll.staticCall(vault, approved);
    } catch (cause: any) {
        console.log(cause)
      throw new SDKError('SIMULATE/MNFT_APPROVAL_FOR_ALL', 'MachineNFT callStatic failed; approval would revert', { cause });
    }
    const approvalTx = await mnftContract.setApprovalForAll.populateTransaction(vault, approved);
    const result = await waitForTx(owner, approvalTx);

    return {result: `Set approval of vault ${vault} as operator for MNFT ${mnft} to ${approved}.`};
  }

    /**
   * Approves a vault as an operator for a given contract NFT.
   * 
   * @type {CnftApprovalForAll} - The parameter type options for approving a vault as an operator for a contract NFT
   * @returns {CnftApprovalForAllResult} The result of approving a vault as an operator for a contract NFT
   */
    public async cnftApprovalForAll(opts: CnftApprovalForAll): Promise<CnftApprovalForAllResult> {
      const { owner, cnft, vault, approved } = parseOptions<CnftApprovalForAll>(opts, {
        owner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
        cnft: { required: true, validator: validators.address, expected: 'EVM address string' },
        vault: { required: true, validator: validators.address, expected: 'EVM address string' },
        approved: { required: true, validator: validators.boolean, expected: 'boolean' },
      }, 'cnftApprovalForAll');
      
      const cnftContract = this._cnft(owner, cnft);
  
      try {
        await cnftContract.setApprovalForAll.staticCall(vault, approved);
      } catch (cause: any) {
          console.log(cause)
        throw new SDKError('SIMULATE/CNFT_APPROVAL_FOR_ALL', 'ContractNFT callStatic failed; approval would revert', { cause });
      }
      const approvalTx = await cnftContract.setApprovalForAll.populateTransaction(vault, approved);
      const result = await waitForTx(owner, approvalTx);
  
      return {result: `Set approval of vault ${vault} as operator for CNFT ${cnft} to ${approved}.`};
    }

  /**
   * Deposits and mints tokens for a given vault.
   * 
   * @type {DepositAndMint} - The parameter type options for depositing and minting tokens
   * @returns {DepositAndMintResult} The result of depositing and minting tokens
   */
  public async depositAndMint(opts: DepositAndMint): Promise<DepositAndMintResult> {
    const { owner, vault, rwaNfts, tokenIds, amount } = parseOptions<DepositAndMint>(opts, {
      owner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      vault: { required: true, validator: validators.address, expected: 'EVM address string' },
      rwaNfts: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
      tokenIds: { required: true, validator: validators.arrayOf(validators.string), expected: 'array of numbers' },
      amount: { required: true, validator: validators.number, expected: 'number' },
    }, 'depositAndMint');

    // Normalize tokenIds to bigint
    const tokenIdsBigInt = tokenIds.map((id) => BigInt(id));

    const peaqVault = this._peaqVault(owner, vault);

    try {
      await peaqVault.depositAndMint.staticCall(rwaNfts, tokenIdsBigInt, amount);
    } catch (cause: any) {
        console.log(cause)
      throw new SDKError('SIMULATE/DEPOSIT_AND_MINT', 'PeaqVault callStatic failed; deposit and mint would revert', { cause });
    }
    const depositAndMintTx = await peaqVault.depositAndMint.populateTransaction(rwaNfts, tokenIdsBigInt, amount);  
    const result = await waitForTx(owner, depositAndMintTx);
    
    return {result: `Deposited and minted tokens for vault ${vault}.`}; 
  }


  private async _deployVaultComplianceModule(infoDesk: string, owner: Signer) {
    let complianceModuleAddrs: string[] = [];

    const infoDeskContract = this._infoDesk(this.provider, infoDesk);

    const iface = NativeTransferFeeModule__factory.createInterface();
    const initData = iface.encodeFunctionData("initialize", [infoDesk]);
    console.log('initData', initData);

    const addr = await infoDeskContract.getImplementation(IDImplementationType.NativeTransferFeeModule);
    console.log('addr', addr);

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
    console.log('Module Proxy address: ', address);
    return address;
  }
}