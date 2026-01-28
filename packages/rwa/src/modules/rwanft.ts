import type { NetworkAddresses } from '../types/core';
import type { 
  GetMachineRegulatorsResult,
  AddMachineIssuer,
  AddMachineIssuerResult,
  GetMachineIssuersResult,
  RemoveMachineIssuer,
  RemoveMachineIssuerResult,
  SetMachineNftBlockState,
  SetMachineNftBlockStateResult,
  FindContractNft,
  FindContractNftResult,
 } from '../types/rwanft';

import type { Signer, Provider } from 'ethers';
import { getAddress, formatUnits } from 'ethers';
import { IPeaqRwaNft__factory } from '../typechain';
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { SDKError } from '../errors/errors';
import { waitForTx } from '../utils/txs';


/**
 * PeaqRwaNft module provides functionality for issuing new Machine Regulators and Machine Issuers.
 * 
 * @class PeaqRwaNft
 * @param {NetworkAddresses} addresses - The network addresses for the PeaqRwaNft module
 * @param {Provider} provider - The provider for the PeaqRwaNft module
 */
export class PeaqRwaNft {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider
  ) {}

  private _peaqRwaNft(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IPeaqRwaNft__factory.connect(addr, runner);
  }

  /** 
   * Gets the machine regulators for a given PeaqRwaNft contract.
   * 
   * @type {GetMachineRegulators} - The parameter type options for getting the machine regulators
   * @returns {GetMachineRegulatorsResult} The result of getting the machine regulators
   */
  public async getMachineRegulators(): Promise<GetMachineRegulatorsResult> {
    const peaqRwaNftContract = this._peaqRwaNft(this.provider, this.addresses.nft.peaqRwaNft);
    const machineRegulators = await peaqRwaNftContract.getMachineRegulators();
    return { machineRegulators: machineRegulators };
  }

  /**
   * Adds a machine issuer to the PeaqRwaNft contract.
   * 
   * @type {AddMachineIssuer} - The parameter type options for adding a machine issuer
   * @returns {AddMachineIssuerResult} The result of adding a machine issuer
   */
  public async addMachineIssuer(opts: AddMachineIssuer): Promise<AddMachineIssuerResult> {
    const { machineRegulatorSigner, newMachineIssuer } = parseOptions<AddMachineIssuer>(opts, {
      machineRegulatorSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      newMachineIssuer: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'addMachineIssuer');

    const peaqRwaNftContract = this._peaqRwaNft(machineRegulatorSigner, this.addresses.nft.peaqRwaNft);

    // preflight check
    try {
      await peaqRwaNftContract.addMachineIssuer.staticCall(newMachineIssuer);
    } catch (cause: any) {
      console.log(cause);
      throw new SDKError('SIMULATE/ADD_MACHINE_ISSUER', 'PeaqRwaNft callStatic failed; addition would revert', { cause });
    }

    const tx = await peaqRwaNftContract.addMachineIssuer.populateTransaction(newMachineIssuer);  
    const result = await waitForTx(machineRegulatorSigner, tx);

    const iface = IPeaqRwaNft__factory.createInterface();
    const args = await getArgsFromTxEvent(result, 'MachineIssuerAdded', iface);
    const machineIssuer = args[0].toString();
    const machineNft = args[1].toString();

    return { result: `Machine issuer at address ${machineIssuer} added to the PeaqRwaNft contract with machine NFT at address ${machineNft}` };
  }

  /**
   * Removes a machine issuer from the PeaqRwaNft contract.
   * 
   * @type {RemoveMachineIssuer} - The parameter type options for removing a machine issuer
   * @returns {RemoveMachineIssuerResult} The result of removing a machine issuer
   */
  public async removeMachineIssuer(opts: RemoveMachineIssuer): Promise<RemoveMachineIssuerResult> {
    const { machineRegulatorSigner, machineIssuer } = parseOptions<RemoveMachineIssuer>(opts, {
      machineRegulatorSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineIssuer: { required: true, validator: validators.address, expected: 'EVM address string' },
    }, 'removeMachineIssuer');

    const peaqRwaNftContract = this._peaqRwaNft(machineRegulatorSigner, this.addresses.nft.peaqRwaNft);

    // preflight check
    try {
      await peaqRwaNftContract.removeMachineIssuer.staticCall(machineIssuer);
    } catch (cause: any) {
      console.log(cause);
      throw new SDKError('SIMULATE/REMOVE_MACHINE_ISSUER', 'PeaqRwaNft callStatic failed; removal would revert', { cause });
    }

    const tx = await peaqRwaNftContract.removeMachineIssuer.populateTransaction(machineIssuer);
    await waitForTx(machineRegulatorSigner, tx);
    return { result: `Machine issuer at address ${machineIssuer} removed` };
  }

  /**
   * Gets the machine issuers for a given PeaqRwaNft contract.
   * 
   * @type {GetMachineIssuers} - The parameter type options for getting the machine issuers
   * @returns {GetMachineIssuersResult} The result of getting the machine issuers
   */
  public async getMachineIssuers(): Promise<GetMachineIssuersResult> {
    const peaqRwaNftContract = this._peaqRwaNft(this.provider, this.addresses.nft.peaqRwaNft);
    const machineIssuers = await peaqRwaNftContract.getMachineIssuers();
    return { machineIssuers: machineIssuers };
  }

  /**
   * Sets the block state of a machine issuer or contract NFT.
   * 
   * @type {SetMachineNftBlockState} - The parameter type options for setting the block state of a machine issuer or contract NFT
   * @returns {SetMachineNftBlockStateResult} The result of setting the block state of a machine issuer or contract NFT
   */
  public async setMachineNftBlockState(opts: SetMachineNftBlockState): Promise<SetMachineNftBlockStateResult> {
    const { machineRegulatorSigner, issuerOrContractNft, blocked } = parseOptions<SetMachineNftBlockState>(opts, {
      machineRegulatorSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      issuerOrContractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
      blocked: { required: true, validator: validators.boolean, expected: 'boolean' },
    }, 'setMachineNftBlockState');

    const peaqRwaNftContract = this._peaqRwaNft(machineRegulatorSigner, this.addresses.nft.peaqRwaNft);

    // preflight check
    try {
      await peaqRwaNftContract.setMachineNftBlockState.staticCall(issuerOrContractNft, blocked);
    } catch (cause: any) {
      console.log(cause);
      throw new SDKError('SIMULATE/SET_MACHINE_NFT_BLOCK_STATE', 'PeaqRwaNft callStatic failed; setting block state would revert', { cause });
    }

    const tx = await peaqRwaNftContract.setMachineNftBlockState.populateTransaction(issuerOrContractNft, blocked);
    await waitForTx(machineRegulatorSigner, tx);
    return { result: `Machine issuer or contract NFT at address ${issuerOrContractNft} set blocked to ${blocked}` };
  }

  /**
   * Finds a contract NFT by contract ID.
   * 
   * @type {FindContractNft} - The parameter type options for finding a contract NFT by contract ID
   * @returns {FindContractNftResult} The result of finding a contract NFT by contract ID
   */
  public async findContractNft(opts: FindContractNft): Promise<FindContractNftResult> {
    const { contractId } = parseOptions<FindContractNft>(opts, {
      contractId: { required: true, validator: validators.string, expected: 'string' },
    }, 'findContractNft');
    const peaqRwaNftContract = this._peaqRwaNft(this.provider, this.addresses.nft.peaqRwaNft);
    const contractNft = await peaqRwaNftContract.findContractNft(BigInt(contractId));
    return { contractNft: contractNft };
  }
}