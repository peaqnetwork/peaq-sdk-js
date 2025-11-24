import type { NetworkAddresses } from '../types/core';
import type { IMachineMetadata, IssueMachineNFT, IssueMachineNFTResult } from '../types/mnfts';

// utils
import { Fees } from "../config/fees";
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { waitForTx } from '../utils/txs';
import { SDKError } from '../errors/errors';

import { Sdk } from '@peaq-network/sdk';

import type { Signer, Provider } from 'ethers';
import { parseEther, getAddress } from 'ethers';
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



  private async _createDIDDocument(machineOwner: Signer, machineNFT: string, project: string, metadataEndpoint: string, tokenId: string) {
		// creates sdk instance for peaq-did construction
    const peaq_sdk = await Sdk.createInstance({
      baseUrl: "https://peaq-agung.api.onfinality.io/public", // hardcoding for now
      chainType: Sdk.ChainType.EVM
    });

    // 1. Assign the did subject address and controller
    const didAddress = machineNFT;
    const controller = await machineOwner.getAddress(); // machine owner or machine issuer??

    // 2. Create the did name as per our naming convention
    const rwaSubject = `${didAddress}.${tokenId}`;
    const name = `did:peaq:${project}:${rwaSubject}`;

    // 3. Construct the signature for the did address to prove machine owner has ownership on the machine nft
    const rwaSubjectSignature = await machineOwner.signMessage(rwaSubject);
    const signature = {
      type: Sdk.VerificationMethodType.ECDSA,
      issuer: controller,
      hash: rwaSubjectSignature
    };

    // 4. Attach the verification method to the did document
    const verification = [{
      type: Sdk.VerificationMethodType.ECDSA,
    }];

    // 5. Attach the metadata service endpoint to the did document with the appropriate data (token id)
    const service = [{
      id: `#metadata`,
      type: 'RWA Machine Metadata',
      serviceEndpoint: metadataEndpoint,
      data: tokenId
    }];


    // 6. Generate the serialized did document via protobuf with the sdk
    const result = await peaq_sdk.did.create({
      name: name,
      didAddress: didAddress,
      controller: controller,
      verificationMethods: verification,
      services: service,
      signature: signature,
      project: project,
      tokenId: tokenId
    });

    // 7. Send the transaction to the network using rwa tx algorithm
    if ('tx' in result && result.tx) {
      await waitForTx(machineOwner, result.tx);

      // Read the did document from the network
      const didDocument = await peaq_sdk.did.read({
        name: name,
        address: didAddress
      });
      console.log(didDocument)
      console.log(didDocument?.document);
    } else {
      throw new SDKError('DID/CREATE', 'Unexpected DID write result shape; expected unsigned EVM tx.');
    }
  }
  /**
   * Issues a Machine NFT to a designated owner. Make sure the Machine NFT contract is funded.
   * 
   * @param {IssueMachineNFT} opts - The options for issuing a Machine NFT
   * @returns {IssueMachineNFTResult} The result of issuing a Machine NFT
   */
  public async issueMachineNFT(opts: IssueMachineNFT): Promise<IssueMachineNFTResult> {
    // validate and parse parameter type options for improved error messages for user
    const { machineIssuer, machineOwner, machineNFT, project, metadataEndpoint, metadata } = parseOptions<IssueMachineNFT>(opts, {
      machineIssuer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      machineNFT: { required: true, validator: validators.address, expected: 'EVM address string' },
      project: { required: true, validator: validators.string, expected: 'string' },
      metadataEndpoint: { required: true, validator: validators.string, expected: 'string' },
      metadata: { required: true, validator: validators.partialObject({
        brand: validators.string,
        model: validators.string,
        serialNumber: validators.string,
        uri: validators.string,
        timestamp: validators.string,
      }), expected: 'object' },
      count: { required: false, validator: validators.number, expected: 'number' },
      fees: { required: false, validator: validators.partialObject({
        feePerMint: validators.numberOrBigint,
        machineValue: validators.numberOrBigint,
        nativeDepositPerMint: validators.numberOrBigint,
      }), expected: 'object' },
    }, 'issueMachineNFT');

    const count = opts.count ?? 1;    
    const mnft = this._mnft(machineIssuer, machineNFT);

   

    // TODO 
    // - see if we can get the value of the machine nfts from the contract
    // - native deposit per mint is based on DID fees

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
        await mnft.registerMachine.staticCall(ownerAddr, fees.machineValue, metadata, { value: fees.nativeDepositPerMint });
      } catch (cause: any) {
        throw new SDKError('SIMULATE/ISSUE_MNFT', 'MachineNFTs callStatic failed; issuance would revert', { cause });
      }
      const mintTx = await mnft.registerMachine.populateTransaction(
        ownerAddr,
        fees.machineValue,
        metadata,
        { value: fees.nativeDepositPerMint }
      );
      const result = await waitForTx(machineIssuer, mintTx);
      console.log(result)

      const iface = IMachineNft__factory.createInterface();
      const args = await getArgsFromTxEvent(result, 'MetadataUpdate', iface);
      const tokenId = args[0].toString();

      // request a serviceEndpoint to link in the service field that shows the machine nft metadata (stored off chain)
      await this._createDIDDocument(machineOwner, machineNFT, project, metadataEndpoint, tokenId);
    }
  
    return { result: `Created ${count} Machine NFT${count > 1 ? 's' : ''} for user: ${ownerAddr}` };
  }
}