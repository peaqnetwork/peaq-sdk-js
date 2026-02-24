/**
 * Utility methods and constant definitions for NFT topics (MachineNFT & ContractNFT).
 */

import assert from 'assert';
import { AbiCoder, keccak256, hexlify, toUtf8Bytes, toUtf8String, getBytes } from 'ethers';
import { document as DID } from './did/did_document_format';
import * as fs from 'fs';

/**
 * Structure defining a contract's core data, see `IContractNft.sol`.
 */
export interface Contract {
  initiator: string;
  counterparties: string[];
  hashDigest: BigInt;
  url: string;
}

/**
 * Structure defining a complete contract draft, see `IContractNft.sol`.
 */
export interface ContractDraft {
  content: Contract;
  signatures: string[];
}

/**
 * Computes the unique contract ID for a given contract data structure.
 *
 * @param contract The contract data.
 * @returns The computed contract ID as a number string.
 */
export function contractId(contract: Contract): string {
  const abi = AbiCoder.defaultAbiCoder();
  const hash = keccak256(
    abi.encode(
      ['address', 'address[]', 'uint256', 'string'],
      [
        contract.initiator,
        contract.counterparties,
        contract.hashDigest,
        contract.url
      ]
    )
  );
  return BigInt(hash).toString();
}

/**
 * Generates a unique Peaq ID for a given DID document and Machine NFT.
 *
 * @param did The DID document.
 * @param machineNft The Machine NFT instance or its address.
 * @returns The generated Peaq ID as a string.
 */
export async function genPeaqId(
  did: DID.Document,
  machineNft: string
): Promise<string> {
  assert(
    did.verifiable_credential !== undefined,
    'DID document must contain a verifiable credential'
  );
  assert(
    did.verifiable_credential!.credential_subject !== undefined,
    'Verifiable credential must contain a credential subject'
  );

  const issuerId = machineNft;
  const machineId = machineIdFromCs(
    did.verifiable_credential!.credential_subject!
  );

  return `did:peaq:${issuerId}:${machineId}`;
}

/**
 * Verifies the unique machine ID for a given DID document.
 *
 * @param did The DID document.
 * @returns True if the machine ID is valid, false otherwise.
 */
export async function verifyMachineId(did: DID.Document): Promise<boolean> {
  return did.id === (await genPeaqId(did, did.verifiable_credential!.issuer));
}

/**
 * Generates a unique DID ID for a given DID document based on its verifiable credential.
 *
 * @param did The DID document.
 * @returns The generated DID ID as a string.
 */
export async function genDidId(did: DID.Document): Promise<string> {
  assert(
    did.verifiable_credential !== undefined,
    'DID document must contain a verifiable credential'
  );
  assert(
    did.verifiable_credential!.id !== undefined,
    'Verifiable credential must contain an ID (MachineNft EVM address)'
  );
  assert(
    did.verifiable_credential!.credential_subject !== undefined,
    'Verifiable credential must contain a credential subject'
  );

  const machineNftAddr = did.verifiable_credential!.id;
  const machineId = machineIdFromCsHex(
    did.verifiable_credential!.credential_subject!
  );

  return `did:peaq:${machineNftAddr.slice(2)}:${machineId.slice(2)}`;
}

/**
 * Computes the unique machine ID for a given DID document. Only the last 40 hex characters are used,
 * similar to an Ethereum address. The token ID is treated the same way.
 *
 * @param did The DID document.
 * @returns The computed machine ID as a number string.
 */
export function machineId(did: DID.Document): string {
  assert(
    did.verifiable_credential !== undefined,
    'DID document must contain a verifiable credential'
  );
  assert(
    did.verifiable_credential!.credential_subject !== undefined,
    'Verifiable credential must contain a credential subject'
  );
  return machineIdFromCs(did.verifiable_credential!.credential_subject!);
}

/**
 * Computes the unique machine ID in hexadecimal format for a given DID document.
 * Only the last 40 hex characters are used, similar to an Ethereum address.
 *
 * @param did The DID document.
 * @returns The computed machine ID as a hexadecimal string.
 */
export function machineIdHex(did: DID.Document): string {
  assert(
    did.verifiable_credential !== undefined,
    'DID document must contain a verifiable credential'
  );
  assert(
    did.verifiable_credential!.credential_subject !== undefined,
    'Verifiable credential must contain a credential subject'
  );
  return machineIdFromCsHex(did.verifiable_credential!.credential_subject!);
}

/**
 * Computes the unique machine ID for a given credential subject. Only the last 40 hex characters are used,
 * similar to an Ethereum address. The token ID is treated the same way.
 *
 * @param credentialSubject The credential subject data.
 * @returns The computed machine ID as a number string.
 */
export function machineIdFromCs(
  credentialSubject: DID.CredentialSubject
): string {
  const csBytes: Uint8Array = credentialSubject.serialize();
  const abi = AbiCoder.defaultAbiCoder();
  const hash = keccak256(abi.encode(['bytes'], [csBytes]));
  return BigInt(`0x${hash.slice(-40)}`).toString();
}

/**
 * Computes the unique machine ID in hexadecimal format for a given credential subject.
 * Only the last 40 hex characters are used, similar to an Ethereum address.
 *
 * @param credentialSubject The credential subject data.
 * @returns The computed machine ID as a hexadecimal string.
 */
export function machineIdFromCsHex(
  credentialSubject: DID.CredentialSubject
): string {
  const csBytes: Uint8Array = credentialSubject.serialize();
  const abi = AbiCoder.defaultAbiCoder();
  const hash = keccak256(abi.encode(['bytes'], [csBytes]));
  return `0x${hash.slice(-40)}`;
}

/**
 * Serializes a DID document for NFT storage, ensuring it does not exceed the maximum length.
 *
 * @param did The DID document to serialize.
 * @returns The serialized DID document as a Uint8Array.
 */
export function serializeDidForNft(did: DID.Document): Uint8Array {
  const stream = hexlify(did.serialize()).slice(2);
  assert(
    stream.length <= 2561,
    `Serialized DID document exceeds maximum length of 2561 hex characters: ${stream.length}`
  );
  return toUtf8Bytes(stream);
}

/**
 * Deserializes a DID document from NFT storage.
 *
 * @param byteStr The byte string containing the serialized DID document.
 * @returns The deserialized DID document.
 */
export function deserializeDidFromNft(byteStr: string): DID.Document {
  const recoveredHexNoPrefix = toUtf8String(byteStr);
  const recoveredHex = '0x' + recoveredHexNoPrefix;
  const recoveredBytes = getBytes(recoveredHex);
  return DID.Document.deserialize(recoveredBytes);
}

/**
 * Generates a hash digest for a digital contract document located at the specified URL.
 *
 * @param url The URL of the digital contract document.
 * @returns The generated hash digest as a number string.
 */
export async function genContractHashDigest(url: string): Promise<string> {
  const documentData: ArrayBuffer = await fetchBinaryDocument(url);
  const hashDigest = keccak256(
    getBytes(new Uint8Array(documentData))
  );
  return BigInt(hashDigest).toString();
}

// /**
//  * Verifies the integrity of a digital contract stored in a ContractNft contract.
//  *
//  * @param contractNft The ContractNft contract instance or its address.
//  * @param contractId The unique ID of the contract to verify.
//  * @param isDraft Whether to verify a draft version of the contract (default: false).
//  * @returns True if the contract's content matches the stored hash digest, false otherwise.
//  */
// export async function verifyDigitalContract(
//   contractNft: IContractNft | string,
//   contractId: string,
//   isDraft: boolean = false
// ): Promise<boolean> {
//   const contractNftK = (await hre.ethers.getContractAt(
//     'IContractNft',
//     await deploy.getAddress(contractNft)
//   )) as IContractNft;
//   assert(
//     !(await contractNftK.isContractIdAvailable(contractId)),
//     'Contract ID does not exist'
//   );

//   let url: string;
//   let hashDigest: string;
//   if (isDraft) {
//     const contractDraft: ContractDraft =
//       await contractNftK.getDraft(contractId);
//     url = contractDraft.content.url;
//     hashDigest = contractDraft.content.hashDigest.toString();
//   } else {
//     const contract: Contract = await contractNftK.getContract(contractId);
//     url = contract.url;
//     hashDigest = contract.hashDigest.toString();
//   }

//   const verifyHash = await genContractHashDigest(url);

//   return verifyHash === hashDigest;
// }

/**
 * Fetches a binary document from the specified URL.
 *
 * @param url The URL of the binary document.
 * @returns A promise that resolves to the binary data as an ArrayBuffer.
 */
export async function fetchBinaryDocument(url: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const binaryData = await response.arrayBuffer();
    return binaryData;
  } catch (error) {
    console.error('Error fetching file', error);
    throw error;
  }
}

/**
 * Reads and parses a JSON file from the specified file path.
 *
 * @param filePath The path to the JSON file.
 * @returns The parsed JSON object.
 */
export function readAndParseJson(filePath: string): any {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    throw error;
  }
}