import bs58 from "bs58";
import { Wallet, computeAddress } from "ethers";
import { blake2AsHex, encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import { u8aConcat, u8aToU8a } from '@polkadot/util';
import type { AccountId32 } from '@polkadot/types/interfaces/runtime';

export type Address = AccountId32 | string;

export interface CreateStorageKeysArgs {
    value: AccountId32 | string;
    type: CreateStorageKeysEnum;
  }

export enum CreateStorageKeysEnum {
    ADDRESS,
    STANDARD,
}

export const createStorageKeys = (args: CreateStorageKeysArgs[]) => {
  const keysByteArray = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].type === CreateStorageKeysEnum.ADDRESS) {
      const decoded_address = decodeAddress(args[i].value, false, 42);
      keysByteArray.push(decoded_address);
    }
    if (args[i].type === CreateStorageKeysEnum.STANDARD) {
      const hash_name = u8aToU8a(args[i].value);
      keysByteArray.push(hash_name);
    }
  }

  const key = u8aConcat(...keysByteArray);
  const hashed_key = blake2AsHex(key, 256);
  return { hashed_key };
};


/**
 * Given an ethers Wallet (from mnemonic or privateKey),
 * returns the secp256k1 publicKeyMultibase (z…).
 */
export function generateEvmPublicKeyMultibase(wallet: Wallet): string {
  // ENCODE EVM WALLET TO MULTIBASE

  

  // 1. Get the 33-byte SEC1 “compressed” secp256k1 public key from the wallet
  const compressedPubKeyHex = wallet.signingKey.compressedPublicKey;

  // 2. Turn into raw bytes
  const pubKeyBytes = Buffer.from(compressedPubKeyHex.slice(2), "hex");


  // 3. Build the multicodec-prefix + key blob
  // 0xe7 is the multicodec code for secp256k1-pub, and as a uvarint it becomes the two bytes [0xe7,0x01
  // SOURCE: https://pkg.go.dev/github.com/dep2p/libp2p@v0.0.6/multiformats/multicodec
  const prefix = Uint8Array.from([0xe7, 0x01]);
  const full = new Uint8Array(prefix.length + pubKeyBytes.length);
  full.set(prefix, 0);
  full.set(pubKeyBytes, prefix.length);

  // 5. Encode to multibase (Base58-btc + "z")
  const publicKeyMultibase = "z" + bs58.encode(full);
  return publicKeyMultibase;
}

/**
 * Given a Substrate SS58 address, returns the Ed25519 publicKeyMultibase (z…).
 */
export function generateEd25519PublicKeyMultibase(address: string): string {
  // 1. Decode SS58 address to get the raw 32-byte public key
  const publicKey = decodeAddress(address); // Uint8Array(32)
  console.log('publicKey:', Buffer.from(publicKey).toString('hex'));

  // 2. Build the multicodec-prefix + key blob
  // 0xed is the multicodec code for ed25519-pub
  // SOURCE: https://pkg.go.dev/github.com/dep2p/libp2p@v0.0.6/multiformats/multicodec
  const prefix = Uint8Array.from([0xed, 0x01]);
  const full = new Uint8Array(prefix.length + publicKey.length);
  full.set(prefix, 0);
  full.set(publicKey, prefix.length);
  
  // 3. Encode to multibase (Base58-btc + "z")
  const publicKeyMultibase = "z" + bs58.encode(full);
  return publicKeyMultibase;
}

/**
 * Given a Substrate SS58 address, returns the Sr25519 publicKeyMultibase (z…).
 */
export function generateSr25519PublicKeyMultibase(address: string): string {
  // 1. Decode SS58 address to get the raw 32-byte public key
  const publicKey = decodeAddress(address); // Uint8Array(32)
  
  // 2. Build the multicodec-prefix + key blob
  // 0xef is the multicodec code for sr25519-pub
  // SOURCE: https://pkg.go.dev/github.com/dep2p/libp2p@v0.0.6/multiformats/multicodec
  const prefix = Uint8Array.from([0xef, 0x01]);
  const full = new Uint8Array(prefix.length + publicKey.length);
  full.set(prefix, 0);
  full.set(publicKey, prefix.length);
  
  // 3. Encode to multibase (Base58-btc + "z")
  const publicKeyMultibase = "z" + bs58.encode(full);
  return publicKeyMultibase;
}

/**
 * Given a secp256k1 publicKeyMultibase string (z…),
 * returns the canonical Ethereum address (0x…).
 * 
 * Note: This is a simplified implementation that assumes the multibase
 * contains a compressed secp256k1 public key with standard multicodec prefix of [0xe7, 0x01].
 * 
 * SOURCE: https://pkg.go.dev/github.com/dep2p/libp2p@v0.0.6/multiformats/multicodec
 */
export function evmAddressFromPublicKeyMultibase(multibase: string): string {
  // DECODE MULTIBASE TO EVM WALLET ADDRESS

  // 1. Round-trip decode to verify your multibase
  const base58Part = multibase.slice(1);
  const decoded = bs58.decode(base58Part); // Uint8Array(34)
  const samePublicKey = decoded.slice(2); // Uint8Array(32)

  // 2. Convert and print as hex
  const hexValue = "0x" + Buffer.from(samePublicKey).toString('hex');

  // 3. Recover the Ethereum address
  const derivedAddress = computeAddress(hexValue);
  return derivedAddress;
}

/**
 * Given an Ed25519 or Sr25519 publicKeyMultibase string (z…),
 * returns the canonical SS58 address.
 * 
 * @param multibase - The multibase string starting with 'z'
 * @param ss58Prefix - SS58 format prefix (default: 42 for generic substrate)
 */
export function substrateAddressFromPublicKeyMultibase(multibase: string, ss58Prefix: number = 42): string {
  // 1. Strip 'z' and decode base58
  const base58Part = multibase.slice(1);
  const decoded = bs58.decode(base58Part); // Uint8Array(34)
  
  // 2. Remove the 2-byte multicodec prefix
  const publicKey = decoded.slice(2); // Uint8Array(32)
  
  // 3. Encode to SS58 address format
  const ss58Address = encodeAddress(publicKey, ss58Prefix);
  return ss58Address;
}

/**
 * Cryptography utilities for the Peaq SDK.
 * Provides helpers for working with public keys, multibase encoding, and address derivation.
 */
export class Crypto {
  /**
   * Generate EVM public key multibase from wallet
   */
  static generateEvmPublicKeyMultibase = generateEvmPublicKeyMultibase;

  /**
   * Generate Ed25519 public key multibase from SS58 address
   */
  static generateEd25519PublicKeyMultibase = generateEd25519PublicKeyMultibase;

  /**
   * Generate Sr25519 public key multibase from SS58 address
   */
  static generateSr25519PublicKeyMultibase = generateSr25519PublicKeyMultibase;

  /**
   * Derive EVM address from public key multibase
   */
  static evmAddressFromPublicKeyMultibase = evmAddressFromPublicKeyMultibase;

  /**
   * Derive Substrate SS58 address from public key multibase
   */
  static substrateAddressFromPublicKeyMultibase = substrateAddressFromPublicKeyMultibase;
} 