import { BuiltEvmTransactionResult, BuiltCallTransactionResult } from '../types/common';
import { SubstrateSendResult, EvmSendResult } from '../types/base';

export enum DIDVersion {
    V2_1_0 = '2.1.0',
    V3_0_0 = '3.0.0'
}

// V2.1.0 specific interfaces
export interface DIDV2Document {
    id: string;
    controller: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    service: Service[];
    signature?: Signature;
}

// V3.0.0 specific interfaces
export interface DIDV3Document {
    id: string;
    controller: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    assertionMethod: string[];
    keyAgreement: string[];
    capabilityInvocation: string[];
    capabilityDelegation: string[];
    service: Service[];
    signature?: Signature;
    version: DIDVersion.V3_0_0;
}

export interface DIDDocumentBase {
    name: string;
    value: string;
    validity: string;
    created: string;
    document: DIDV2Document | DIDV3Document;
}

export type DIDDocument = DIDDocumentBase;

export enum FunctionSignatures {
    ADD_ATTRIBUTE = 'addAttribute(address,bytes,bytes,uint32)',
    READ_ATTRIBUTE = 'readAttribute(address,bytes)',
    UPDATE_ATTRIBUTE = 'updateAttribute(address,bytes,bytes,uint32)',
    REMOVE_ATTRIBUTE = 'removeAttribute(address,bytes)'
  }

// create a v3 to accept the blockchainAccountId
export interface VerificationMethod {
    id?: string;
    type: string;
    controller?: string;
    publicKeyMultibase?: string;
    // blockchainAccountId?: string;
}

export interface Service {
    id: string;
    type: string;
    serviceEndpoint?: string;
    data?: string;
}

export interface Signature {
    type: string;
    issuer: string;
    hash: string;
}

export interface CreateDIDOptions {
    name: string;
    controller?: string;
    didAddress?: string; // Address to use for DID ID generation (did:peaq:${didAddress})
    verificationMethods?: VerificationMethod[];
    services?: Service[];
    signature?: Signature;
}

export interface UpdateDIDOptions {
    name: string;
    controller?: string;
    didAddress?: string; // Address to use for DID ID generation (did:peaq:${didAddress})
    verificationMethods?: VerificationMethod[];
    services?: Service[];
    signature?: Signature;
}

export interface RemoveDIDOptions {
    name: string;
    address?: string;
}

export interface ReadDIDOptions {
    name: string;
    address?: string;
}

export interface ReadDIDResult {
    service: any;
    name: string;
    value: string;
    validity: string;
    created: string;
    document: DIDV2Document | DIDV3Document;
}

export type DidWriteResult = SubstrateSendResult | EvmSendResult | BuiltEvmTransactionResult | BuiltCallTransactionResult;