import * as peaqDidProto from 'peaq-did-proto-js';
import { ApiPromise, HttpProvider } from '@polkadot/api';
import { JsonRpcProvider, ethers } from 'ethers';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { evmToAddress } from '@polkadot/util-crypto';

import { Base } from '../base';
import { ChainType, SDKMetadata, EvmTransaction, PrecompileAddresses, BuiltCallTransactionResult, BuiltEvmTransactionResult, txOptions, VerificationMethodType } from '../../types/common';
import { SubstrateSendResult, EvmSendResult, TransactionStatusCallback } from '../../types/base';
import { createStorageKeys, CreateStorageKeysEnum, generateEvmPublicKeyMultibase, generateEd25519PublicKeyMultibase, generateSr25519PublicKeyMultibase } from '../crypto/';
import {
  DIDV2Document,
  FunctionSignatures,
  VerificationMethod,
  Service,
  CreateDIDOptions,
  UpdateDIDOptions,
  RemoveDIDOptions,
  ReadDIDOptions,
  ReadDIDResult,
  Signature,
  DIDDocument,
  DidWriteResult
} from '../../types/did';

// -----------------------------------------------------------
// Internal enums mirroring the precompile selectors
// -----------------------------------------------------------


// -----------------------------------------------------------
// Main V2 Implementation
// -----------------------------------------------------------
export class DIDV2Implementation extends Base {
  private abiCoder = new ethers.AbiCoder();

  constructor(api: ApiPromise | JsonRpcProvider, metadata: SDKMetadata) {
    super(api, metadata);
  }

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  public async create(options: CreateDIDOptions,
    statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
    txOptions?: txOptions
  ): Promise<DidWriteResult> {
    const { name, controller, verificationMethods = [], services = [], signature } = options;

    // Get the connected wallet/keypair address
    const connectedAddress = (this.metadata.pair as any)?.address;
    if (!connectedAddress) {
      throw new Error('No wallet/keypair connected. Please either provide a controller or connect a wallet/keypair.');
    }

    // Use provided controller or default to connected address
    const effectiveController = controller || [connectedAddress];

    // Build DID Document (protobuf) -> hex string
    const didDocumentHex = await this._generateDidDocument(effectiveController[0], {
      controller: effectiveController,
      verificationMethods,
      services,
      signature
    });

    if (this.metadata.chainType === ChainType.EVM) {
      return this._createEvm(name, effectiveController[0], didDocumentHex, statusCallback, txOptions);
    }
    // TODO: MACTH: Don't default to substrate, just offer as another option. If not other options his, then default to an error saying chain type is not supported.
    return this._createSubstrate(name, effectiveController[0], didDocumentHex, statusCallback);
  }

  // ---------------------------------------------------------
  // READ (get)
  // ---------------------------------------------------------
  public async read(options: ReadDIDOptions): Promise<ReadDIDResult | null> {
    const { name, address } = options;
    
    // switch statement to determine chain type. If not supported throw an error
    if (this.metadata.chainType === ChainType.EVM) {
      const evmAddress = address || (this.metadata.pair as any)?.address;
      if (!evmAddress) {
        throw new Error('Address is required. Please either set seed at instance creation or pass an address.');
      }
      
      // Convert EVM address to Substrate address format
      const ownerAddress = evmToAddress(evmAddress);
      
      // Create temporary Substrate API connection
      const provider = new HttpProvider(this.metadata.baseUrl);
      const tempApi = await ApiPromise.create({ provider: provider });
      
      try {
        const result = await this._readFromSubstrate(name, ownerAddress, tempApi);
        if (result?.document) {
          return {
            name: result.document.name,
            value: result.document.value,
            validity: result.document.validity,
            created: result.document.created,
            document: result.document.document
          } as ReadDIDResult;
        }
        return null;
      } finally {
        // Clean up temporary connection
        await tempApi.disconnect();
      }
    }
    
    // For Substrate chains, use direct API access
    const api = this.api as ApiPromise;
    const ownerAddress = address || (this.metadata.pair as any)?.address;
    if (!ownerAddress) throw new Error('Signer/address required');
    
    const result = await this._readFromSubstrate(name, ownerAddress, api);
    if (result?.document) {
      return {
        name: result.document.name,
        value: result.document.value,
        validity: result.document.validity,
        created: result.document.created,
        document: result.document.document
      } as ReadDIDResult;
    }
    return null;
  }

  // ---------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------
  public async update(options: UpdateDIDOptions,
    statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
    txOptions?: txOptions
  ): Promise<DidWriteResult> {
    const { name, controller, verificationMethods, services, signature } = options;

    const primaryController = controller?.[0] ?? ((this.metadata.pair as any)?.address ?? '');
    const didDocumentHex = await this._generateDidDocument(primaryController, {
      controller: controller ?? [],
      verificationMethods: verificationMethods || [],
      services: services || [],
      signature
    });

    if (this.metadata.chainType === ChainType.EVM) {
      return this._updateEvm(name, primaryController, didDocumentHex, statusCallback, txOptions);
    }
    return this._updateSubstrate(name, primaryController, didDocumentHex, statusCallback);
  }

  // ---------------------------------------------------------
  // REMOVE / deactivate
  // ---------------------------------------------------------
  public async remove(options: RemoveDIDOptions,
    statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>,
    txOptions?: txOptions
  ): Promise<DidWriteResult> {
    const { name, address } = options;

    if (this.metadata.chainType === ChainType.EVM) {
      return this._removeEvm(name, (this.metadata.pair as any)?.address || address, statusCallback, txOptions);
    }
    return this._removeSubstrate(name, (this.metadata.pair as any)?.address || address, statusCallback);
  }

  // ---------------------------------------------------------
  // -------------------  INTERNAL HELPERS  ------------------
  // ---------------------------------------------------------
  private async _readFromSubstrate(name: string, ownerAddress: string, api: ApiPromise): Promise<{ name?: string; rawValue?: string; validity?: string; created?: string; document: DIDDocument } | null> {
    const { hashed_key } = createStorageKeys([
      { value: ownerAddress, type: CreateStorageKeysEnum.ADDRESS },
      { value: name, type: CreateStorageKeysEnum.STANDARD }
    ]);

    const raw = await api.query['peaqDid']['attributeStore'](hashed_key);
    if (!raw || (raw as any).isStorageFallback) return null;
    
    const human = (raw as any).toHuman?.() || {};
    const valueHex = (human.value ?? human['value']) as string;
    if (!valueHex) return null;
    
    const protoDoc = peaqDidProto.Document.deserializeBinary(hexToU8a(valueHex));
    const didV2Document = this._protoToV2(protoDoc);
    
    // Create the full DIDDocument structure (which is now DIDDocumentBase)
    const didDocument: DIDDocument = {
      name,
      value: valueHex,
      validity: human.validity?.toString() || '',
      created: human.created?.toString() || '',
      document: didV2Document
    };
    
    return {
      name,
      rawValue: valueHex,
      validity: human.validity?.toString() || '',
      created: human.created?.toString() || '',
      document: didDocument
    };
  }

  private async _generateDidDocument(address: string, extra: { controller: string[]; verificationMethods: VerificationMethod[]; services: Service[]; signature?: Signature }): Promise<string> {
    // Create new Doc and set id & controller
    const doc = new peaqDidProto.Document();
    doc.setId(`did:peaq:${address}`);
    doc.setController(`did:peaq:${address}`);

    // Add verification methods

    // TODO update multibase calc logic, and make mulitbase for eth just the address
    for (const [idx, vm] of extra.verificationMethods.entries()) {
      const method = new peaqDidProto.VerificationMethod();
      method.setId(vm.id || `did:peaq:${address}#keys-${idx + 1}`);
      method.setType(vm.type);
      method.setController(vm.controller || `did:peaq:${address}`);

      // user can manually set the multibase if they would like
      if (vm.publicKeyMultibase) method.setPublicKeyMultibase(vm.publicKeyMultibase);
      else {
        method.setPublicKeyMultibase(this._generateMultibase(address, vm.type));
      }
      if (this.api instanceof JsonRpcProvider && this.metadata.chainType === ChainType.EVM) {
        const chainId = await this.getChainId();
        method.setPublicKeyMultibase(`eip155:${chainId}:${address}`);
        // method.setBlockchainAccountId(`eip155:${chainId}:${address}`);
      }

      // TODO add assertionMethod, keyAgreement, capabilityInvocation, capabilityDelegation in v3
      doc.addVerificationMethods(method);
      doc.addAuthentications(method.getId());
    }

    // Add services
    extra.services.forEach((srv) => {
      const s = new peaqDidProto.Service();
      s.setId(srv.id);
      s.setType(srv.type);
      if (typeof srv.serviceEndpoint === 'string') {
        s.setServiceEndpoint(srv.serviceEndpoint);
      }
      doc.addServices(s);
    });

    // Add signature if provided
    if (extra.signature) {
      const sig = new peaqDidProto.Signature();
      sig.setType(extra.signature.type);
      sig.setIssuer(extra.signature.issuer);
      sig.setHash(extra.signature.hash);
      doc.setSignature(sig);
    }

    const bytes = doc.serializeBinary();
    const hexStr = u8aToHex(bytes).replace(/^0x/, '');
    return hexStr;
  }

  private _generateMultibase(address: string, type: string): string {
    switch (type) {
        case VerificationMethodType.ECDSA:
            if (this.metadata.chainType !== ChainType.EVM) {
                throw new Error('EcdsaSecp256k1RecoveryMethod2020 is only supported on EVM chains');
            }
            if (!this.metadata.pair || !('signingKey' in this.metadata.pair)) {
                console.warn('EVM wallet required for EcdsaSecp256k1RecoveryMethod2020. Cannot generate multibase without a signing key. Please provide publicKeyMultibase manually or connect an EVM wallet.');
                return ''; // Return empty string as fallback
            }
            return generateEvmPublicKeyMultibase(this.metadata.pair as any);
        case VerificationMethodType.ED25519:
            if (this.metadata.chainType !== ChainType.SUBSTRATE) {
                throw new Error('Ed25519VerificationKey2020 is only supported on Substrate chains');
            }
          return generateEd25519PublicKeyMultibase(address);
        case VerificationMethodType.SR25519:
            if (this.metadata.chainType !== ChainType.SUBSTRATE) {
                throw new Error('Sr25519VerificationKey2020 is only supported on Substrate chains');
            }
            return generateSr25519PublicKeyMultibase(address);
        default:
            throw new Error(`Unsupported DID verification method type: ${type}`);
    }
  }

  private _protoToV2(doc: any): DIDV2Document {
    return {
      // version: DIDVersion.V2_1_0,
      id: doc.getId(),
      controller: doc.getController(),
      verificationMethod: (doc.getVerificationMethods() || []).map((m: any) => ({
        id: m.getId(),
        type: m.getType(),
        controller: m.getController(),
        publicKeyMultibase: m.getPublicKeyMultibase(),
        // blockchainAccountId: m.getBlockchainAccountId()
      })),
      authentication: doc.getAuthentications(),
      service: (doc.getServices() || []).map((s: any) => ({
        id: s.getId(),
        type: s.getType(),
        serviceEndpoint: s.getServiceEndpoint()
      })),
      signature: doc.getSignature ? (doc.getSignature() ? {
        type: doc.getSignature()?.getType(),
        issuer: doc.getSignature()?.getIssuer(),
        hash: doc.getSignature()?.getHash()
      } : undefined) : undefined
    } as DIDV2Document;
  }

  // ---------------  EVM helpers ----------------
  private async _createEvm(name: string, address: string, didHex: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<DidWriteResult> {
    const selector = ethers.keccak256(ethers.toUtf8Bytes(FunctionSignatures.ADD_ATTRIBUTE)).substring(0, 10);
    const params = this.abiCoder.encode(
      ['address', 'bytes', 'bytes', 'uint32'],
      [address, ethers.hexlify(ethers.toUtf8Bytes(name)), ethers.hexlify(ethers.toUtf8Bytes(didHex)), 0]
    );
    const tx: EvmTransaction = {
      to: PrecompileAddresses.DID,
      data: params.replace('0x', selector)
    };

    return this._handleEvmTx(tx, `create DID ${name} for ${address}`, statusCallback, txOptions);
  }

  private async _updateEvm(name: string, address: string, didHex: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<DidWriteResult> {
    const selector = ethers.keccak256(ethers.toUtf8Bytes(FunctionSignatures.UPDATE_ATTRIBUTE)).substring(0, 10);
    const params = this.abiCoder.encode(
      ['address', 'bytes', 'bytes', 'uint32'],
      [address, ethers.hexlify(ethers.toUtf8Bytes(name)), ethers.hexlify(ethers.toUtf8Bytes(didHex)), 0]
    );
    const tx: EvmTransaction = {
      to: PrecompileAddresses.DID,
      data: params.replace('0x', selector)
    };

    return this._handleEvmTx(tx, `update DID ${name}`, statusCallback, txOptions);
  }

  private async _removeEvm(name: string, address: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<DidWriteResult> {
    const selector = ethers.keccak256(ethers.toUtf8Bytes(FunctionSignatures.REMOVE_ATTRIBUTE)).substring(0, 10);
    const params = this.abiCoder.encode(
      ['address', 'bytes'],
      [address, ethers.hexlify(ethers.toUtf8Bytes(name))]
    );
    const tx: EvmTransaction = {
      to: PrecompileAddresses.DID,
      data: params.replace('0x', selector)
    };

    return this._handleEvmTx(tx, `remove DID ${name}`, statusCallback, txOptions);
  }

  // ---------------  Substrate helpers ----------------
  private async _createSubstrate(name: string, address: string, didHex: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<DidWriteResult> {
    const api = this.api as ApiPromise;
    const call = api.tx?.['peaqDid']['addAttribute'](address, name, didHex, null);
    return this._handleSubstrateTx(call, `add DID ${name}`, statusCallback);
  }

  private async _updateSubstrate(name: string, address: string, didHex: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<DidWriteResult> {
    const api = this.api as ApiPromise;
    const call = api.tx['peaqDid']['updateAttribute'](address, name, didHex, null);
    return this._handleSubstrateTx(call, `update DID ${name}`, statusCallback);
  }

  private async _removeSubstrate(name: string, address: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<DidWriteResult> {
    const api = this.api as ApiPromise;
    const call = api.tx['peaqDid']['removeAttribute'](address, name);
    return this._handleSubstrateTx(call, `remove DID ${name}`, statusCallback);
  }

  private async _handleSubstrateTx(call: SubmittableExtrinsic<'promise', ISubmittableResult>, action: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>): Promise<DidWriteResult> {
    if (!this.metadata.pair) {
      return { message: `Constructed ${action} call (unsigned).`, extrinsic: call } as BuiltCallTransactionResult;
    }
    try {
      // Now both methods accept the unified TransactionStatusCallback type
      return await this._send_substrate_tx(call, statusCallback);
    } catch (err: any) {
      // Throw error instead of returning signable extrinsic
      throw new Error(`Failed to ${action}: ${err?.message ?? err}`);
    }
  }

  private async _handleEvmTx(tx: EvmTransaction, action: string, statusCallback?: (result: TransactionStatusCallback) => void | Promise<void>, txOptions?: txOptions): Promise<DidWriteResult> {
    if (!this.metadata.pair) {
      return { message: `Constructed ${action} tx (unsigned).`, tx } as BuiltEvmTransactionResult;
    }
    try {
      // The _send_evm_tx method already handles EVM status updates properly
      return await this._send_evm_tx(tx, statusCallback, txOptions);
    } catch (err: any) {
      // Throw error instead of returning signable extrinsic
      throw new Error(`Failed to ${action}: ${err?.message ?? err}`);
    }
  }
} 