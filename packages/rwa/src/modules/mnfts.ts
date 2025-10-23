import type { NetworkAddresses } from '../types/core';
import type { IssueMachineNFT, IssueMachineNFTResult } from '../types/mnfts';

// utils
import { Fees } from "../config/fees";
import { parseOptions, validators } from '../utils/helpers';
import { waitForTx } from '../utils/txs';
import { SDKError } from '../errors/errors';


import type { Signer, Provider } from 'ethers';
import { parseEther, getAddress } from 'ethers';
import { IMachineNFTs__factory, IERC20__factory } from '../typechain';


/**
 * MachineNFTs module provides functionality for issuing Machine NFTs for the PEAQ network.
 * 
 * @class MachineNFTs
 * @param {NetworkAddresses} addresses - The network addresses for the MachineNFTs module
 * @param {Provider} provider - The provider for the MachineNFTs module
 */
export class MachineNFTs {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider
  ) {}

  private _mnfts(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.mnfts.machineNft);
    return IMachineNFTs__factory.connect(addr, runner);
  }

  private _erc20(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IERC20__factory.connect(addr, runner);
  }


  /**
   * Issues a Machine NFT to a designated owner. Make sure the Machine NFT contract is funded.
   * 
   * @param {IssueMachineNFT} opts - The options for issuing a Machine NFT
   * @returns {IssueMachineNFTResult} The result of issuing a Machine NFT
   */
  public async issueMachineNFT(opts: IssueMachineNFT): Promise<IssueMachineNFTResult> {
    // validate and parse parameter type options for improved error messages for user
    const { machineIssuer, machineOwner, machineNFT, metadata } = parseOptions<IssueMachineNFT>(opts, {
      machineIssuer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineNFT: { required: true, validator: validators.address, expected: 'EVM address string' },
      metadata: { required: true, validator: validators.partialObject({
        brand: validators.string,
        model: validators.string,
        serialNumber: validators.string,
        uri: validators.string,
        timestamp: validators.string,
      }), expected: 'object' },
      count: { required: false, validator: validators.number, expected: 'number' },
      fees: { required: false, validator: validators.partialObject({
        feePerMint: validators.number,
        machineValue: validators.number,
        nativeDepositPerMint: validators.number,
      }), expected: 'object' },
    }, 'issueMachineNFT');

    const count = opts.count ?? 1;    
    const mnfts = this._mnfts(machineIssuer, machineNFT);

    // 1) Merge fee overrides (if provided)
    const fees = {
      feePerMint: parseEther(String(opts.fees?.feePerMint)) ?? Fees.FeePerMint,
      machineValue: parseEther(String(opts.fees?.machineValue)) ?? Fees.MachineValue,
      nativeDepositPerMint: parseEther(String(opts.fees?.nativeDepositPerMint)) ?? Fees.NativeDepositPerMint,
    };

    // 2) Approve ERC20
    const ownerAddr = await machineOwner.getAddress();
    const erc20 = this._erc20(machineOwner, this.addresses.erc20.peaq);
    const totalFeeErc20 = fees.feePerMint * BigInt(count);
    const allowance = await erc20.allowance(ownerAddr, machineNFT);
    if (allowance < totalFeeErc20) {
      // preflight check
      try {
        await erc20.approve.staticCall(machineNFT, totalFeeErc20);
      } catch (cause: any) {
        throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
      }
      const approveTx = await erc20.approve.populateTransaction(machineNFT, totalFeeErc20);
      await waitForTx(machineOwner, approveTx);
    }
  
    // 3) Mint loop (TODO batch in smart contract??)
    for (let i = 0; i < count; i++) {
      // preflight check
      try {
        await mnfts.registerMachine.staticCall(ownerAddr, fees.machineValue, metadata, { value: fees.nativeDepositPerMint });
      } catch (cause: any) {
        throw new SDKError('SIMULATE/ISSUE_MNFT', 'MachineNFTs callStatic failed; issuance would revert', { cause });
      }
      const mintTx = await mnfts.registerMachine.populateTransaction(
        ownerAddr,
        fees.machineValue,
        metadata,
        { value: fees.nativeDepositPerMint }
      );
      await waitForTx(machineIssuer, mintTx);
    }
  
    return { result: `Created ${count} Machine NFT${count > 1 ? 's' : ''} for user: ${ownerAddr}` };
  }
}