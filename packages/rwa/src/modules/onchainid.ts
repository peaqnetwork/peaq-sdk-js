// abis
import IIdentityABI from '../abis/IIdentity.json';
import IIdFactoryABI from '../abis/IIdFactory.json';

// types
import type { NetworkAddresses } from '../types/core';
import type { CreateIdentity, CreateIdentityResult, IssueKycClaim, KycClaimResult } from '../types/onchainid';

// utils
import { getContract, waitForTx } from '../utils/txs';
import { parseOptions, validators } from '../utils/helpers';
import { CreateIdentityArgumentError } from '../errors/onchainid';
import { generateKycClaim, signClaim } from '../utils/claims';

// 3rd party tools
import { type Signer, ZeroAddress, getAddress } from 'ethers';


export class OnchainID {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  

  // returns back Identity contract stored in config
  private _identity(signer: Signer) {
    const addr = this.addresses.onchainid.identity;
    return getContract(addr, IIdentityABI, signer);
  }

  // returns back IdFactory contract stored in config
  private _idFactory(signer: Signer) {
    const addr = this.addresses.onchainid.idFactory;
    return getContract(addr, IIdFactoryABI, signer);
  }
  


  /**
   * Creates an ONCHAINID identity for a given EOA with authority from the ID Factory.
   * 
   * @type {CreateIdentity} - The parameter type options for creating an ONCHAINID identity
   * @returns {CreateIdentityResult} The result of creating an ONCHAINID identity
   */
  public async createIdentity(opts: CreateIdentity): Promise<CreateIdentityResult> {
    try {
      // validate and parse parameter type options for improved error messages
      const { admin, eoa, salt } = parseOptions<CreateIdentity>(opts, {
        admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
        eoa: { required: true, validator: validators.address, expected: 'EVM address string' },
        salt: { required: true, validator: validators.nonEmptyString, expected: 'non-empty string' },
      }, 'createIdentity');

      const idFactory = this._idFactory(admin);
      const existing = await idFactory.getIdentity(eoa);
      if (existing && existing !== ZeroAddress) {
        return { status: 'exists', identity: existing };
      }

      const tx = await idFactory.createIdentity.populateTransaction(eoa, salt);
      const receipt = await waitForTx(admin, tx);
      const identity = await idFactory.getIdentity(eoa);

      const identityContract = this._identity(admin);
      identityContract.attach(identity);

      return { status: 'created', identity: identity, receipt: receipt };
    } catch (err: any) {
      if (err && typeof err.message === 'string' && (err.message.startsWith('createIdentity:') || err.message.includes('missing required field'))) {
        throw new CreateIdentityArgumentError(err.message.replace('createIdentity: ', ''));
      }
      throw err;
    }
  }



  /**
  * Generates and signs a KYC claim containing name, last name, date of birth place of birth, along with
  * the URI of the KYC claim.
  * 
  * @type {IssueKycClaim} - The parameter type options for issuing a KYC claim
  * @returns {KycClaimResult} The result of issuing a KYC claim
  */
  public async issueKycClaim(opts: IssueKycClaim): Promise<KycClaimResult> {
    const { claimIssuer, issuerContract, identity, name, lastName, dateOfBirth, placeOfBirth, uri } = opts;
    const kyc = { identity, data: { name, lastName, dateOfBirth, placeOfBirth } };

    const claim = await generateKycClaim({issuerContract, kyc, uri });
    const signature = await signClaim({ claim, claimIssuer });

    return { claim, signature };
  }

}