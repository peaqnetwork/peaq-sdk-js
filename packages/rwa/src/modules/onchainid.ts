// types
import type { NetworkAddresses } from '../types/core';
import type {
  CreateIdentity, CreateIdentityResult,
  GetIdentity, GetIdentityResult,
  IssueKycClaim, KycClaimResult,
  AddClaimToIdentity, AddClaimToIdentityResult,
  GetClaim, GetClaimResult,
  RemoveClaimFromIdentity, RemoveClaimFromIdentityResult
} from '../types/onchainid';


// utils
import { waitForTx } from '../utils/txs';
import { parseOptions, validators } from '../utils/helpers';
import { generateKycClaim, signClaim } from '../utils/claims';

// errors
import { SDKError } from '../errors/errors';

// ethers & typechain
import { getAddress, ZeroAddress, type Provider, type Signer } from 'ethers';
import {
  IIdentity__factory,
  IIdFactory__factory
} from '../typechain';


/**
 * OnchainID module provides functionality for creating, getting, and issuing KYC claims for ONCHAINID identities.
 * 
 * @class OnchainID
 * @param {NetworkAddresses} addresses - The network addresses for the ONCHAINID module
 * @param {Provider} provider - The provider for the ONCHAINID module
 */
export class OnChainID {
  constructor(
    private readonly addresses: NetworkAddresses,
    private readonly provider: Provider
  ) {}

  private _identity(runner: Signer | Provider, address: string) {
    const addr = getAddress(address);
    return IIdentity__factory.connect(addr, runner);
  }

  private _idFactory(runner: Signer | Provider, address?: string) {
    const addr = getAddress(address ?? this.addresses.onchainid.idFactory);
    return IIdFactory__factory.connect(addr, runner);
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

    const idFactory = this._idFactory(admin);

    // check if the identity already exists
    const existing = await idFactory.getIdentity(eoa);
    if (existing && existing !== ZeroAddress) {
      return { status: 'exists', identity: existing };
    }

    // preflight check
    try {
      await idFactory.createIdentity.staticCall(eoa, salt);
    } catch (cause: any) {
      throw new SDKError('SIMULATE/CREATE_IDENTITY', 'Factory callStatic failed; creation would revert', { cause });
    }

    // if it doesn't revert, send the transaction
    const tx = await idFactory.createIdentity.populateTransaction(eoa, salt);
    const receipt = await waitForTx(admin, tx);
    const identity = await idFactory.getIdentity(eoa);

    return { status: 'created', identity: identity, receipt: receipt };
  }


  /**
  * Returns the ONCHAINID identity for a given EOA.
  * 
  * @type {GetIdentity} - The parameter type options for getting an ONCHAINID identity
  * @returns {GetIdentityResult} The result of getting an ONCHAINID identity
  */
  public async getIdentity(opts: GetIdentity): Promise<GetIdentityResult> {
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
      const claimId = await identityContract.addClaim.staticCall(claim.topic, claim.scheme, claim.issuer, kycSignature, claim.data, claim.uri); 
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
    return { receipt: receipt };
  }

  /**
  * Gets a claim from an ONCHAINID identity by calling the identity contract's getClaim by claimId.
  * 
  * @type {GetClaim} - The parameter type options for getting a claim from an ONCHAINID identity
  * @returns {GetClaimResult} The result of getting a claim from an ONCHAINID identity
  */
  public async getClaim(opts: GetClaim): Promise<GetClaimResult> {
    // TODO how to validate the claim?
    const { identity, claimId } = parseOptions<GetClaim>(opts, {
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      claimId: { required: true, validator: validators.string, expected: 'string' },  
    }, 'getClaim');

    const identityContract = this._identity(this.provider, identity);

    const claim = await identityContract.getClaim(
      claimId
    );
    return { claim: { topic: Number(claim[0]), scheme: Number(claim[1]), issuer: claim[2], signature: claim[3], data: claim[4], uri: claim[5] } };
    }

  /**
  * Removes a signed claim from an ONCHAINID identity by calling the identity contract's removeClaim.
  * 
  * @type {RemoveClaimFromIdentity} - The parameter type options for removing a claim from an ONCHAINID identity
  * @returns {RemoveClaimFromIdentityResult} The result of removing a claim from an ONCHAINID identity
  */
  public async removeClaimFromIdentity(opts: RemoveClaimFromIdentity): Promise<RemoveClaimFromIdentityResult> {
    // TODO how to validate the claim?
    const { identity, identityOwner, claimId } = parseOptions<RemoveClaimFromIdentity>(opts, {
      identity: { required: true, validator: validators.address, expected: 'EVM address string' },
      identityOwner: { required: true, validator: validators.signerWithProvider, expected: 'Signer connected to provider' },
      claimId: { required: true, validator: validators.string, expected: 'string' },
    }, 'removeClaimFromIdentity');

    const identityContract = this._identity(identityOwner, identity);

    // preflight check
    try {
      await identityContract.removeClaim.staticCall(claimId); 
    } catch (cause: any) {
      throw new SDKError('SIMULATE/REMOVE_CLAIM', 'Identity callStatic failed; removal would revert', { cause });
    }

    const tx = await identityContract.removeClaim.populateTransaction(
      claimId
    );
    const receipt = await waitForTx(identityOwner, tx);
    return { receipt: receipt, result: `Successfully removed claim for Identity ${identity}` };
  }
  
}

