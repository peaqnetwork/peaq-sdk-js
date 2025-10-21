// abis
import IIdentityABI from '../abis/IIdentity.json';
import IIdFactoryABI from '../abis/IIdFactory.json';
import IERC20ABI from '../abis/IERC20.json';
// types
import type { NetworkAddresses } from '../types/core';
import type { CreateIdentity, CreateIdentityResult, GetIdentity, GetIdentityResult, IssueKycClaim, KycClaimResult, AddClaimToIdentity, AddClaimToIdentityResult } from '../types/onchainid';

// utils
import { getContract, waitForTx } from '../utils/txs';
import { parseOptions, validators } from '../utils/helpers';
import { CreateIdentityArgumentError } from '../errors/onchainid';
import { generateKycClaim, signClaim } from '../utils/claims';
import { Fees } from '../config/fees';

// 3rd party tools
import { type Signer, type Provider, ZeroAddress } from 'ethers';


export class OnchainID {
  private addresses: NetworkAddresses;
  private provider: Provider;
  constructor(addresses: NetworkAddresses, provider: Provider) {
    this.addresses = addresses;
    this.provider = provider;
  }
  

  // returns back Identity contract stored in config or at a given address
  private _identity(runner: Signer | Provider, address?: string) {
    const addr = address ?? this.addresses.onchainid.identity;
    return getContract(addr, IIdentityABI, runner);
  }

  // returns back IdFactory contract stored in config or at a given address
  private _idFactory(runner: Signer | Provider, address?: string) {
    const addr = address ?? this.addresses.onchainid.idFactory;
    return getContract(addr, IIdFactoryABI, runner);
  }

  private _erc20(runner: Signer | Provider, address: string) {
    const addr = address;
    return getContract(addr, IERC20ABI, runner);
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

      /// TODO - try to increase??
      // 
      // give tiny amount of native token as existential deposit to get rid of cannot coalase error
      const erc20 = this._erc20(admin, this.addresses.erc20.peaq); // not sure what erc to connect to, I use our native erc20 for now
      const tx2 = await erc20.transfer.populateTransaction(eoa, Fees.ExistentialDeposit);
      const receipt2 = await waitForTx(admin, tx2);

      return { status: 'created', identity: identity, receipt: receipt };
    } catch (err: any) {
      if (err && typeof err.message === 'string' && (err.message.startsWith('createIdentity:') || err.message.includes('missing required field'))) {
        throw new CreateIdentityArgumentError(err.message.replace('createIdentity: ', ''));
      }
      throw err;
    }
  }

  /**
  * 
  * TODO
  * 
  */
  public async getIdentity(opts: GetIdentity): Promise<GetIdentityResult> {
      // validate and parse parameter type options for improved error messages
    const { eoa } = parseOptions<GetIdentity>(opts, {
      eoa: { required: true, validator: validators.address, expected: 'EVM address string' }
    }, 'getIdentity');

    const idFactory = this._idFactory(this.provider);
    const existing = await idFactory.getIdentity(eoa);
    if (existing && existing !== ZeroAddress) {  
      return { status: 'found', identity: existing };
    }
    return { status: 'not_found', identity: '' };
  }


  /**
  * Generates and signs a KYC claim containing name, last name, date of birth place of birth, along with
  * the URI of the KYC claim.
  * 
  * @type {IssueKycClaim} - The parameter type options for issuing a KYC claim
  * @returns {KycClaimResult} The result of issuing a KYC claim
  */
  public async issueKycClaim(opts: IssueKycClaim): Promise<KycClaimResult> {
    // validate and parse parameter type options for improved error messages
    const { claimIssuer, issuerContract, identity, name, lastName, dateOfBirth, placeOfBirth, uri } = opts;
    const kyc = { identity, data: { name, lastName, dateOfBirth, placeOfBirth } };

    const claim = await generateKycClaim({issuerContract, kyc, uri });
    const signature = await signClaim({ claim, claimIssuer });

    return { claim, signature };
  }

  /**
  * Adds a signed claim to an ONCHAINID identity by calling the identity contract's addClaim.
  * 
  * @type {AddClaimToIdentity} - The parameter type options for adding a claim to an ONCHAINID identity
  * @returns {AddClaimToIdentityResult} The result of adding a claim to an ONCHAINID identity
  */
  public async addClaimToIdentity(opts: AddClaimToIdentity): Promise<AddClaimToIdentityResult> {
    const { identity, claim, kycSignature, identityOwner } = parseOptions<AddClaimToIdentity>(opts, {
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      claim: { required: true },
      kycSignature: { required: true, validator: validators.hexString, expected: '0x-prefixed hex string' },
      identityOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
    }, 'addClaimToIdentity');

    const identityContract = this._identity(identityOwner, identity);

    const tx = await identityContract.addClaim.populateTransaction(
      claim.topic,
      claim.scheme,
      claim.issuer,
      kycSignature,
      claim.data,
      claim.uri
    );
    const receipt = await waitForTx(identityOwner, tx);
    return { receipt };
  }
}