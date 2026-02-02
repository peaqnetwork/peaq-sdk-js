# Roles & Responsibilities

The peaq RWA Framework defines a structured hierarchy of roles, each with specific responsibilities, requirements, and capabilities. This document provides a comprehensive overview of every role in the ecosystem.

## Role Hierarchy Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Framework Owner                            │
│                  (Manages the ecosystem)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Claim Issuers  │ │Machine Regulator│ │  Vault Owners   │
│  (Issue claims) │ │(Approve issuers)│ │ (Manage vaults) │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Machine Issuers │
                    │  (Mint NFTs)    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Users/Investors │
                    │ (Hold assets)   │
                    └─────────────────┘
```

## Quick Reference

| Role | Required Claim | Appointed By | Primary Responsibility |
|------|----------------|--------------|------------------------|
| Framework Owner | Admin access | Deployment | Ecosystem administration |
| Claim Issuer | Trusted by Framework Owner | Framework Owner | Issue KYC and role claims |
| Machine Regulator | `CT_MNFT_REGULATOR` | Framework Owner | Approve machine issuers |
| Machine Issuer | `CT_MNFT_ISSUER` | Machine Regulator | Mint MachineNFTs |
| Vault Owner | Created via factory | Framework Owner | Manage vault operations |
| User / Investor | `CT_KYC_APPROVED` | Claim Issuer | Hold assets and tokens |

---

## Framework Owner

The **Framework Owner** is the top-level administrator of the entire RWA ecosystem. This role is typically held by the organization that deployed the framework (e.g., EoTLabs for the peaq network).

### Responsibilities

1. **Manage Trusted Claim Issuers** - Determine which entities are authorized to issue claims (KYC, roles) that the framework will recognize
2. **Appoint Machine Regulators** - Add or remove addresses authorized to approve machine issuers
3. **Create Vaults** - Deploy new vault instances with associated security tokens and reward distributors
4. **Administer the InfoDesk** - Update contract addresses, implementation contracts, and configuration values
5. **Emergency Controls** - Block or unblock machine issuers and pause/unpause security tokens when necessary

### Trust and Claim Issuers

Claim issuers are crucial for the KYC process. While anyone can technically deploy a `ClaimIssuer` contract, only claims from issuers trusted by the Framework Owner are recognized by the framework's verifiers.

The Framework Owner determines which claim topics each issuer can issue:
- `CT_KYC_APPROVED` - For user identity verification
- `CT_MNFT_ISSUER` - For machine issuer authorization
- `CT_MNFT_REGULATOR` - For machine regulator authorization

### Vault Factory Management

The Framework Owner controls the `PeaqVaultFactory`, which orchestrates the deployment of complete vault setups:
- **Vault** - Holds MachineNFTs and ContractNFTs
- **Security Token** - T-REX compliant token representing fractional ownership
- **Reward Distributor** - Handles yield distribution to token holders

When creating a vault, the Framework Owner specifies:
- The vault taker (who will own the vault)
- Token name and symbol
- Payout asset for yield distribution
- KYC requirements and compliance modules

### InfoDesk Administration

The InfoDesk is the central configuration hub for the framework. The Framework Owner can update:
- **Contract addresses** - Locations of core framework contracts
- **Implementation addresses** - For upgradeable proxy contracts
- **Fee configurations** - Registration fees, transfer fees, and fee accounts
- **Precompile addresses** - For peaq-specific functionality

→ See [Framework Owner SDK Reference](../../../sdk_reference/rwanft/) for implementation details.

---

## Claim Issuers

A **Claim Issuer** is an entity that issues verifiable claims about users. These claims enable the framework to enforce compliance requirements without centralized identity storage.

### What Are Claims?

Claims contain structured information that verifiers use to grant access to framework functionality:
- **Topic** - The type of claim (e.g., KYC approved, machine issuer role)
- **Scheme** - The claim's data format
- **Signature** - Cryptographic proof from the issuer
- **Data** - The actual claim payload
- **URI** - Optional reference to additional information

### Types of Claims

The RWA Framework uses two primary claim types:

| Claim Type | Topic | Purpose |
|------------|-------|---------|
| KYC Claims | `CT_KYC_APPROVED` | Verify a user's identity for compliance |
| Role Claims | `CT_MNFT_ISSUER`, `CT_MNFT_REGULATOR` | Authorize specific framework roles |

### Becoming a Claim Issuer

To become a trusted claim issuer:

1. **Deploy a ClaimIssuer contract** - This contract will hold the keys authorized to sign claims
2. **Request trust from the Framework Owner** - The Framework Owner must add your contract to the list of trusted issuers for specific claim topics
3. **Configure signing keys** - Add wallet addresses that can sign claims on behalf of your ClaimIssuer contract

### Issuing Claims

The claim issuance process:

1. **Receive identity information** from the user (wallet address, `Identity` contract address)
2. **Verify the information** through your KYC process (off-chain)
3. **Generate the claim** with the appropriate topic and data
4. **Sign the claim** with an authorized signing key
5. **Return the signature** to the user so they can add it to their Identity contract

For role claims, the process is similar but verifies organizational authorization rather than personal identity.

→ See [OnChainID SDK Reference](../../../sdk_reference/identity/) for implementation details.

---

## Machine Regulators

A **Machine Regulator** oversees and authorizes machine issuers within the framework. They act as a quality control layer, ensuring that only legitimate entities can mint MachineNFTs.

### Prerequisites

Before becoming a Machine Regulator, you must:

1. **Have an Identity contract** - Deploy an ONCHAINID `Identity` contract linked to your wallet
2. **Be KYC approved** - Have a `CT_KYC_APPROVED` claim added to your Identity
3. **Have the regulator claim** - Obtain a `CT_MNFT_REGULATOR` claim from a trusted Claim Issuer

### Becoming a Machine Regulator

The process involves two steps:

**Step 1: Obtain the Role Claim**

Provide the following to a trusted Claim Issuer:
- Your `Identity` contract address
- The name or description of your organization

The Claim Issuer will generate and sign a claim with topic `CT_MNFT_REGULATOR`. Add this signed claim to your Identity contract.

**Step 2: Get Appointed by the Framework Owner**

The Framework Owner must add your wallet address to the list of authorized machine regulators in the `PeaqRwaNft` contract. This requires:
- Your public wallet address

Once added, you can begin authorizing machine issuers.

### Responsibilities

Machine Regulators are responsible for:

1. **Vetting Machine Issuers** - Verify that potential issuers are legitimate organizations with proper authority to tokenize machines
2. **Adding Machine Issuers** - Call `addMachineIssuer` on the `PeaqRwaNft` contract, which deploys a new `MachineNft` contract for the issuer
3. **Monitoring Issuers** - Oversee the activities of authorized issuers within their jurisdiction
4. **Reporting Issues** - Alert the Framework Owner if an issuer needs to be blocked

### Adding a Machine Issuer

When you authorize a new machine issuer:
1. Verify they have a valid Identity with `CT_MNFT_ISSUER` claim
2. Call `addMachineIssuer` with their wallet address
3. A new `MachineNft` contract is deployed and assigned to them
4. The issuer can now mint MachineNFTs through their contract

→ See [RWA NFT SDK Reference](../../../sdk_reference/rwanft/) for implementation details.

---

## Machine Issuers

A **Machine Issuer** is authorized to mint MachineNFTs representing real-world physical assets. Each issuer manages their own `MachineNft` contract instance.

### Prerequisites

Before becoming a Machine Issuer, you must:

1. **Have an Identity contract** - Deploy an ONCHAINID `Identity` contract linked to your wallet
2. **Be KYC approved** - Have a `CT_KYC_APPROVED` claim added to your Identity
3. **Have the issuer claim** - Obtain a `CT_MNFT_ISSUER` claim from a trusted Claim Issuer

### Becoming a Machine Issuer

The process involves two steps:

**Step 1: Obtain the Role Claim**

Provide the following to a trusted Claim Issuer:
- Your `Identity` contract address
- The name or description of your organization

The Claim Issuer will generate and sign a claim with topic `CT_MNFT_ISSUER`. Add this signed claim to your Identity contract.

**Step 2: Get Authorized by a Machine Regulator**

A Machine Regulator must add you to the list of authorized issuers:
- Provide your public wallet address to the regulator
- The regulator calls `addMachineIssuer`, which deploys your `MachineNft` contract
- The contract address is emitted in the transaction event

### Your MachineNft Contract

Once authorized, you own a dedicated `MachineNft` contract. Key points:

- **You are the only issuer** - Only you can mint NFTs from this contract
- **Multiple owners** - NFTs you mint can be owned by any KYC'd user
- **Unique per issuer** - Each issuer has their own contract instance
- **Retrievable** - The contract address can be looked up from `PeaqRwaNft` using your wallet address

### Registering Machines

To register a new machine as a MachineNFT:

1. **Collect machine information** from the owner (or yourself)
2. **Create a DID document** describing the machine (type, manufacturer, serial number, etc.)
3. **Ensure fee approval** - The machine owner must approve the registration fee
4. **Call registerMachine** with:
   - Machine owner's wallet address
   - Machine value (in PEAQ tokens)
   - Machine DID document (serialized)
5. **Return the token ID** - The minted NFT is transferred to the owner's wallet

### Registration Fees

- **Fee**: 0.1% of the machine's declared value (minimum 10 PEAQ)
- **Paid by**: The machine owner (must approve before registration)
- **Approved to**: The fee account specified in the `MachineNft` contract

→ See [Machine NFT SDK Reference](../../../sdk_reference/mnft/) for implementation details.

---

## Vault Owners

A **Vault Owner** manages a `PeaqVault` that holds MachineNFTs and ContractNFTs, fractionalizing them into security tokens.

### How Vaults Are Created

Vaults are created by the Framework Owner through the `PeaqVaultFactory`. When created:
- A new `PeaqVault` contract is deployed
- An associated T-REX security token is deployed
- A reward distributor is deployed for yield management
- Ownership is transferred to the specified vault taker

### Vault Owner Responsibilities

1. **Configure accepted NFT collections** - Determine which MachineNft and ContractNft contracts can deposit into the vault
2. **Accept deposits** - Receive NFTs from authorized depositors
3. **Mint security tokens** - Issue fractional ownership tokens based on deposits
4. **Manage yield distribution** - Configure and trigger yield distribution to token holders
5. **Handle compliance** - Ensure only verified identities can hold tokens

### Depositing and Minting

The vault supports a single deposit-and-mint operation:
- NFTs (MachineNFT and/or ContractNFT) are transferred into the vault
- Security tokens are minted to the depositor
- This operation can only happen once per vault for security reasons

### Yield Distribution

Vaults integrate with a `RewardDistributor` contract:
- Anyone can deposit yield (revenue) into the vault
- Yield is automatically allocated based on token holdings
- Token holders can claim their proportional share at any time
- Claims can be made to the holder's wallet or a specified recipient

### Identity Registry

Each vault has an associated identity registry. Before an address can hold security tokens:
- The address must have a valid Identity contract
- The Identity must have the required KYC claim
- The address must be registered in the vault's identity registry

→ See [Vault SDK Reference](../../../sdk_reference/vault/) for implementation details.

---

## Users / Investors

A **User** or **Investor** is any participant who wants to:
- Own MachineNFTs representing physical assets
- Hold security tokens representing fractional vault ownership
- Receive yield from vault operations
- Trade assets within the framework

### Prerequisites

Every user must have:

1. **An Identity contract** - Deployed via ONCHAINID's `IdFactory`
2. **KYC approval** - A `CT_KYC_APPROVED` claim from a trusted Claim Issuer

Without these, you cannot:
- Own or transfer MachineNFTs
- Hold or transfer security tokens
- Receive yield distributions
- Interact with vaults

### Onboarding Process

**Step 1: Deploy Your Identity Contract**

Create an Identity contract linked to your wallet:
- Provide your wallet address to the identity factory
- Use a unique salt value (can only be used once in the framework)
- The deployed Identity contract becomes your on-chain identity

**Step 2: Get KYC Approved**

Obtain a KYC claim from a trusted Claim Issuer:
1. Contact a trusted Claim Issuer in the ecosystem
2. Provide required information:
   - Your `Identity` contract address
   - First name, last name
   - Date of birth (YYYY-MM-DD format)
   - Place of birth
3. Complete the issuer's verification process
4. Receive the signed claim
5. Add the claim to your Identity contract

### What You Can Do

Once KYC approved, you can:

| Action | Description |
|--------|-------------|
| **Own MachineNFTs** | Receive machines registered by Machine Issuers |
| **Transfer MachineNFTs** | Send machines to other KYC'd addresses (fee applies) |
| **Hold Security Tokens** | Own fractional vault shares (must be registered in vault) |
| **Transfer Security Tokens** | Trade tokens with other verified holders (fee applies) |
| **Claim Yield** | Withdraw your share of vault revenues |
| **Create ContractNFTs** | Initiate multi-party agreements |
| **Sign Contracts** | Participate in ContractNFT agreements |

### Framework Fees

As a user, you'll encounter these fees:

| Action | Fee | Notes |
|--------|-----|-------|
| MachineNFT Registration | 0.1% of value (min 10 PEAQ) | Paid by owner, approved before registration |
| MachineNFT Transfer | 1 PEAQ per transfer | Approved before each transfer |
| ContractNFT Setup | Configurable fee | Paid by contract initiator |
| Security Token Transfer | Configurable fee | Based on transfer amount |

All fees must be approved (ERC-20 `approve`) before the corresponding transaction is executed.

→ See [Identity SDK Reference](../../../sdk_reference/identity/) and [SDK Reference Overview](../../../sdk_reference/) for implementation details.

---

## Role Interaction Summary

The following diagram shows how roles interact in a typical flow:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           TYPICAL FLOW                                    │
│                                                                          │
│  1. Framework Owner trusts Claim Issuer                                  │
│  2. Claim Issuer KYCs User → User gets Identity + CT_KYC_APPROVED        │
│  3. Claim Issuer issues CT_MNFT_REGULATOR → Entity becomes Regulator     │
│  4. Framework Owner appoints Regulator                                   │
│  5. Claim Issuer issues CT_MNFT_ISSUER → Entity becomes Issuer           │
│  6. Regulator authorizes Issuer → MachineNft contract deployed           │
│  7. Issuer registers machine → User receives MachineNFT                  │
│  8. Framework Owner creates Vault → Vault Owner receives control         │
│  9. Vault Owner registers User in identity registry                      │
│  10. User deposits MachineNFT → Receives security tokens                 │
│  11. User claims yield from vault operations                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

- **[Introduction](../introduction.md)** - Return to framework overview
- **[Core Concepts](../concepts/)** - Deep dive into claims, identities, and vaults
- **[Getting Started Guides](../guides/)** - Step-by-step instructions for your role
- **[SDK Reference](../../../sdk_reference/)** - Complete API documentation
