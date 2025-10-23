// types
import type { NetworkAddresses } from '../types/core';
import type {
  CreateIdentity, CreateIdentityResult,
  GetIdentity, GetIdentityResult,
  IssueKycClaim, KycClaimResult,
  AddClaimToIdentity, AddClaimToIdentityResult
} from '../types/onchainid';


// utils
import { waitForTx } from '../utils/txs';
import { parseOptions, validators } from '../utils/helpers';
import { generateKycClaim, signClaim } from '../utils/claims';

// errors
import { SDKError } from '../errors/onchainid';

// ethers & typechain
import { getAddress, ZeroAddress, type Provider, type Signer } from 'ethers';
import {
  IIdentity__factory,
  IIdFactory__factory,
  IERC20__factory,
} from '../typechain';


export class OnchainID {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider
  ) {}

  private _identity(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.onchainid.identity);
    return IIdentity__factory.connect(addr, runner);
  }

  private _idFactory(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.onchainid.idFactory);
    return IIdFactory__factory.connect(addr, runner);
  }

  private _erc20(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IERC20__factory.connect(addr, runner);
  }


  /**
   * Creates an ONCHAINID identity for a given EOA with authority from the ID Factory.
   * 
   * @type {CreateIdentity} - The parameter type options for creating an ONCHAINID identity
   * @returns {CreateIdentityResult} The result of creating an ONCHAINID identity
   */
  public async createIdentity(opts: CreateIdentity): Promise<CreateIdentityResult> {
    // validate and parse parameter type options for improved error messages for user
    const { admin, eoa, salt } = parseOptions<CreateIdentity>(opts, {
      admin: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      eoa: { required: true, validator: validators.address, expected: 'EVM address string' },
      salt: { required: true, validator: validators.nonEmptyString, expected: 'non-empty string' },
    }, 'createIdentity');

    const eoaChecksum = getAddress(eoa);
    const idFactory = this._idFactory(admin);

    // check if the identity already exists
    const existing = await idFactory.getIdentity(eoaChecksum);
    if (existing && existing !== ZeroAddress) {
      return { status: 'exists', identity: existing };
    }

    // preflight check
    try {
      await idFactory.createIdentity.staticCall(eoaChecksum, salt);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/CREATE_IDENTITY', 'Factory callStatic failed; creation would revert', { cause });
    }

    // if it doesn't revert, send the transaction
    const tx = await idFactory.createIdentity.populateTransaction(eoaChecksum, salt);
    const receipt = await waitForTx(admin, tx);
    const identity = await idFactory.getIdentity(eoaChecksum);


      return { status: 'created', identity: identity, receipt: receipt };
    }


  /**
  * Returns the ONCHAINID identity for a given EOA.
  * 
  * @type {GetIdentity} - The parameter type options for getting an ONCHAINID identity
  * @returns {GetIdentityResult} The result of getting an ONCHAINID identity
  */
  public async getIdentity(opts: GetIdentity): Promise<GetIdentityResult> {
    // validate and parse parameter type options for improved error messages
    const { eoa } = parseOptions<GetIdentity>(opts, {
      eoa: { required: true, validator: validators.address, expected: 'EVM address string' }
    }, 'getIdentity');

    const eoaChecksum = getAddress(eoa);
    const idFactory = this._idFactory(this.provider);

    const existing = await idFactory.getIdentity(eoaChecksum);
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
    const { claimIssuer, issuerContract, identity, name, lastName, dateOfBirth, placeOfBirth, uri } = parseOptions<IssueKycClaim>(opts, {
      claimIssuer: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      issuerContract: { required: true, validator: validators.address, expected: 'EVM address string' },
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      name: { required: true, validator: validators.string, expected: 'string' },
      lastName: { required: true, validator: validators.string, expected: 'string' },
      dateOfBirth: { required: true, validator: validators.string, expected: 'string' },
      placeOfBirth: { required: true, validator: validators.string, expected: 'string' },
      uri: { required: false, validator: validators.string, expected: 'string' },
    }, 'issueKycClaim');
    // const { claimIssuer, issuerContract, identity, name, lastName, dateOfBirth, placeOfBirth, uri } = opts;
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
    // TODO how to validate the claim?
    const { identity, identityOwner, claim, kycSignature } = parseOptions<AddClaimToIdentity>(opts, {
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      claim: { required: true },
      kycSignature: { required: true, validator: validators.hexString, expected: '0x-prefixed hex string' },
      identityOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
    }, 'addClaimToIdentity');

    const identityContract = this._identity(identityOwner, identity);

    // preflight check
    try {
      await identityContract.addClaim.staticCall(claim.topic, claim.scheme, claim.issuer, kycSignature, claim.data, claim.uri); 
    } catch (cause: any) {
      throw new SDKError('SIMULATE/ADD_CLAIM', 'Identity callStatic failed; addition would revert', { cause });
    }

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