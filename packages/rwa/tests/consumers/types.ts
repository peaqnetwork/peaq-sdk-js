// tests/consumers/types.ts

// Import ONLY from the built package root to mirror real consumers.
import type {
    SDKInit,
    NetworkAddresses,
    Person,
    KYC,
    CreateIdentity,
    CreateIdentityResult,
    GetIdentity,
    GetIdentityResult,
    IssueKycClaim,
    IssueKycClaimResult,
    AddClaimToIdentity,
    AddClaimToIdentityResult,
  } from '../../dist';

  import type { Signer, TransactionReceipt } from 'ethers';
  
  /* --------------------------------- helpers -------------------------------- */
  
  type Expect<T extends true> = T;
  
  // IsExact<A,B> — strict structural equality (both directions)
  type IsExact<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2)
      ? ((<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2) ? true : false)
      : false;
  
  // HasKeys<T, K> — all K keys exist in T
  type HasKeys<T, K extends PropertyKey> =
    Exclude<K, keyof T> extends never ? true : false;
  
  // IsUnion<T> — utility if you want to assert unions (not used, but handy)
  // type IsUnion<T, U = T> = (T extends any ? (U extends T ? false : true) : never) extends true ? true : false;
  
  /* ---------------------------------- core ---------------------------------- */
  
  // SDKInit must include chainId:number and provider:something
  type _SDKInit_shape = Expect<HasKeys<SDKInit, 'chainId' | 'provider'>>;
  
  // NetworkAddresses should at least expose top-level sections you rely on.
  // We don’t assert inner shapes here to keep the test stable across networks.
  type _NetworkAddresses_top =
    Expect<HasKeys<NetworkAddresses, 'onchainid' | 'trex' | 'nft' | 'vault' | 'erc20'>>;
  
  /* ------------------------------- onchainid.ts ------------------------------ */
  
  // Person exact shape
  type _Person_exact = Expect<
    IsExact<
      Person,
      {
        name: string;
        lastName: string;
        dateOfBirth: string;
        placeOfBirth: string;
      }
    >
  >;
  
  // KYC exact shape (with nested Person)
  type _KYC_exact = Expect<
    IsExact<
      KYC,
      {
        identity: string;
        data: Person;
      }
    >
  >;
  
  // CreateIdentity input exact keys (SDK uses idFactoryAdmin, subject, deploymentSalt)
  type _CreateIdentity_exact = Expect<
    IsExact<
      CreateIdentity,
      {
        idFactoryAdmin: Signer;
        subject: string;
        deploymentSalt: string;
      }
    >
  >;
  
  // CreateIdentityResult exact shape
  type _CreateIdentityResult_exact = Expect<
    IsExact<
      CreateIdentityResult,
      {
        status: 'created' | 'exists';
        identity: string;
        receipt?: TransactionReceipt;
      }
    >
  >;
  
  // GetIdentity exact shape (SDK uses subject)
  type _GetIdentity_exact = Expect<
    IsExact<
      GetIdentity,
      { subject: string }
    >
  >;
  
  // GetIdentityResult exact shape (identity is optional in SDK)
  type _GetIdentityResult_exact = Expect<
    IsExact<
      GetIdentityResult,
      {
        status: 'found' | 'not_found';
        identity?: string;
      }
    >
  >;
  
  // IssueKycClaim exact keys (SDK uses claimIssuerSigner, claimIssuerContract, subjectIdentity, etc.)
  type _IssueKycClaim_has_keys = Expect<
    HasKeys<
      IssueKycClaim,
      | 'claimIssuerSigner'
      | 'claimIssuerContract'
      | 'subjectIdentity'
      | 'name'
      | 'lastName'
      | 'dateOfBirth'
      | 'placeOfBirth'
      | 'uri'
    >
  >;
  type _IssueKycClaim_uri = Expect<IsExact<IssueKycClaim['uri'], string | null>>;
  
  // IssueKycClaimResult exact keys (exported as IssueKycClaimResult, not KycClaimResult)
  type _IssueKycClaimResult_has_keys = Expect<HasKeys<IssueKycClaimResult, 'claim' | 'signature'>>;
  
  // AddClaimToIdentity exact keys (SDK uses identityController, subjectIdentity, claim, claimSignature)
  type _AddClaimToIdentity_has_keys = Expect<
    HasKeys<
      AddClaimToIdentity,
      'identityController' | 'subjectIdentity' | 'claim' | 'claimSignature'
    >
  >;
  
  // AddClaimToIdentityResult exact keys
  type _AddClaimToIdentityResult_has_keys = Expect<
    HasKeys<AddClaimToIdentityResult, 'receipt'>
  >;
  
  /* ------------------------------- module marker ---------------------------- */
  
  // Export a value so the file is treated as a module (tsc quirk)
  export const okTypes: true = true;
  