import type { NetworkAddresses } from '../types/core';
import type { 
  CreateContract, 
  CreateContractResult, 
  GetDraft, 
  GetDraftResult, 
  GetContract, 
  GetContractResult, 
  SignContract, 
  SignContractResult, 
  CancelContract, 
  CancelContractResult, 
  SetBlocked, 
  SetBlockedResult, 
  IsBlocked, 
  IsBlockedResult, 
  IsContractIdAvailable, 
  IsContractIdAvailableResult
 } from '../types/cnft';

import type { Signer, Provider } from 'ethers';
import { getAddress, formatUnits } from 'ethers';
import { IContractNft__factory, IERC20__factory } from '../typechain';
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { SDKError } from '../errors/errors';
import { waitForTx } from '../utils/txs';


/**
 * ContractNfts module provides functionality for issuing Contract NFTs for the PEAQ network.
 * 
 * @class ContractNft
 * @param {NetworkAddresses} addresses - The network addresses for the ContractNFTs module
 * @param {Provider} provider - The provider for the ContractNFTs module
 */
export class ContractNft {
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
    const { contractController, erc20, tokenDecimals, counterparties, contractNft, contractHash, url } = parseOptions<CreateContract>(opts, {
        contractController: { required: true, validator: validators.signerWithProvider, expected: 'Signer' },
        erc20: { required: true, validator: validators.address, expected: 'EVM address string' },
        tokenDecimals: { required: true, validator: validators.number, expected: 'number' },
        counterparties: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        contractHash: { required: true, validator: validators.string, expected: 'string' },
        url: { required: true, validator: validators.string, expected: 'string' },
      }, 'createContract');

    const cnft = this._cnft(contractController, contractNft);

    const [fee, account] = await cnft.setupFeeAndAccount();

    // 2) Approve ERC20
    const ownerAddr = await contractController.getAddress();
    const erc20Contract = this._erc20(contractController, erc20);
    const startingBalance = await erc20Contract.balanceOf(ownerAddr);
    const allowance = await erc20Contract.allowance(ownerAddr, account);
    if (allowance < fee) {
        try {
            await erc20Contract.approve.staticCall(account, fee);
        } catch (cause: any) {
            throw new SDKError('SIMULATE/APPROVE_ERC20', 'ERC20 callStatic failed; approval would revert', { cause });
        }
        const approveTx = await erc20Contract.approve.populateTransaction(account, fee);
        await waitForTx(contractController, approveTx);
    }

    // 3) Initialize contract and sign by initiator
    try {
        await cnft.initContractAndSign.staticCall(counterparties, contractHash, url);
    } catch (cause: any) {
        console.log(cause)
        throw new SDKError('SIMULATE/INIT_CONTRACT', 'ContractNFTs callStatic failed; initialization would revert', { cause });
    }
    const initContractTx = await cnft.initContractAndSign.populateTransaction(counterparties, contractHash, url);
    const result = await waitForTx(contractController, initContractTx);

    // Get emitted event for contract ID
    const iface = IContractNft__factory.createInterface();
    const args = await getArgsFromTxEvent(result, 'ContractInitiated', iface);
    const contractId = args[0].toString();

    const endingBalance = await erc20Contract.balanceOf(ownerAddr);
    const tokenDelta = startingBalance - endingBalance;


    return { 
      status: 'created', 
      contractNft: contractNft, 
      contractId: contractId, 
      contractController: ownerAddr,
      counterparties: counterparties,
      content: { hash: contractHash, url: url },
      fee: { 
        token: erc20, 
        tokenDecimals: tokenDecimals, 
        setupAmount: fee,
        balanceBefore: startingBalance, 
        balanceAfter: endingBalance, 
        humanTokenDelta: formatUnits(tokenDelta.toString(), tokenDecimals) },
      receipt: result
    };
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
        status: 'completed',
        contractId: emittedContractId,
        counterpartySigner: signer,
        receipt: result
      };
    }

    if (signedArgs) {
      const emittedContractId = signedArgs?.[0]?.toString?.() ?? String(signedArgs?.[0] ?? contractId);
      const signer = signedArgs?.[1]?.toString?.() ?? 'unknown';

      // Pull draft to report signature progress.
      let progressSuffix = '';
        const draftAny: any = await cnft.getDraft(contractId);
        const content: any = draftAny?.[0];
        const signatures: any = draftAny?.[1];
        const counterparties: any = content?.[1];
        const total = (Array.isArray(counterparties) ? counterparties.length : 0) + 1; // +1 initiator
        const signedCount = Array.isArray(signatures) ? signatures.length : 0;
        if (total > 0) progressSuffix = ` (${signedCount}/${total} signatures collected)`;

      return {
        status: 'signed',
        contractId: emittedContractId,
        counterpartySigner: signer,
        receipt: result,
        progress: {
          collected: signedCount,
          total: total
        }
      };
    }

    // Fallback: tx mined, but ABI parsing didn't find expected events (or contract changed).
    return {
      status: 'mined_unknown',
      contractId: contractId,
      counterpartySigner: 'unknown',
      receipt: result
    };
  }


  /**
   * 
   * Cancels a Contract NFT.
   * 
   * @param {CancelContract} opts - The options for cancelling a Contract NFT
   * @returns {CancelContractResult} The result of cancelling a Contract NFT
   */
  public async cancelContract(opts: CancelContract): Promise<CancelContractResult> {
    const { contractController, contractNft, contractId } = parseOptions<CancelContract>(opts, {
      contractController: { required: true, validator: validators.signerWithProvider, expected: 'Signer' },
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        contractId: { required: true, validator: validators.string, expected: 'string' },
      }, 'cancelContract');
    const cnft = this._cnft(contractController, contractNft);
    const controllerAddr = await contractController.getAddress();

    try {
      await cnft.cancelContract.staticCall(contractId);
    } catch (cause: any) {
      console.log(cause);
      throw new SDKError('SIMULATE/CANCEL_CONTRACT', 'ContractNFTs callStatic failed; cancellation would revert', { cause });
    }

    const cancelContractTx = await cnft.cancelContract.populateTransaction(contractId);
    const result = await waitForTx(contractController, cancelContractTx);

    const iface = IContractNft__factory.createInterface();
    const args = await getArgsFromTxEvent(result, 'ContractCancelled', iface);
    const contractCancelledId = args[0].toString();

    return { 
      status: 'cancelled',
      contractNft: contractNft,
      contractId: contractCancelledId,
      cancelledBy: controllerAddr,
      receipt: result };
  }

  /**
   * 
   * Sets a Contract NFT to blocked.
   * 
   * @param {SetBlocked} opts - The options for setting a Contract NFT to blocked
   * @returns {SetBlockedResult} The result of setting a Contract NFT to blocked
   */
  public async setBlocked(opts: SetBlocked): Promise<SetBlockedResult> {
    const { contractNftSigner, contractNft, blocked } = parseOptions<SetBlocked>(opts, {
      contractNftSigner: { required: true, validator: validators.signerWithProvider, expected: 'Signer' },
      contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
      blocked: { required: true, validator: validators.boolean, expected: 'boolean' },
    }, 'setBlocked');

    const cnft = this._cnft(contractNftSigner, contractNft);
    const signerAddr = await contractNftSigner.getAddress();
    try {
      await cnft.setBlocked.staticCall(blocked);
    } catch (cause: any) {
      console.log(cause);
      throw new SDKError('SIMULATE/SET_BLOCKED', 'ContractNFTs callStatic failed; setting blocked would revert', { cause });
    }

    const setBlockedTx = await cnft.setBlocked.populateTransaction(blocked);
    const result = await waitForTx(contractNftSigner, setBlockedTx);

    return { 
      status: 'set',
      contractNft: contractNft,
      blocked: blocked,
      setBy: signerAddr,
      receipt: result };
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

  /**
   * 
   * Checks if a Contract NFT is blocked.
   * 
   * @param {IsBlocked} opts - The options for checking if a Contract NFT is blocked
   * @returns {IsBlockedResult} The result of checking if a Contract NFT is blocked
   */
  public async isBlocked(opts: IsBlocked): Promise<IsBlockedResult> {
    const { contractNft } = parseOptions<IsBlocked>(opts, {
      contractNft: { required: true, validator: validators.address, expected: 'EVM address string' }
    }, 'isBlocked');
    const cnft = this._cnft(this.provider, contractNft);
    const blocked = await cnft.isBlocked();
    return { blocked };
  }

  /**
   * 
   * Checks if a Contract ID is available.
   * 
   * @param {IsContractIdAvailable} opts - The options for checking if a Contract ID is available
   * @returns {IsContractIdAvailableResult} The result of checking if a Contract ID is available
   */
  public async isContractIdAvailable(opts: IsContractIdAvailable): Promise<IsContractIdAvailableResult> {
    const { contractNft, contractId } = parseOptions<IsContractIdAvailable>(opts, {
      contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
      contractId: { required: true, validator: validators.string, expected: 'string' },
    }, 'isContractIdAvailable');
    const cnft = this._cnft(this.provider, contractNft);
    const available = await cnft.isContractIdAvailable(contractId);
    return { available };
  }

}