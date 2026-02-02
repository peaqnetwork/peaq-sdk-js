# Core Concepts

This document provides deep dives into the foundational concepts of the peaq RWA Framework. Understanding these concepts is essential for effectively working with the SDK and participating in the ecosystem.

## Table of Contents

- [Identity & ONCHAINID](#identity--onchainid)
- [Claims](#claims)
- [MachineNFTs](#machinenfts)
- [ContractNFTs](#contractnfts)
- [Vaults & Security Tokens](#vaults--security-tokens)
- [Yield Distribution](#yield-distribution)
- [DID Documents](#did-documents)

---

## Identity & ONCHAINID

### What is ONCHAINID?

[ONCHAINID](https://github.com/onchain-id/solidity) is a decentralized identity protocol that enables verified, on-chain identities. In the RWA Framework, every participant must have an ONCHAINID `Identity` contract linked to their wallet address.

The Identity contract serves as:
- **A trust anchor** - Verifiers can check claims attached to an identity
- **A claim repository** - KYC and role claims are stored on the identity
- **A permission gate** - Framework operations check identity claims before executing

### Identity Contract Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Identity Contract                        │
│                                                             │
│  Owner: 0x1234...                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      Claims                         │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │    │
│  │  │ CT_KYC_     │ │ CT_MNFT_    │ │ CT_MNFT_    │    │    │
│  │  │ APPROVED    │ │ ISSUER      │ │ REGULATOR   │    │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Management Keys: [owner wallet, recovery key, ...]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Identity Lifecycle

1. **Creation** - An Identity contract is deployed via the `IdFactory`, linked to a wallet address
2. **Verification** - The identity owner provides information to a Claim Issuer for verification
3. **Claim Addition** - Signed claims are added to the identity contract
4. **Usage** - The identity enables participation in framework operations
5. **Claim Removal** - Claims can be revoked if no longer valid

### Why Identities Matter

Without a verified identity, you cannot:
- Own or transfer MachineNFTs
- Hold or transfer security tokens
- Receive yield distributions
- Create or sign ContractNFTs
- Act as a Machine Issuer or Regulator

The framework's smart contracts actively check identity claims before allowing operations.

→ See [Identity SDK Reference](../../../sdk_reference/identity/) for implementation details.

---

## Claims

### What Are Claims?

Claims are verifiable statements about an identity, issued and signed by trusted Claim Issuers. They form the foundation of compliance in the RWA Framework.

### Claim Structure

Every claim contains:

| Field | Description | Example |
|-------|-------------|---------|
| **Topic** | The type of claim | `CT_KYC_APPROVED` |
| **Scheme** | Data format identifier | `1` (ECDSA signature) |
| **Issuer** | Address of the ClaimIssuer contract | `0xABC123...` |
| **Signature** | Cryptographic proof from the issuer | `0x7890...` |
| **Data** | Claim payload (often hashed) | Personal info hash |
| **URI** | Optional external reference | `ipfs://Qm...` |

### Claim Topics

The framework uses specific claim topics:

| Topic | Constant | Purpose | Required For |
|-------|----------|---------|--------------|
| KYC Approved | `CT_KYC_APPROVED` | Identity verification | All framework participation |
| Machine Issuer | `CT_MNFT_ISSUER` | Issuer authorization | Minting MachineNFTs |
| Machine Regulator | `CT_MNFT_REGULATOR` | Regulator authorization | Approving Machine Issuers |

### Claim Lifecycle

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Generate   │───▶│     Sign     │───▶│     Add      │
│    Claim     │    │    Claim     │    │  to Identity │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  Claim Issuer        Claim Issuer        Identity Owner
  creates claim       signs with          calls addClaim()
  data structure      private key         on Identity
```

### KYC Claims

KYC claims verify a user's real-world identity. When generated, they typically include:
- First name and last name
- Date of birth
- Place of birth

This information is hashed before being stored on-chain, preserving privacy while enabling verification.

### Role Claims

Role claims authorize specific framework functions:

**CT_MNFT_ISSUER** - Allows the holder to:
- Be added as a Machine Issuer by a Regulator
- Receive a dedicated MachineNft contract
- Mint MachineNFTs for asset owners

**CT_MNFT_REGULATOR** - Allows the holder to:
- Be appointed as a Regulator by the Framework Owner
- Add new Machine Issuers to the framework

### Claim Verification

Verifier contracts check claims during operations:

1. **Retrieve the claim** from the identity contract
2. **Verify the issuer** is trusted for that claim topic
3. **Validate the signature** matches the claim data
4. **Allow or deny** the operation based on validity

→ See [Identity SDK Reference](../../../sdk_reference/identity/) for claim operations.

---

## MachineNFTs

### What Are MachineNFTs?

MachineNFTs are ERC-721 compatible tokens that represent real-world physical assets on the blockchain. Each MachineNFT is linked to a specific machine through an embedded DID (Decentralized Identifier) document.

### Architecture Overview

The MachineNFT system has three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      PeaqRwaNft                             │
│              (Factory & Registry Contract)                  │
│  - Manages Machine Issuers and Regulators                   │
│  - Deploys MachineNft contracts                             │
│  - Global blocking controls                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MachineNft                             │
│              (Per-Issuer NFT Contract)                      │
│  - ERC-721 compliant                                        │
│  - Owned by one Machine Issuer                              │
│  - Stores DID documents per token ID                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Fractionalized Machine (NFT)                      │
│  - Unique token ID derived from DID                         │
│  - Owned by a KYC'd wallet address                          │
│  - Contains serialized DID document                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Characteristics

| Property | Description |
|----------|-------------|
| **Standard** | ERC-721 compatible |
| **Ownership** | One owner per token (wallet or contract) |
| **Issuer-Specific** | Each issuer has their own MachineNft contract |
| **DID Embedded** | Machine metadata stored directly in the token |
| **Transferable** | Can be transferred (with fee) between KYC'd addresses |

### Registration Process

When a machine is registered:

1. **Machine Issuer** collects machine information
2. **DID Document** is created describing the machine
3. **Token ID** is computed from the DID (ensuring uniqueness)
4. **Fee** is verified (owner must have approved)
5. **NFT is minted** to the machine owner's address
6. **DID is stored** on-chain linked to the token

### Registration Fees

| Fee Type | Amount | Paid By |
|----------|--------|---------|
| Registration | 0.1% of machine value (min 10 PEAQ) | Machine owner |
| Transfer | 1 PEAQ per transfer | Sender |

Fees must be approved (ERC-20 `approve`) before the transaction.

### Ownership Model

- **Machine Owner**: The wallet address holding the NFT
- **Machine Issuer**: The entity that registered the machine (cannot change)
- **MachineNft Contract**: Holds all NFTs from one issuer

A single user can own MachineNFTs from multiple issuers (multiple contracts).

→ See [Machine NFT SDK Reference](../../../sdk_reference/mnft/) for implementation details.

---

## ContractNFTs

### What Are ContractNFTs?

ContractNFTs are ERC-721 tokens that represent legal agreements between multiple parties. Unlike MachineNFTs, they don't represent physical assets but rather contractual obligations.

### Key Characteristics

| Property | Description |
|----------|-------------|
| **Multi-party** | Involves an initiator and one or more counterparties |
| **Hash-verified** | Document content is verified via on-chain hash |
| **Draft state** | Remains draft until all parties sign |
| **Cancellable** | Initiator can cancel before completion |
| **Depositable** | Can be deposited into vaults alongside MachineNFTs |

### Contract Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    CONTRACT LIFECYCLE                        │
│                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│  │ Create  │───▶│  Draft  │───▶│  Sign   │───▶│ Final   │    │
│  │         │    │         │    │         │    │         │    │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│   Initiator      Waiting for    Each party    All signed     │
│   pays fee       signatures     signs in      NFT minted     │
│   and signs                     turn          to initiator   │
│                                                              │
│                       │                                      │
│                       ▼                                      │
│                 ┌─────────┐                                  │
│                 │ Cancel  │ (Only by initiator,              │
│                 │         │  only while draft)               │
│                 └─────────┘                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Contract ID

Each contract has a unique identifier computed from:
- Initiator's address
- List of counterparty addresses
- Hash digest of the document
- URL pointing to the document

This ensures that identical contract parameters always produce the same ID.

### Document Verification

ContractNFTs don't store the full document on-chain. Instead:

1. **Document** is stored off-chain (e.g., IPFS)
2. **Hash** of the document is stored on-chain
3. **URL** pointing to the document is stored on-chain
4. **Verification** compares the hash of the retrieved document against the on-chain hash

This pattern keeps large documents off the blockchain while ensuring integrity.

### Signing Process

1. **Initiator** creates the contract and signs first
2. **Contract** enters draft state
3. **Counterparties** are notified (off-chain)
4. **Each counterparty** signs in any order
5. **When all sign**, contract is finalized and NFT is minted

### Setup Fee

Creating a ContractNFT requires a fee paid by the initiator. The fee amount and recipient can be queried from the contract before creation.

→ See [Contract NFT SDK Reference](../../../sdk_reference/cnft/) for implementation details.

---

## Vaults & Security Tokens

### What Are Vaults?

A `PeaqVault` is a smart contract that holds MachineNFTs and ContractNFTs, enabling their fractionalization into security tokens. This transforms illiquid physical assets into tradeable digital securities.

![Vault Architecture](../examples/doc/images/peaq-vault.png)

### The Tokenization Model

```
┌─────────────────────────────────────────────────────────────┐
│                        PeaqVault                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Locked NFTs                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                │    │
│  │  │Machine 1│ │Machine 2│ │Contract │                │    │
│  │  │  NFT    │ │  NFT    │ │   NFT   │                │    │
│  │  └─────────┘ └─────────┘ └─────────┘                │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Security Token (T-REX)                │    │
│  │        Fractional ownership of vault contents       │    │
│  │                                                     │    │
│  │   Total Supply: 1,000,000 tokens                    │    │ 
│  │   Each token = proportional vault ownership         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Vault Components

When a vault is created, three contracts are deployed:

| Component | Purpose |
|-----------|---------|
| **PeaqVault** | Holds NFTs, manages deposits |
| **Security Token** | T-REX (ERC-3643) compliant fractional shares |
| **Reward Distributor** | Handles yield distribution to token holders |

### T-REX Security Tokens

Security tokens comply with the [ERC-3643 (T-REX)](https://github.com/ERC-3643/ERC-3643) standard:

- **Compliance Built-in** - Transfers only allowed between verified addresses
- **Identity Registry** - Each vault maintains a list of approved holders
- **Pausable** - Token transfers can be paused for regulatory reasons
- **Agent Controlled** - Designated agents can perform administrative functions

### Identity Requirements

Before an address can hold security tokens:

1. The address must have a valid Identity contract
2. The Identity must have a `CT_KYC_APPROVED` claim
3. The address must be registered in the vault's Identity Registry

### Deposit and Mint

The deposit-and-mint operation:

1. NFTs are transferred from the depositor to the vault
2. Security tokens are minted to the depositor
3. This operation can only happen **once per vault** for security

The number of tokens minted represents the fractional ownership of the vault contents.

### Transfer Fees

Transferring security tokens incurs a fee:
- Fee amount and recipient are queried from the vault
- Fee must be approved before transfer
- Paid in PEAQ tokens

→ See [Vault SDK Reference](../../../sdk_reference/vault/) for implementation details.

---

## Yield Distribution

### How Yield Works

Vaults generate yield when the underlying machines produce revenue. This yield is distributed proportionally to security token holders.

### The Distribution Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    YIELD DISTRIBUTION                        │
│                                                              │
│  1. Machine generates revenue (off-chain)                    │
│                    │                                         │
│                    ▼                                         │
│  2. Revenue converted to payout asset (e.g., USDC)           │
│                    │                                         │
│                    ▼                                         │
│  3. Anyone deposits yield into vault                         │
│                    │                                         │
│                    ▼                                         │
│  4. Reward Distributor allocates based on token holdings     │
│                    │                                         │
│                    ▼                                         │
│  5. Token holders claim their proportional share             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Payout Asset

Each vault has a designated **payout asset** - the ERC-20 token used for yield distribution (e.g., USDC, USDT, or PEAQ).

### Depositing Yield

- **Anyone** can deposit yield into a vault
- Yield must be in the vault's payout asset
- Shares must already be minted (`totalSupply > 0`)
- Deposited yield is allocated to all current token holders

### Claiming Yield

Token holders can claim accumulated yield:

| Method | Description |
|--------|-------------|
| `claim()` | Claim to your own wallet |
| `claimTo(recipient)` | Claim to a specified address |

Claims can be triggered:
- By the token holder themselves
- By anyone on behalf of a holder (no fee for this)

### Reward Distributor

The `RewardDistributor` contract:
- Tracks yield deposits
- Calculates proportional allocations
- Handles claim settlement
- Supports multiple payout assets (if configured)

→ See [Vault SDK Reference](../../../sdk_reference/vault/) for yield operations.

---

## DID Documents

### What Are DID Documents?
(Undergoing continuous design phase)

DID (Decentralized Identifier) documents are structured data that uniquely identify and describe a machine. They are embedded in MachineNFTs and stored on-chain.

### Document Structure

A DID document contains:

```json
{
  "id": "did:peaq:0xMachineNftContract:tokenId",
  "services": [
    {
      "id": "#p2p",
      "type": "p2p",
      "service_endpoint": "/ipv4/w.x.y.z/tcp/port/p2p/QmKey"
    },
    {
      "id": "#metadata",
      "type": "metadata",
      "service_endpoint": "/ipv4/w.x.y.z/tcp/port/p2p/QmKey"
    }
  ],
  "verifiable_credential": {
    "id": "0xIssuerAddress",
    "type": "MachineNft",
    "issuer": "0xMachineIssuerAddress",
    "issuance_date": "2025-12-02T14:23:59.913Z",
    "credential_subject": {
      "type": 0,
      "machine": {
        "type": "Vehicle",
        "manufacturer": "BMW",
        "model": "X3",
        "edition": "2023",
        "color": "Black",
        "day_of_manufacture": "2024-01-15",
        "country": "Germany",
        "city": "Munich",
        "serial_number": "WBAKS51060DG123450"
      }
    }
  }
}
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **id** | Unique identifier following DID spec |
| **services** | Endpoints for machine communication |
| **verifiable_credential** | Machine details and provenance |
| **credential_subject** | Machine-specific metadata |

### Token ID Derivation

The MachineNFT token ID is derived from the DID document, ensuring:
- **Uniqueness** - No two machines can have the same ID
- **Determinism** - Same machine data always produces same ID
- **Verifiability** - ID can be recomputed from the document

### On-Chain Storage

DID documents are:
- **Serialized** using Protocol Buffers for efficiency
- **Stored** directly in the MachineNft contract
- **Retrievable** via `getMachineDid(tokenId)`
- **Immutable** once registered

### Service Endpoints

Services define how to interact with the physical machine:
- **p2p** - Peer-to-peer communication endpoint
- **metadata** - Additional machine data location

These enable IoT integration and machine-to-machine communication.

→ See [Machine NFT SDK Reference](../../../sdk_reference/mnft/) for DID operations.

---

## Concept Relationships

The following diagram shows how all concepts interconnect:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONCEPT MAP                                 │
│                                                                     │
│   Identity ◄─────────────── Claims (KYC, Roles)                     │
│      │                                                              │
│      ▼                                                              │
│   Verification ─────────────► Framework Operations                  │
│                                      │                              │
│              ┌───────────────────────┼───────────────────────┐      │
│              ▼                       ▼                       ▼      │
│        MachineNFT              ContractNFT               Vault      │
│        (DID Doc)               (Hash + URL)          (Security      │
│             │                       │                  Tokens)      │
│             └───────────────────────┼───────────────────────┘       │
│                                     │                               │
│                                     ▼                               │
│                              Deposit & Mint                         │
│                                     │                               │
│                                     ▼                               │
│                             Yield Distribution                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

- **[Introduction](../introduction.md)** - Return to framework overview
- **[Roles & Responsibilities](../roles/)** - Understand who does what
- **[Getting Started Guides](../guides/)** - Step-by-step instructions
- **[SDK Reference](../../../sdk_reference/)** - Complete API documentation
