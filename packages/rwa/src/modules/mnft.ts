import type { NetworkAddresses } from '../types/core';
import type { IMachineMetadata, IssueMachineNFT, IssueMachineNFTResult } from '../types/mnfts';

// utils
import { Fees } from "../config/fees";
import { getArgsFromTxEvent, parseOptions, validators } from '../utils/helpers';
import { DECIMALS } from '../enums/core';
import { waitForTx } from '../utils/txs';
import { setupDidDocument,  } from '../utils/did/functions';
import { machineId, serializeDidForNft } from '../utils/nft';
import { SDKError } from '../errors/errors';

import { Sdk } from '@peaq-network/sdk';

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



  // private async _createDIDDocument(machineOwner: Signer, machineNFT: string, project: string, metadataEndpoint: string, tokenId: string) {
	// 	// creates sdk instance for peaq-did construction
  //   const peaq_sdk = await Sdk.createInstance({
  //     baseUrl: "https://peaq-agung.api.onfinality.io/public", // hardcoding for now
  //     chainType: Sdk.ChainType.EVM
  //   });

  //   // 1. Assign the did subject address and controller
  //   const didAddress = machineNFT;
  //   const controller = await machineOwner.getAddress(); // machine owner or machine issuer??

  //   // 2. Create the did name as per our naming convention
  //   const rwaSubject = `${didAddress}.${tokenId}`;
  //   const name = `did:peaq:${project}:${rwaSubject}`;

  //   // 3. Construct the signature for the did address to prove machine owner has ownership on the machine nft
  //   const rwaSubjectSignature = await machineOwner.signMessage(rwaSubject);
  //   const signature = {
  //     type: Sdk.VerificationMethodType.ECDSA,
  //     issuer: controller,
  //     hash: rwaSubjectSignature
  //   };

  //   // 4. Attach the verification method to the did document
  //   const verification = [{
  //     type: Sdk.VerificationMethodType.ECDSA,
  //   }];

  //   // 5. Attach the metadata service endpoint to the did document with the appropriate data (token id)
  //   const service = [{
  //     id: `#metadata`,
  //     type: 'RWA Machine Metadata',
  //     serviceEndpoint: metadataEndpoint,
  //     data: tokenId
  //   }];


  //   // 6. Generate the serialized did document via protobuf with the sdk
  //   const result = await peaq_sdk.did.create({
  //     name: name,
  //     didAddress: didAddress,
  //     controller: controller,
  //     verificationMethods: verification,
  //     services: service,
  //     signature: signature,
  //     project: project,
  //     tokenId: tokenId
  //   });

  //   // 7. Send the transaction to the network using rwa tx algorithm
  //   if ('tx' in result && result.tx) {
  //     await waitForTx(machineOwner, result.tx);

  //     // Read the did document from the network
  //     const didDocument = await peaq_sdk.did.read({
  //       name: name,
  //       address: didAddress
  //     });
  //     console.log(didDocument)
  //     console.log(didDocument?.document);
  //   } else {
  //     throw new SDKError('DID/CREATE', 'Unexpected DID write result shape; expected unsigned EVM tx.');
  //   }
  // }
  /**
   * 
   * TODO: Update function name to registerMachine(), and then split up function into two:
   * - approveErc20()
   * - registerMachine()
   * - determine if count is necessary
   * - update function parameters 'feePerMint' to 'feePerRegistration'
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
    console.log(fee, account);

    // 2) Approve ERC20
    const ownerAddr = await machineOwner.getAddress();
    const erc20 = this._erc20(machineOwner, this.addresses.erc20.peaq);
    const startingBalance = await erc20.balanceOf(ownerAddr);
    const allowance = await erc20.allowance(ownerAddr, account);
    if (allowance < fee * BigInt(count)) {
      console.log("approving");
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
      // TODO check for result status 1?
    }
    const endingBalance = await erc20.balanceOf(ownerAddr);
    const change = startingBalance - endingBalance
    return { result: `Machine registration fees paid: ${ formatUnits(change.toString(), DECIMALS.PEAQ)} PEAQ` }; // or assigned rather than registered?
  }
}