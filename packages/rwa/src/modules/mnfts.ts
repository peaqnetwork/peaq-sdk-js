import IMachineNFTsABI from '../abis/IMachineNFTs.json';
import IERC20ABI from '../abis/IERC20.json';

import type { NetworkAddresses } from '../types/core';
import type { IssueMachineNFT, IssueMachineNFTResult } from '../types/mnfts';

import { Fees } from "../config/fees";

import { getContract, waitForTx } from '../utils/txs';

import type { Signer, Provider } from 'ethers';

export class MachineNFTs {
  private addresses: NetworkAddresses;
  private provider: Provider;
  constructor(addresses: NetworkAddresses, provider: Provider) {
    this.addresses = addresses;
    this.provider = provider;
  }

  // returns back Identity contract stored in config or at a given address
  private _machineNFTs(runner: Signer | Provider, address?: string) {
    const addr = address ?? this.addresses.mnfts.machineNft;
    return getContract(addr, IMachineNFTsABI, runner);
  }

    // returns back Identity contract stored in config or at a given address
    private _erc20(runner: Signer | Provider, address: string) {
      const addr = address;
      return getContract(addr, IERC20ABI, runner);
    }


  public async issueMachineNFT(opts: IssueMachineNFT): Promise<IssueMachineNFTResult> {
    const { machineIssuer, alice, metadata } = opts;
    const aliceAddress = await alice.getAddress();

    const erc20 = this._erc20(alice, this.addresses.erc20.peaq); // not sure what erc to connect to, I use our native erc20 for now
    const tx = await erc20.approve.populateTransaction(this.addresses.mnfts.machineNft, Fees.FeePerMint);
    const receipt = await waitForTx(alice, tx);

    const mnfts = this._machineNFTs(machineIssuer);
    

    // issue 3 machine NFTs (make sure machune NFT is funded!!)
    const tx2= await mnfts.registerMachine.populateTransaction(aliceAddress, Fees.MachineValue, metadata,
      { value: Fees.NativeDepositPerMint }
    );
    await waitForTx(machineIssuer, tx2);
    const tx3 = await mnfts.registerMachine.populateTransaction(aliceAddress, Fees.MachineValue, metadata,
      { value: Fees.NativeDepositPerMint }
    );
    await waitForTx(machineIssuer, tx3);
    const tx4 = await mnfts.registerMachine.populateTransaction(aliceAddress, Fees.MachineValue, metadata,
      { value: Fees.NativeDepositPerMint }
    );
    await waitForTx(machineIssuer, tx4);

    // Verify refundable accrual and perform withdrawals
    const issuerAddr = await machineIssuer.getAddress();
    const accrued = await mnfts.refundableNative(issuerAddr);
    // send a refund if there is any
    if (accrued > 0) {
      const tx5 = await mnfts.withdrawRefund.populateTransaction();
      const receipt2 = await waitForTx(machineIssuer, tx5);
    }
    return { test1: "test1"};
  }
}
