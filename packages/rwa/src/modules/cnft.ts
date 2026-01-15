import type { NetworkAddresses } from '../types/core';
import type { CreateContract, CreateContractResult } from '../types/cnft';

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
    const { contractInitiator, counterparties, contractNft, content, hashDigest, url } = parseOptions<CreateContract>(opts, {
        contractInitiator: { required: true, validator: validators.signerWithProvider, expected: 'Signer' },
        counterparties: { required: true, validator: validators.arrayOf(validators.address), expected: 'array of EVM address strings' },
        contractNft: { required: true, validator: validators.address, expected: 'EVM address string' },
        content: { required: true, validator: validators.string, expected: 'string' },
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
    const initContractTx = await cnft.initContractAndSign(counterparties, hashDigest, url);
    const result = await waitForTx(contractInitiator, initContractTx);

    // Get emitted event for contract ID
    const iface = IContractNft__factory.createInterface();
    const args = await getArgsFromTxEvent(result, 'ContractInitiated', iface);
    const contractId = args[0].toString();
    const emittedContractInitiator = args[1].toString();

    const endingBalance = await erc20.balanceOf(ownerAddr);
    const tokenDelta = startingBalance - endingBalance;


    return { result: `Contract setup fees paid: ${ formatUnits(tokenDelta.toString(), DECIMALS.PEAQ)} PEAQ. Contract ID is ${contractId}` };
  }


// TODO:
// signContract()
// cancelContract()
// getContract()
// getDraft()
// setBlocked()
// isBlocked()
// isContractIdAvailable()

}