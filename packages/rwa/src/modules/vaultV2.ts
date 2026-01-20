
import type { NetworkAddresses } from '../types/core';
import type { 
  CreateVault,
  CreateVaultResult,
  UnpauseToken,
  UnpauseTokenResult,
  PauseToken,
  PauseTokenResult,
 } from '../types/vaults';

import type { Provider, Signer } from 'ethers';
import { getAddress, parseUnits, ZeroAddress } from 'ethers';

import { IDImplementationType } from '../types/core';
import { ClaimTopics } from '../enums/claimTopics';
import { waitForTx } from '../utils/txs';
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { SDKError } from '../errors/errors';

import {
  IPeaqVaultFactory__factory,
  IInfoDesk__factory,
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

//   private _identityRegistry(runner: Signer | Provider, address: string) {
//     return IIdentityRegistry__factory.connect(getAddress(address), runner);
//   }

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