export { Main as Sdk } from './modules/main.js';

// Export common enums for easier access
export { ChainType, KeyType, VerificationMethodType, PrecompileAddresses, ConfirmationMode, TransactionStatus } from './types/common.js';

// Explicit type re-exports for consumer DX
export type { 
  // base
  PeaqEventData,
  PeaqEvent,
  TErrorData,
  EvmEvent,
  EvmStatusUpdate,
  TransactionStatusCallback,
  SubstrateSendResult,
  EvmSendResult,
  FormattedReceipt,
  EvmFormattedReceipt,
} from './types/base.js';

export type {
  // common
  EvmTransaction,
  CreateInstanceOptions,
  SDKMetadata,
  BuiltCallTransactionResult,
  BuiltEvmTransactionResult,
  txOptions,
} from './types/common.js';

export type {
  // did
  DIDVersion,
  DIDFunctionSignatures,
  DIDV2Document,
  DIDV3Document,
  DIDDocumentBase,
  DIDDocument,
  VerificationMethod,
  Service,
  Signature,
  CreateDIDOptions,
  UpdateDIDOptions,
  RemoveDIDOptions,
  ReadDIDOptions,
  ReadDIDResult,
  DidWriteResult,
} from './types/did.js';

export type {
  // storage
  AddItemOptions,
  RemoveItemOptions,
  UpdateItemOptions,
  GetItemOptions,
  GetItemResult,
  StorageFunctionSignatures,
  StorageOperationType,
  StorageOperation,
  StorageWrittenResult,
} from './types/storage.js';