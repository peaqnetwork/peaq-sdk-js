import type { NetworkAddresses } from '../types/core';
import type { 
  EnsureMachineNftAllowance,
  EnsureMachineNftAllowanceResult,
  RegisterMachine,
  RegisterMachineResult,
  GetMachineDid,
  GetMachineDidResult 
} from '../types/mnft';

// utils
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { waitForTx } from '../utils/txs';
import { setupDidDocument,  } from '../utils/did/functions';
import { deserializeDidFromNft, machineId, serializeDidForNft } from '../utils/nft';
import { SDKError } from '../errors/errors';

import type { Signer, Provider } from 'ethers';
import { getAddress, parseUnits, formatUnits } from 'ethers';
import { IMachineNft__factory, IERC20__factory, type IMachineNft } from '../typechain';


/**
 * MachineNFTs module provides functionality for issuing Machine NFTs for the PEAQ network.
 * 
 * @class MachineNft
 * @param {NetworkAddresses} addresses - The network addresses for the MachineNFTs module
 * @param {Provider} provider - The provider for the MachineNFTs module
 */
export class MachineNft {
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
   * Ensure the ERC20 allowance for the MachineNft registration account is sufficient to cover the registration fee for N machines of a given value.
   * 
   * @param {EnsureMachineNftAllowance} opts - The options for ensuring a Machine NFT allowance
   * @returns {EnsureMachineNftAllowanceResult} The result of ensuring a Machine NFT allowance
   */
  public async ensureMachineNftAllowance(opts: EnsureMachineNftAllowance): Promise<EnsureMachineNftAllowanceResult> {
    const { machineController, machineNft, machineValueHuman, erc20, tokenDecimals, machineCount } = parseOptions<EnsureMachineNftAllowance>(opts, {
      machineController: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineNft: { required: true, validator: validators.address, expected: 'EVM address string' },
      machineValueHuman: { required: true, validator: validators.string, expected: 'bigint' },
      erc20: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenDecimals: { required: true, validator: validators.number, expected: 'number' },
      machineCount: { required: false, validator: validators.number, expected: 'number' },
    }, 'ensureMachineNftAllowance');

    const mnft = this._mnft(this.provider, machineNft);
    const [fee, account] = await this._getRegistrationFeeAndAccount(mnft, machineValueHuman, tokenDecimals);

    // 2) Approve ERC20
    const ownerAddr = await machineController.getAddress();
    const erc20Contract = this._erc20(machineController, erc20);
    const allowance = await erc20Contract.allowance(ownerAddr, account);
    if (allowance < fee * BigInt(machineCount)) {
      // preflight check
      try {
        await erc20Contract.approve.staticCall(account, fee * BigInt(machineCount));
      } catch (cause: any) {
        throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
      }
      const approveTx = await erc20Contract.approve.populateTransaction(account, fee * BigInt(machineCount));
      const receipt = await waitForTx(machineController, approveTx);
      const postTxAllowance = await erc20Contract.allowance(ownerAddr, account);

      return { status: 'approved', machineNft: machineNft, feeToken: erc20, feePerMachine: fee, requiredAllowance: fee * BigInt(machineCount), currentAllowance: postTxAllowance, receipt: receipt };

    }
    return { status: 'already_sufficient', machineNft: machineNft, feeToken: erc20, feePerMachine: fee, requiredAllowance: fee * BigInt(machineCount), currentAllowance: allowance };

  }

  /**
   * 
   * Issues a MachineNft to a designated owner. Make sure the MachineNft contract is funded.
   * 
   * @param {RegisterMachine} opts - The options for registering a MachineNft
   * @returns {RegisterMachineResult} The result of registering a MachineNft
   */
  public async registerMachine(opts: RegisterMachine): Promise<RegisterMachineResult> {
    const { machineIssuer, machineNft, machineValueHuman, machineControllerAddr, erc20, tokenDecimals, salt, count } = parseOptions<RegisterMachine>(opts, {
      machineIssuer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineNft: { required: true, validator: validators.address, expected: 'EVM address string' },
      machineValueHuman: { required: true, validator: validators.string, expected: 'bigint' },
      machineControllerAddr: { required: true, validator: validators.address, expected: 'EVM address string' },
      erc20: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenDecimals: { required: true, validator: validators.number, expected: 'number' },
      salt: { required: true, validator: validators.number, expected: 'number' },
      count: { required: false, validator: validators.number, expected: 'number' },
    }, 'registerMachine');

    // 0) Get MachineNft contract and machine value in units
    const mnft = this._mnft(machineIssuer, machineNft);
    const machineValueInUnits = parseUnits(machineValueHuman, tokenDecimals);

    // 1) Get starting balance of machine owner ERC20
    const erc20Contract = this._erc20(this.provider, erc20);
    const startingBalance = await erc20Contract.balanceOf(machineControllerAddr);
  
    // 2) Mint loop
    let machines;
    let didX;
    let machineIdX;
    let serializedDidX;
    const base = salt * count;
    const machineIssuerAddress = await machineIssuer.getAddress();
    for (let i = 0; i < count; i++) {
      // create DID document
      didX = await setupDidDocument(machineIssuerAddress, machineNft, base + i);
      machineIdX = machineId(didX);
      serializedDidX = serializeDidForNft(didX);

      // preflight check
      try {
        await mnft.registerMachine.staticCall(machineControllerAddr, machineValueInUnits, machineIdX, serializedDidX);
      } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
        throw new SDKError('SIMULATE/ISSUE_MNFT', 'MachineNFTs callStatic failed; issuance would revert', { cause });
      }
      // submit transaction to register machine
      const registerMachineTx = await mnft.registerMachine.populateTransaction(
        machineControllerAddr,
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
      // add to machines array
      machines = [...(machines || []), { machineId: emittedTokenId!, did: didX!.toString(), receipt: result! }];
      // machines = machines.push({ tokenId: emittedTokenId!, machineId: machineIdX, did: didX!, receipt: result! });
      // console.log(`Registered Machine ${i + 1} of ${count}:`, {
      //   machineNft: machineNft,
      //   machineIssuer: emittedMachineIssuer,
      //   machineOwner: emittedMachineOwner,
      //   tokenId: emittedTokenId,
      // });
    }
    
    const endingBalance = await erc20Contract.balanceOf(machineControllerAddr);
    const tokenDelta = startingBalance - endingBalance
    return { 
      status: 'issued', 
      machineNft: machineNft, 
      machineIssuer: machineIssuerAddress, 
      machineController: machineControllerAddr, 
      machineValue: { human: machineValueHuman, units: machineValueInUnits, tokenDecimals: tokenDecimals, feeToken: erc20 }, 
      count: count, 
      machines: machines || [],
      feesPaid: tokenDelta, 
      startingBalance: startingBalance, 
      endingBalance: endingBalance,
      humanTokenDelta: formatUnits(tokenDelta.toString(), tokenDecimals)
    };
  }


  /**
   * 
   * Reads a DID document from a Machine NFT.
   * 
   * @param {GetMachineDid} opts - The options for getting a Machine DID
   * @returns {GetMachineDidResult} The result of getting a Machine DID
   */
  public async getMachineDid(opts: GetMachineDid): Promise<GetMachineDidResult> {
    const { machineNft, tokenId } = parseOptions<GetMachineDid>(opts, {
      machineNft: { required: true, validator: validators.address, expected: 'EVM address string' },
      tokenId: { required: true, validator: validators.string, expected: 'number or bigint' },
    }, 'readDidDocument');
    const mnft = this._mnft(this.provider, machineNft);
    const didDocument = await mnft.getMachineDid(BigInt(tokenId));
    const deserializedDidDocument = deserializeDidFromNft(didDocument).toObject();
    return { didDocument: deserializedDidDocument };
  }

  private async _getRegistrationFeeAndAccount(mnft: IMachineNft, machineValue: string, decimals: number): Promise<[bigint, string]> {
    const machineValueInUnits = parseUnits(machineValue, decimals);
    const [fee, account] = await mnft.registrationFeeAndAccount(machineValueInUnits);
    return [fee, account];
  }

}