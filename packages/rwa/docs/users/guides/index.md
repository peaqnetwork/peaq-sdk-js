# Getting Started Guides

This document provides step-by-step instructions for getting started with the peaq RWA Framework based on your role. Each guide walks you through the essential tasks to begin participating in the ecosystem.

## Choose Your Role

| Role | Start Here |
|------|------------|
| New user who wants to own assets | [User Onboarding](#user-onboarding) |
| Entity that will verify identities | [Claim Issuer Setup](#claim-issuer-setup) |
| Entity that will oversee machine issuers | [Machine Regulator Setup](#machine-regulator-setup) |
| Entity that will register machines | [Machine Issuer Setup](#machine-issuer-setup) |
| Entity that will manage vaults | [Vault Owner Setup](#vault-owner-setup) |

---

## User Onboarding

This guide is for anyone who wants to participate in the RWA Framework as an end user - owning MachineNFTs, holding security tokens, or receiving yield.

### Prerequisites

Before you begin, ensure you have:
- [ ] An EVM-compatible wallet (e.g., MetaMask)
- [ ] PEAQ tokens for transaction fees
- [ ] Access to the peaq network (mainnet or testnet)

### Step 1: Initialize the SDK

Connect to the RWA Framework by initializing the SDK with your provider and target chain.

**What you need:**
- Your wallet's provider connection
- The chain ID for your target network (PEAQ mainnet or AGUNG testnet)

**Result:** An SDK instance with all modules ready to use.

→ See [SDK Initialization](../../../sdk_reference/initialize.md) for implementation details.

---

### Step 2: Create Your Identity

Deploy an ONCHAINID Identity contract linked to your wallet address.

**What you need:**
- Your wallet address
- A unique salt value (any string, can only be used once)

**Process:**
1. Call the identity creation function with your wallet and salt
2. Wait for the transaction to confirm
3. Save the returned Identity contract address

**Result:** An Identity contract deployed and linked to your wallet.

→ See [Create Identity](../../../sdk_reference/identity/createIdentity.md) for implementation details.

---

### Step 3: Get KYC Approved

Obtain a KYC claim from a trusted Claim Issuer in the ecosystem.

**What you need:**
- Your Identity contract address
- Personal information for verification:
  - First name
  - Last name
  - Date of birth (YYYY-MM-DD)
  - Place of birth

**Process:**
1. Contact a trusted Claim Issuer (provided by the framework operator)
2. Submit your Identity address and personal information
3. Complete their verification process
4. Receive the signed claim data

**Result:** A signed KYC claim ready to add to your identity.

---

### Step 4: Add the Claim to Your Identity

Attach the signed KYC claim to your Identity contract.

**What you need:**
- Your Identity contract address
- The claim object from the Claim Issuer
- The signature from the Claim Issuer
- Your wallet (to sign the transaction)

**Process:**
1. Call the add claim function with the claim and signature
2. Wait for the transaction to confirm
3. Verify the claim was added successfully

**Result:** Your identity now has the `CT_KYC_APPROVED` claim, enabling full framework participation.

→ See [Add Claim to Identity](../../../sdk_reference/identity/addClaimToIdentity.md) for implementation details.

---

### Step 5: You're Ready!

With a verified identity, you can now:

| Action | Description |
|--------|-------------|
| **Receive MachineNFTs** | Have machines registered to your address |
| **Transfer MachineNFTs** | Send machines to other verified addresses |
| **Hold Security Tokens** | Own fractional vault shares (after vault registration) |
| **Claim Yield** | Withdraw your share of vault revenues |
| **Create Contracts** | Initiate ContractNFT agreements |

### Next Steps for Users

- Learn about [MachineNFTs](../concepts/#machinenfts) to understand asset ownership
- Explore [Vaults](../concepts/#vaults--security-tokens) for investment opportunities
- Review [Yield Distribution](../concepts/#yield-distribution) to understand returns

---

## Claim Issuer Setup

This guide is for entities that will verify identities and issue claims (KYC and role claims) within the framework.

### Prerequisites

Before you begin, ensure you have:
- [ ] An EVM-compatible wallet
- [ ] PEAQ tokens for deployment and transaction fees
- [ ] Authority to perform identity verification
- [ ] Contact with the Framework Owner for trust listing

### Step 1: Deploy Your ClaimIssuer Contract

Deploy a ClaimIssuer contract that will hold your signing authority.

**What you need:**
- Your wallet address (will be the initial signing key)

**Process:**
1. Deploy the ClaimIssuer contract
2. Save the deployed contract address
3. Optionally add additional signing keys

**Result:** A ClaimIssuer contract under your control.

---

### Step 2: Request Trust from Framework Owner

The Framework Owner must add your ClaimIssuer to the trusted list.

**What you need to provide:**
- Your ClaimIssuer contract address
- The claim topics you want to issue (KYC, issuer roles, regulator roles)
- Your organization's credentials/authorization

**Process:**
1. Contact the Framework Owner
2. Provide your ClaimIssuer address and requested topics
3. Wait for the trust transaction to be executed

**Result:** Your ClaimIssuer is now trusted for the specified claim topics.

---

### Step 3: Issue KYC Claims

Generate and sign KYC claims for users who complete your verification process.

**What you need:**
- User's Identity contract address
- User's verified personal information
- Your ClaimIssuer's signing key

**Process:**
1. User submits their Identity address and information
2. Perform your KYC verification process
3. Generate the claim with topic `CT_KYC_APPROVED`
4. Sign the claim with your authorized key
5. Return the claim and signature to the user

**Result:** User receives a signed claim they can add to their identity.

→ See [Issue KYC Claim](../../../sdk_reference/identity/issueKycClaim.md) for implementation details.

---

### Step 4: Issue Role Claims

Generate and sign role claims for entities that need issuer or regulator authorization.

**What you need:**
- Entity's Identity contract address
- Entity's organization information
- Appropriate claim topic (`CT_MNFT_ISSUER` or `CT_MNFT_REGULATOR`)
- Your ClaimIssuer's signing key

**Process:**
1. Verify the entity's authorization to receive the role
2. Generate the claim with the appropriate topic
3. Sign the claim with your authorized key
4. Return the claim and signature to the entity

**Result:** Entity receives a signed role claim.

→ See [Issue Role Claim](../../../sdk_reference/identity/issueRoleClaim.md) for implementation details.

---

### Claim Issuer Best Practices

| Practice | Description |
|----------|-------------|
| **Secure signing keys** | Use hardware wallets or secure key management |
| **Document verification** | Maintain records of your verification process |
| **Multiple signing keys** | Add backup keys to your ClaimIssuer |
| **Revocation process** | Establish procedures for revoking claims |

---

## Machine Regulator Setup

This guide is for entities that will oversee and authorize Machine Issuers within the framework.

### Prerequisites

Before you begin, ensure you have:
- [ ] An EVM-compatible wallet
- [ ] PEAQ tokens for transaction fees
- [ ] A verified Identity with `CT_KYC_APPROVED` claim
- [ ] Authorization from a Claim Issuer for the regulator role

### Step 1: Complete User Onboarding

If you haven't already, complete the [User Onboarding](#user-onboarding) steps to get a verified identity.

---

### Step 2: Obtain the Regulator Claim

Request a `CT_MNFT_REGULATOR` claim from a trusted Claim Issuer.

**What you need to provide:**
- Your Identity contract address
- Your organization name/description
- Documentation of your authority to regulate

**Process:**
1. Contact a trusted Claim Issuer
2. Provide your Identity address and organization details
3. Complete their verification process
4. Receive the signed role claim
5. Add the claim to your Identity contract

**Result:** Your identity now has the `CT_MNFT_REGULATOR` claim.

---

### Step 3: Get Appointed by Framework Owner

The Framework Owner must add you to the authorized regulators list.

**What you need to provide:**
- Your wallet address
- Proof of your regulator claim

**Process:**
1. Contact the Framework Owner
2. Provide your wallet address
3. Wait for the appointment transaction

**Result:** You are now an authorized Machine Regulator.

---

### Step 4: Authorize Machine Issuers

Add verified entities as Machine Issuers.

**What you need:**
- Machine Issuer's wallet address
- Verification that they have the `CT_MNFT_ISSUER` claim

**Process:**
1. Verify the issuer has the required claim on their identity
2. Call the add machine issuer function
3. A new MachineNft contract is deployed for them
4. Communicate the contract address to the issuer

**Result:** A new Machine Issuer is authorized with their own MachineNft contract.

→ See [RWA NFT SDK Reference](../../../sdk_reference/rwanft/) for implementation details.

---

### Regulator Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Vet issuers** | Verify legitimacy before authorization |
| **Monitor activity** | Watch for suspicious behavior |
| **Report issues** | Alert Framework Owner of problems |
| **Maintain records** | Document all authorizations |

---

## Machine Issuer Setup

This guide is for entities that will register physical machines as MachineNFTs.

### Prerequisites

Before you begin, ensure you have:
- [ ] An EVM-compatible wallet
- [ ] PEAQ tokens for transaction fees
- [ ] A verified Identity with `CT_KYC_APPROVED` claim
- [ ] Authorization from a Claim Issuer for the issuer role

### Step 1: Complete User Onboarding

If you haven't already, complete the [User Onboarding](#user-onboarding) steps to get a verified identity.

---

### Step 2: Obtain the Issuer Claim

Request a `CT_MNFT_ISSUER` claim from a trusted Claim Issuer.

**What you need to provide:**
- Your Identity contract address
- Your organization name/description
- Documentation of your authority to issue

**Process:**
1. Contact a trusted Claim Issuer
2. Provide your Identity address and organization details
3. Complete their verification process
4. Receive the signed role claim
5. Add the claim to your Identity contract

**Result:** Your identity now has the `CT_MNFT_ISSUER` claim.

---

### Step 3: Get Authorized by a Regulator

A Machine Regulator must add you as an authorized issuer.

**What you need to provide:**
- Your wallet address
- Proof of your issuer claim

**Process:**
1. Contact an authorized Machine Regulator
2. Provide your wallet address
3. Wait for the authorization transaction
4. Receive your MachineNft contract address

**Important:** Save your MachineNft contract address - you'll need it for all registrations.

---

### Step 4: Register Your First Machine

Register a physical machine as a MachineNFT.

**What you need:**
- Machine owner's wallet address (can be yours or a customer's)
- Machine value in PEAQ tokens
- Machine information for the DID document:
  - Type (vehicle, equipment, etc.)
  - Manufacturer
  - Model
  - Serial number
  - Additional metadata

**Pre-registration checklist:**
- [ ] Machine owner has a verified identity
- [ ] Machine owner has approved the registration fee
- [ ] You have all machine information

**Process:**
1. Ensure the machine owner has approved the fee
2. Create the DID document with machine information
3. Call the register machine function
4. Wait for the transaction to confirm
5. Provide the token ID to the machine owner

**Result:** A MachineNFT is minted to the owner's address.

→ See [Register Machine](../../../sdk_reference/mnft/registerMachine.md) for implementation details.

---

### Machine Issuer Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   MACHINE REGISTRATION FLOW                     │
│                                                                 │
│  1. Collect machine info from owner                             │
│                    │                                            │
│                    ▼                                            │
│  2. Owner approves registration fee                             │
│                    │                                            │
│                    ▼                                            │
│  3. Verify owner's identity is valid                            │
│                    │                                            │
│                    ▼                                            │
│  4. Create DID document                                         │
│                    │                                            │
│                    ▼                                            │
│  5. Call registerMachine()                                      │
│                    │                                            │
│                    ▼                                            │
│  6. MachineNFT minted to owner                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Vault Owner Setup

This guide is for entities that will manage vaults, security tokens, and yield distribution.

### Prerequisites

Before you begin, ensure you have:
- [ ] An EVM-compatible wallet
- [ ] PEAQ tokens for transaction fees
- [ ] Contact with the Framework Owner
- [ ] MachineNFTs or ContractNFTs to deposit

### Step 1: Request Vault Creation

The Framework Owner creates vaults through the VaultFactory.

**What you need to provide:**
- Your wallet address (will receive vault ownership)
- Token name for the security token
- Token symbol
- Payout asset address (e.g., USDC, PEAQ)
- KYC requirements (optional)
- Compliance modules (optional)

**Process:**
1. Contact the Framework Owner
2. Provide your requirements
3. Wait for the vault creation transaction
4. Receive addresses for:
   - Vault contract
   - Security token contract
   - Reward distributor contract

**Result:** You now own a vault ready for configuration.

---

### Step 2: Configure the Vault

Set up which NFT collections can be deposited.

**What you need:**
- Your vault contract address
- MachineNft contract addresses to accept
- ContractNft contract addresses to accept (if any)

**Process:**
1. Call configuration functions to whitelist NFT collections
2. Verify the configuration is correct

**Result:** Your vault is ready to accept deposits.

---

### Step 3: Register Token Holders

Before addresses can hold security tokens, they must be registered in the identity registry.

**What you need:**
- Holder's wallet address
- Holder's Identity contract address
- Verification that they have a KYC claim

**Process:**
1. Verify the holder has a valid identity with KYC claim
2. Call the register identity function
3. Wait for confirmation

**Result:** The address can now receive security tokens.

→ See [Register Identity](../../../sdk_reference/vault/registerIdentity.md) for implementation details.

---

### Step 4: Deposit NFTs and Mint Tokens

Lock NFTs in the vault and mint security tokens.

**What you need:**
- NFT contract addresses
- NFT token IDs
- Amount of security tokens to mint

**Pre-deposit checklist:**
- [ ] NFTs are approved for transfer to the vault
- [ ] Recipient is registered in identity registry

**Process:**
1. Approve NFT transfers to the vault
2. Call depositAndMint with NFTs and mint amount
3. Security tokens are minted to the depositor

**Important:** This operation can only happen once per vault.

**Result:** NFTs are locked, security tokens are minted.

→ See [Deposit and Mint](../../../sdk_reference/vault/depositAndMint.md) for implementation details.

---

### Step 5: Manage Yield Distribution

Deposit yield and enable claims for token holders.

**Depositing yield:**
1. Obtain yield revenue in the payout asset
2. Approve the payout asset transfer
3. Call deposit yield function

**Enabling claims:**
- Token holders can claim their proportional share anytime
- Claims can be to their wallet or a specified recipient

→ See [Vault SDK Reference](../../../sdk_reference/vault/) for yield operations.

---

### Vault Owner Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VAULT MANAGEMENT FLOW                        │
│                                                                 │
│  SETUP PHASE                                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                      │
│  │ Create  │───▶│Configure│───▶│Register │                      │
│  │ Vault   │    │  NFTs   │    │ Holders │                      │
│  └─────────┘    └─────────┘    └─────────┘                      │
│                                     │                           │
│                                     ▼                           │
│  OPERATION PHASE               ┌─────────┐                      │
│                                │ Deposit │                      │
│                                │ & Mint  │                      │
│                                └─────────┘                      │
│                                     │                           │
│                                     ▼                           │
│  ONGOING                       ┌─────────┐    ┌─────────┐       │
│                                │ Deposit │───▶│ Holders │       │
│                                │  Yield  │    │  Claim  │       │
│                                └─────────┘    └─────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: SDK Functions by Role

| Role | Key Functions |
|------|---------------|
| **User** | `createIdentity`, `addClaimToIdentity`, `claim`, `transfer` |
| **Claim Issuer** | `issueKycClaim`, `issueRoleClaim` |
| **Machine Regulator** | `addMachineIssuer`, `removeMachineIssuer` |
| **Machine Issuer** | `ensureMachineNftAllowance`, `registerMachine`, `getMachineDid` |
| **Vault Owner** | `registerIdentity`, `depositAndMint`, `depositYield`, `pauseToken`, `unpauseToken` |

---

## Troubleshooting

### Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| "Identity not found" | Identity not created | Complete Step 2 of User Onboarding |
| "Not KYC approved" | Missing KYC claim | Complete Steps 3-4 of User Onboarding |
| "Insufficient allowance" | Fee not approved | Approve the required fee amount |
| "Not authorized" | Missing role claim | Obtain the required role claim |
| "Transfer blocked" | Token paused or blocked | Contact Framework Owner |

### Getting Help

- Review the [Core Concepts](../concepts/) for understanding
- Check the [SDK Reference](../../../sdk_reference/) for function details
- Contact the Framework Owner for ecosystem-specific questions

---

## Next Steps

- **[Introduction](../introduction.md)** - Return to framework overview
- **[Roles & Responsibilities](../roles/)** - Detailed role documentation
- **[Core Concepts](../concepts/)** - Deep dive into concepts
- **[SDK Reference](../../../sdk_reference/)** - Complete API documentation
