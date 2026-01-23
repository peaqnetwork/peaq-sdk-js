import type { NetworkAddresses } from '../types/core';
import type { IMachineMetadata, IssueMachineNFT, IssueMachineNFTResult, GetMachineDid, GetMachineDidResult } from '../types/mnfts';

// utils
import { Fees } from "../config/fees";
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { DECIMALS } from '../enums/core';
import { waitForTx } from '../utils/txs';
import { setupDidDocument,  } from '../utils/did/functions';
import { deserializeDidFromNft, machineId, serializeDidForNft } from '../utils/nft';
import { SDKError } from '../errors/errors';

import type { Signer, Provider } from 'ethers';
import { getAddress, parseUnits, formatUnits } from 'ethers';
import { IMachineNft__factory, IERC20__factory } from '../typechain';


/**
 * MachineNFTs module provides functionality for issuing Machine NFTs for the PEAQ network.
 * 
 * @class MachineNFT
 * @param {NetworkAddresses} addresses - The network addresses for the MachineNFTs module
 * @param {Provider} provider - The provider for the MachineNFTs module
 */
export class MachineNFT {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider
  ) {}

  private _mnft(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IMachineNft__factory.connect(addr, runner);
  }

  private _erc20(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IERC20__factory.connect(addr, runner);
  }

  /**
   * 
   * Issues a Machine NFT to a designated owner. Make sure the Machine NFT contract is funded.
   * 
   * @param {IssueMachineNFT} opts - The options for issuing a Machine NFT
   * @returns {IssueMachineNFTResult} The result of issuing a Machine NFT
   */
  public async issueMachineNFT(opts: IssueMachineNFT): Promise<IssueMachineNFTResult> {

    // New variable to be added called Machine Value (aka the value of machine in native PEAQ TOKEN (auto converted from human readable value))

    // validate and parse parameter type options for improved error messages for user
    const { machineValue, machineIssuer, machineOwner, machineNFT, runSeed } = parseOptions<IssueMachineNFT>(opts, {
      machineValue: { required: true, validator: validators.numberOrBigint, expected: 'bigint' },
      machineIssuer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineNFT: { required: true, validator: validators.address, expected: 'EVM address string' },
      runSeed: { required: true, validator: validators.numberOrBigint, expected: 'number or bigint' },
      count: { required: false, validator: validators.number, expected: 'number' },
    }, 'issueMachineNFT');

    // 0) Initialize common variables
    const count = opts.count ?? 1;
    const mnft = this._mnft(machineIssuer, machineNFT);
    const machineValueInUnits = parseUnits(machineValue.toString(), DECIMALS.PEAQ);

    // 1) Get registration fee and MachineNft account
    const [fee, account] = await mnft.registrationFeeAndAccount(machineValueInUnits);

    // 2) Approve ERC20
    const ownerAddr = await machineOwner.getAddress();
    const erc20 = this._erc20(machineOwner, this.addresses.erc20.peaq); // TODO: DO NOT HARDCODE THE PEAQ TOKEN ADDRESS
    const startingBalance = await erc20.balanceOf(ownerAddr);
    const allowance = await erc20.allowance(ownerAddr, account);
    if (allowance < fee * BigInt(count)) {
      // preflight check
      try {
        await erc20.approve.staticCall(account, fee * BigInt(count));
      } catch (cause: any) {
        throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
      }
      const approveTx = await erc20.approve.populateTransaction(account, fee * BigInt(count));
      await waitForTx(machineOwner, approveTx);
    }
  
    // 3) Mint loop
    let didX;
    let machineIdX;
    let serializedDidX;
    const base = runSeed * count;
    const machineIssuerAddress = await machineIssuer.getAddress();
    for (let i = 0; i < count; i++) {
      // create DID document
      didX = await setupDidDocument(machineIssuerAddress, machineNFT, base + i);
      machineIdX = machineId(didX);
      serializedDidX = serializeDidForNft(didX);

      // preflight check
      try {
        await mnft.registerMachine.staticCall(ownerAddr, machineValueInUnits, machineIdX, serializedDidX);
      } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
        throw new SDKError('SIMULATE/ISSUE_MNFT', 'MachineNFTs callStatic failed; issuance would revert', { cause });
      }
      // submit transaction to register machine
      const registerMachineTx = await mnft.registerMachine.populateTransaction(
        ownerAddr,
        machineValueInUnits,
        machineIdX,
        serializedDidX
      );
      const result = await waitForTx(machineIssuer, registerMachineTx);
      const iface = IMachineNft__factory.createInterface();
      const args = await getArgsFromTxEvent(result, 'MachineAdded', iface);
      const emittedMachineIssuer = args[0].toString();
      const emittedMachineOwner = args[1].toString();
      const emittedTokenId = args[2].toString();

      // What is the best way to log to user of SDK?
      console.log(`Registered Machine ${i + 1} of ${count}:`, {
        machineNFT: machineNFT,
        machineIssuer: emittedMachineIssuer,
        machineOwner: emittedMachineOwner,
        tokenId: emittedTokenId,
      });
    }
    const endingBalance = await erc20.balanceOf(ownerAddr);
    const tokenDelta = startingBalance - endingBalance
    return { result: `Machine registration fees paid: ${ formatUnits(tokenDelta.toString(), DECIMALS.PEAQ)} PEAQ` };
  }


  /**
   * 
   * Reads a DID document from a Machine NFT.
   * 
   * @param {GetMachineDid} opts - The options for getting a Machine DID
   * @returns {GetMachineDidResult} The result of getting a Machine DID
   */
  public async getMachineDid(opts: GetMachineDid): Promise<GetMachineDidResult> {
    const { machineNFT, tokenId } = parseOptions<GetMachineDid>(opts, {
      machineNFT: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenId: { required: true, validator: validators.string, expected: 'number or bigint' },
    }, 'readDidDocument');
    const mnft = this._mnft(this.provider, machineNFT);
    const didDocument = await mnft.getMachineDid(BigInt(tokenId));
    const deserializedDidDocument = deserializeDidFromNft(didDocument).toObject();
    return { didDocument: deserializedDidDocument };
  }

}