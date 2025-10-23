import type { NetworkAddresses } from '../types/core';
import type { IssueMachineNFT, IssueMachineNFTResult } from '../types/mnfts';

import { Fees } from "../config/fees";
import { getContract, waitForTx } from '../utils/txs';

import type { Signer, Provider } from 'ethers';
import { parseEther, getAddress } from 'ethers';

import { IMachineNFTs__factory, IERC20__factory } from '../typechain';
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


  // make sure machine NFT is funded!!
  public async issueMachineNFT(opts: IssueMachineNFT): Promise<IssueMachineNFTResult> {
    const { machineIssuer, machineOwner, machineNFT, metadata } = opts;
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
      const approveTx = await erc20.approve.populateTransaction(machineNFT, totalFeeErc20);
      await waitForTx(machineOwner, approveTx);
    }
  
    // 3) Mint loop (TODO batch in smart contract??)
    for (let i = 0; i < count; i++) {
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