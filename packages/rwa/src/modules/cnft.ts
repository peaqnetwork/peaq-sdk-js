import type { NetworkAddresses } from '../types/core';
import type { CreateContract, CreateContractResult, GetDraft, GetDraftResult, GetContract, GetContractResult, SignContract, SignContractResult } from '../types/cnft';

import type { Signer, Provider } from 'ethers';
import { getAddress, formatUnits } from 'ethers';
import { DECIMALS } from '../enums/core';
import { IContractNft__factory, IERC20__factory } from '../typechain';
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { SDKError } from '../errors/errors';
import { waitForTx } from '../utils/txs';


/**
 * ContractNFTs module provides functionality for issuing Contract NFTs for the PEAQ network.
 * 
 * @class ContractNFT
 * @param {NetworkAddresses} addresses - The network addresses for the ContractNFTs module
 * @param {Provider} provider - The provider for the ContractNFTs module
 */
export class ContractNFT {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider
  ) {}

  private _cnft(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IContractNft__factory.connect(addr, runner);
  }

  private _erc20(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IERC20__factory.connect(addr, runner);
  }

  /**
   * 
   * Creates a Contract NFT.
   * 
   * @param {CreateContract} opts - The options for creating a Contract NFT
   * @returns {CreateContractResult} The result of creating a Contract NFT
   */
  public async createContract(opts: CreateContract): Promise<CreateContractResult> {
    const { contractInitiator, counterparties, contractNft, hashDigest, url } = parseOptions<CreateContract>(opts, {
        contractInitiator: { required: true, validator: validators.signerWithProvider, expected: 'Signer' },
        counterparties: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        hashDigest: { required: true, validator: validators.string, expected: 'string' },
        url: { required: true, validator: validators.string, expected: 'string' },
      }, 'createContract');

    const cnft = this._cnft(contractInitiator, contractNft);

    const [fee, account] = await cnft.setupFeeAndAccount();

    // 2) Approve ERC20
    const ownerAddr = await contractInitiator.getAddress();
    const erc20 = this._erc20(contractInitiator, this.addresses.erc20.peaq);
    const startingBalance = await erc20.balanceOf(ownerAddr);
    const allowance = await erc20.allowance(ownerAddr, account);
    if (allowance < fee) {
        try {
            await erc20.approve.staticCall(account, fee);
        } catch (cause: any) {
            throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
        }
        const approveTx = await erc20.approve.populateTransaction(account, fee);
        await waitForTx(contractInitiator, approveTx);
    }

    // 3) Initialize contract and sign by initiator
    try {
        await cnft.initContractAndSign.staticCall(counterparties, hashDigest, url);
    } catch (cause: any) {
        console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
        throw new SDKError('SIMULATE/INIT_CONTRACT', 'ContractNFTs callStatic failed; initialization would revert', { cause });
    }
    const initContractTx = await cnft.initContractAndSign.populateTransaction(counterparties, hashDigest, url);
    const result = await waitForTx(contractInitiator, initContractTx);

    // Get emitted event for contract ID
    const iface = IContractNft__factory.createInterface();
    const args = await getArgsFromTxEvent(result, 'ContractInitiated', iface);
    const contractId = args[0].toString();
    const emittedContractInitiator = args[1].toString();

    const endingBalance = await erc20.balanceOf(ownerAddr);
    const tokenDelta = startingBalance - endingBalance;


    return { message: `Contract setup fees paid: ${ formatUnits(tokenDelta.toString(), DECIMALS.PEAQ)} PEAQ`, contractId: contractId };
  }

  /**
   * 
   * Signs a Contract NFT.
   * 
   * @param {SignContract} opts - The options for signing a Contract NFT
   * @returns {SignContractResult} The result of signing a Contract NFT
   */
  public async signContract(opts: SignContract): Promise<SignContractResult> {
    const { counterpartySigner, contractNft, contractId } = parseOptions<SignContract>(opts, {
        counterpartySigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer' },
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        contractId: { required: true, validator: validators.string, expected: 'string' },
      }, 'signContract');
    const cnft = this._cnft(counterpartySigner, contractNft);

    try {
      await cnft.signContract.staticCall(contractId);
    } catch (cause: any) {
      console.log(cause) // TODO: Improve error handling in the SDKError class; for now just log the cause
      throw new SDKError('SIMULATE/SIGN_CONTRACT', 'ContractNFTs callStatic failed; signing would revert', { cause });
    }

    const signContractTx = await cnft.signContract.populateTransaction(contractId);
    const result = await waitForTx(counterpartySigner, signContractTx);

    // Based on emitted events, return the appropriate message
    const iface = IContractNft__factory.createInterface();
    let completedArgs: any = null;
    let signedArgs: any = null;
    try {
      completedArgs = await getArgsFromTxEvent(result, 'ContractCompleted', iface);
    } catch {}
    try {
      signedArgs = await getArgsFromTxEvent(result, 'ContractSigned', iface);
    } catch {}

    if (completedArgs) {
      const emittedContractId = completedArgs?.[0]?.toString?.() ?? String(completedArgs?.[0] ?? contractId);
      const signer = completedArgs?.[1]?.toString?.() ?? 'unknown';
      return {
        message: `Contract ${emittedContractId} completed; signed by ${signer}. Draft removed and NFT minted to initiator.`,
      };
    }

    if (signedArgs) {
      const emittedContractId = signedArgs?.[0]?.toString?.() ?? String(signedArgs?.[0] ?? contractId);
      const signer = signedArgs?.[1]?.toString?.() ?? 'unknown';

      // Pull draft to report signature progress.
      let progressSuffix = '';
      try {
        const draftAny: any = await cnft.getDraft(contractId);
        const content: any = draftAny?.[0];
        const signatures: any = draftAny?.[1];
        const counterparties: any = content?.[1];
        const total = (Array.isArray(counterparties) ? counterparties.length : 0) + 1; // +1 initiator
        const signedCount = Array.isArray(signatures) ? signatures.length : 0;
        if (total > 0) progressSuffix = ` (${signedCount}/${total} signatures collected)`;
      } catch {}

      return {
        message: `Contract ${emittedContractId} signed by ${signer}${progressSuffix}.`,
      };
    }

    // Fallback: tx mined, but ABI parsing didn't find expected events (or contract changed).
    return {
      message: `Contract signature transaction mined (tx: ${result.hash}), but no ContractSigned/ContractCompleted event was found in logs.`,
    };
  }


  /**
   * 
   * Gets a Draft of a Contract NFT.
   * 
   * @param {GetDraft} opts - The options for creating a Contract NFT draft
   * @returns {GetDraftResult} The result of getting a Contract NFT draft by contract ID 
   */
  public async getDraft(opts: GetDraft): Promise<GetDraftResult> {
    const { contractNft, contractId } = parseOptions<GetDraft>(opts, {
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        contractId: { required: true, validator: validators.string, expected: 'string' },
      }, 'getDraft');
    const cnft = this._cnft(this.provider, contractNft);
    const draft = await cnft.getDraft(contractId);
    return { draft: draft };
  }

  /**
   * 
   * Gets a Contract NFT.
   * 
   * @param {GetContract} opts - The options for creating a Contract NFT
   * @returns {GetContractResult} The result of creating a Contract NFT
   */
  public async getContract(opts: GetContract): Promise<GetContractResult> {
    const { contractNft, contractId } = parseOptions<GetContract>(opts, {
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        contractId: { required: true, validator: validators.string, expected: 'string' },
      }, 'getContract');
    const cnft = this._cnft(this.provider, contractNft);
    const contract = await cnft.getContract(contractId);
    return { contract };
  }


// TODO:
// cancelContract()
// setBlocked()
// isBlocked()
// isContractIdAvailable()

}