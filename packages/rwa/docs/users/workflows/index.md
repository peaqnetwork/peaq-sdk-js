# End-to-End Workflows

This document presents complete workflows that show how multiple participants interact to accomplish real-world use cases in the peaq RWA Framework. Each workflow spans multiple roles and demonstrates the full lifecycle of key operations.

## Available Workflows

| Workflow | Description | Roles Involved |
|----------|-------------|----------------|
| [Machine to Market](#workflow-1-machine-to-market) | From physical machine to tradeable NFT | Issuer, Regulator, Owner |
| [Fractionalization](#workflow-2-fractionalization) | From NFT ownership to security tokens | Vault Owner, Token Holders |
| [Investment Cycle](#workflow-3-investment-cycle) | From investment to yield collection | Investor, Vault Owner |
| [Multi-Party Contract](#workflow-4-multi-party-contract) | Creating and signing ContractNFTs | Initiator, Counterparties |
| [Complete Asset Lifecycle](#workflow-5-complete-asset-lifecycle) | End-to-end from machine to yield | All roles |

---

## Workflow 1: Machine to Market

This workflow covers the complete journey from a physical machine to a tradeable MachineNFT on the blockchain.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MACHINE TO MARKET WORKFLOW                         │
│                                                                         │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │Framework│   │ Claim   │   │Machine  │   │Machine  │   │ Machine │    │
│  │ Owner   │──▶│ Issuer  │──▶│Regulator│──▶│ Issuer  │──▶│  Owner  │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│       │             │             │             │             │         │
│       ▼             ▼             ▼             ▼             ▼         │
│    Trust         Issue         Authorize    Register      Receive       │
│    Issuer        Claims        Issuer       Machine       NFT           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Ecosystem Setup (One-time)

**Participants:** Framework Owner, Claim Issuer

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1.1 | Framework Owner | Trust a Claim Issuer for KYC and role claims | Claim Issuer can issue recognized claims |

---

### Phase 2: Role Authorization

**Participants:** Claim Issuer, Machine Regulator, Machine Issuer

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 2.1 | Regulator | Create identity and get KYC claim | Regulator has verified identity |
| 2.2 | Claim Issuer | Issue `CT_MNFT_REGULATOR` claim | Regulator has role claim |
| 2.3 | Regulator | Add claim to identity | Regulator identity is complete |
| 2.4 | Framework Owner | Appoint regulator | Regulator can authorize issuers |
| 2.5 | Issuer | Create identity and get KYC claim | Issuer has verified identity |
| 2.6 | Claim Issuer | Issue `CT_MNFT_ISSUER` claim | Issuer has role claim |
| 2.7 | Issuer | Add claim to identity | Issuer identity is complete |
| 2.8 | Regulator | Authorize issuer | MachineNft contract deployed for issuer |

---

### Phase 3: Machine Owner Onboarding

**Participants:** Claim Issuer, Machine Owner

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 3.1 | Owner | Create identity | Identity contract deployed |
| 3.2 | Owner | Submit KYC information to Claim Issuer | Verification begins |
| 3.3 | Claim Issuer | Verify and issue `CT_KYC_APPROVED` claim | Signed claim created |
| 3.4 | Owner | Add claim to identity | Owner can participate in framework |

---

### Phase 4: Machine Registration

**Participants:** Machine Issuer, Machine Owner

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 4.1 | Issuer | Collect machine information | DID document data ready |
| 4.2 | Owner | Approve registration fee | ERC-20 allowance set |
| 4.3 | Issuer | Ensure allowance is sufficient | Fee verified |
| 4.4 | Issuer | Register machine with DID | MachineNFT minted |
| 4.5 | Owner | Receive MachineNFT | Owner holds tokenized asset |

---

### Phase 5: Trading (Optional)

**Participants:** Machine Owner, Buyer

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 5.1 | Buyer | Complete onboarding (identity + KYC) | Buyer can receive NFTs |
| 5.2 | Owner | Approve transfer fee | Transfer enabled |
| 5.3 | Owner | Transfer MachineNFT to buyer | Ownership transferred |

---

### Key Checkpoints

| Checkpoint | Verification |
|------------|--------------|
| Issuer authorized | Has MachineNft contract address |
| Owner verified | Has identity with KYC claim |
| Fee approved | Allowance >= registration fee |
| NFT minted | Token ID returned from registration |

→ See [Machine NFT SDK Reference](../../../sdk_reference/mnft/) for implementation details.

---

## Workflow 2: Fractionalization

This workflow covers converting MachineNFTs into tradeable security tokens through vault fractionalization.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRACTIONALIZATION WORKFLOW                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         VAULT CREATION                          │    │
│  │  Framework Owner creates vault for Asset Owner                  │    │
│  │  → Vault, Token, and Reward Distributor deployed                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      IDENTITY REGISTRATION                      │    │
│  │  Vault Owner registers verified holders in identity registry    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       DEPOSIT & MINT                            │    │
│  │  Asset Owner deposits NFTs → Receives security tokens           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      TOKEN DISTRIBUTION                         │    │
│  │  Token holder can transfer to other registered holders          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Vault Creation

**Participants:** Framework Owner, Future Vault Owner

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1.1 | Vault Owner | Request vault from Framework Owner | Requirements submitted |
| 1.2 | Framework Owner | Create vault with token details | Vault, token, distributor deployed |
| 1.3 | Framework Owner | Transfer vault ownership | Vault Owner has control |

**Vault creation parameters:**
- Token name and symbol
- Payout asset (USDC, PEAQ, etc.)
- KYC requirements
- Compliance modules

---

### Phase 2: Vault Configuration

**Participants:** Vault Owner

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 2.1 | Vault Owner | Whitelist MachineNft contracts | Vault accepts specific NFTs |
| 2.2 | Vault Owner | Whitelist ContractNft contracts (if any) | Contracts can be deposited |
| 2.3 | Vault Owner | Verify configuration | Vault ready for deposits |

---

### Phase 3: Holder Registration

**Participants:** Vault Owner, Token Holders

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 3.1 | Holder | Ensure identity has KYC claim | Verification ready |
| 3.2 | Vault Owner | Verify holder's identity | Compliance confirmed |
| 3.3 | Vault Owner | Register holder in identity registry | Holder can receive tokens |

**Important:** All intended token holders must be registered before they can receive tokens.

---

### Phase 4: Deposit and Mint

**Participants:** Asset Owner (Vault Owner or designated depositor)

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 4.1 | Asset Owner | Approve NFT transfers to vault | Vault can receive NFTs |
| 4.2 | Asset Owner | Verify depositor is registered | Compliance check |
| 4.3 | Asset Owner | Call depositAndMint | NFTs locked, tokens minted |
| 4.4 | Asset Owner | Receive security tokens | Fractional ownership established |

**Note:** This operation can only be performed once per vault.

---

### Phase 5: Token Distribution

**Participants:** Token Holder, Recipient

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 5.1 | Recipient | Complete identity registration in vault | Can receive tokens |
| 5.2 | Holder | Approve transfer fee | Transfer enabled |
| 5.3 | Holder | Transfer tokens to recipient | Ownership transferred |

---

### Fractionalization Economics

| Aspect | Description |
|--------|-------------|
| **Token supply** | Determined at mint time |
| **Ownership ratio** | Tokens held / total supply |
| **Yield entitlement** | Proportional to token holdings |
| **Transfer restrictions** | Only between registered holders |

→ See [Vault SDK Reference](../../../sdk_reference/vault/) for implementation details.

---

## Workflow 3: Investment Cycle

This workflow covers the complete investment lifecycle from purchasing security tokens to claiming yield.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       INVESTMENT CYCLE WORKFLOW                         │
│                                                                         │
│  INVESTOR ONBOARDING          YIELD GENERATION          YIELD CLAIM     │
│  ┌─────────────────┐         ┌─────────────────┐      ┌─────────────┐   │
│  │ Create Identity │         │ Machine Revenue │      │ Call claim()│   │
│  │ Get KYC Claim   │         │ (Off-chain)     │      │             │   │
│  │ Register in     │         └────────┬────────┘      └──────┬──────┘   │
│  │ Vault Registry  │                  │                      │          │
│  └────────┬────────┘                  ▼                      ▼          │
│           │                 ┌─────────────────┐      ┌─────────────┐    │
│           ▼                 │ Deposit Yield   │      │ Receive     │    │
│  ┌─────────────────┐        │ to Vault        │      │ Payout      │    │
│  │ Receive/Buy     │        └─────────────────┘      │ Asset       │    │
│  │ Security Tokens │                                 └─────────────┘    │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Investor Onboarding

**Participants:** Investor, Claim Issuer, Vault Owner

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1.1 | Investor | Create identity | Identity contract deployed |
| 1.2 | Investor | Complete KYC with Claim Issuer | Signed claim received |
| 1.3 | Investor | Add claim to identity | Identity verified |
| 1.4 | Vault Owner | Register investor in vault's identity registry | Investor can hold tokens |

---

### Phase 2: Token Acquisition

**Participants:** Investor, Token Seller

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 2.1 | Seller | Approve transfer fee | Transfer enabled |
| 2.2 | Seller | Transfer tokens to investor | Investor holds tokens |
| 2.3 | Investor | Verify token balance | Ownership confirmed |

---

### Phase 3: Yield Generation

**Participants:** Machine Operator, Anyone

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 3.1 | Operator | Generate revenue from machine operations | Off-chain value created |
| 3.2 | Operator | Convert revenue to payout asset | Yield ready for deposit |
| 3.3 | Operator | Approve payout asset transfer | Vault can receive yield |
| 3.4 | Anyone | Deposit yield to vault | Yield allocated to holders |

**Note:** Anyone can deposit yield - this enables automated systems or third parties to contribute.

---

### Phase 4: Yield Claiming

**Participants:** Investor

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 4.1 | Investor | Check accumulated yield | View pending rewards |
| 4.2 | Investor | Call claim() or claimTo() | Yield transferred |
| 4.3 | Investor | Receive payout asset | Funds in wallet |

---

### Investment Timeline Example

```
Time ─────────────────────────────────────────────────────────────────▶

Day 1          Day 30         Day 60         Day 90
  │              │              │              │
  ▼              ▼              ▼              ▼
┌────┐        ┌────┐        ┌────┐        ┌────┐
│Buy │        │Yield│       │Yield│       │Claim│
│1000│        │Dep 1│       │Dep 2│       │All  │
│tkns│        │$500 │       │$500 │       │     │
└────┘        └────┘        └────┘        └────┘
                                              │
                                              ▼
                                    Investor receives
                                    proportional share
                                    (e.g., 10% = $100)
```

---

### Yield Calculation

| Factor | Description |
|--------|-------------|
| **Your tokens** | Number of security tokens you hold |
| **Total supply** | Total tokens minted for the vault |
| **Your share** | Your tokens / Total supply |
| **Your yield** | Total deposited yield × Your share |

→ See [Vault SDK Reference](../../../sdk_reference/vault/) for yield operations.

---

## Workflow 4: Multi-Party Contract

This workflow covers creating and signing ContractNFTs with multiple parties.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-PARTY CONTRACT WORKFLOW                        │
│                                                                         │
│     INITIATOR                COUNTERPARTIES              RESULT         │
│  ┌─────────────┐         ┌─────────────────┐       ┌─────────────┐      │
│  │ Prepare     │         │                 │       │             │      │
│  │ Document    │         │  Verify Draft   │       │  Contract   │      │
│  │             │         │                 │       │  NFT Minted │      │
│  └──────┬──────┘         └────────┬────────┘       │  to         │      │
│         │                         │                │  Initiator  │      │
│         ▼                        │                  └─────────────┘     │
│  ┌─────────────┐                │                         ▲             │
│  │ Create &    │                │                         │             │
│  │ Sign First  │────────────────┤                         │             │
│  └─────────────┘                │                         │             │
│                                 ▼                         │             │
│                          ┌─────────────┐                  │             │
│                          │ Each Party  │──────────────────┘             │
│                          │ Signs       │   (When all signed)            │
│                          └─────────────┘                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Document Preparation

**Participants:** Initiator

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1.1 | Initiator | Draft the contract document | Document ready |
| 1.2 | Initiator | Upload to permanent storage (e.g., IPFS) | URL available |
| 1.3 | Initiator | Compute hash of document | Hash digest ready |
| 1.4 | Initiator | Identify all counterparties | Address list ready |

---

### Phase 2: Contract Creation

**Participants:** Initiator

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 2.1 | Initiator | Approve setup fee | Fee ready |
| 2.2 | Initiator | Create contract with counterparties, hash, URL | Contract in draft state |
| 2.3 | Initiator | Sign as first party | Initiator signature recorded |
| 2.4 | System | Emit contract ID | All parties notified |

---

### Phase 3: Counterparty Verification

**Participants:** Each Counterparty

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 3.1 | Counterparty | Retrieve document from URL | Document obtained |
| 3.2 | Counterparty | Compute hash of retrieved document | Hash calculated |
| 3.3 | Counterparty | Compare with on-chain hash | Integrity verified |
| 3.4 | Counterparty | Review contract terms | Ready to sign |

---

### Phase 4: Signing

**Participants:** Each Counterparty

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 4.1 | Counterparty | Sign contract | Signature recorded |
| 4.2 | System | Check if all parties signed | Status updated |
| 4.3 | System | (If complete) Mint ContractNFT | NFT to initiator |

---

### Phase 5: Completion

**Participants:** Initiator, All Parties

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 5.1 | All | Contract is finalized | Binding agreement |
| 5.2 | Initiator | Receive ContractNFT | Proof of agreement |
| 5.3 | Anyone | Verify contract on-chain | Transparency |

---

### Contract States

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| **Draft** | Not all parties have signed | Sign, Cancel |
| **Final** | All parties have signed | Verify |
| **Cancelled** | Initiator cancelled before completion | None |

---

### Cancellation (Draft Only)

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1 | Initiator | Cancel contract | Draft removed |
| 2 | System | Contract no longer valid | Counterparties notified |

**Note:** Only the initiator can cancel, and only while in draft state.

→ See [Contract NFT SDK Reference](../../../sdk_reference/cnft/) for implementation details.

---

## Workflow 5: Complete Asset Lifecycle

This comprehensive workflow shows the entire journey from physical machine to investor yield distribution.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE ASSET LIFECYCLE                             │
│                                                                         │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ MACHINE │──▶│MACHINE  │──▶│  VAULT  │──▶│SECURITY │──▶│  YIELD  │    │
│  │         │   │   NFT   │   │         │   │ TOKENS  │   │         │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                                         │
│  Physical      Tokenized     Packaged &    Fractionalized   Revenue     │
│  Asset         on-chain      Locked        Ownership        Distribution│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stage 1: Machine Tokenization

**Goal:** Physical machine becomes a tradeable MachineNFT

| Participant | Actions |
|-------------|---------|
| Machine Owner | Onboard (identity + KYC), approve fee |
| Machine Issuer | Collect info, create DID, register machine |
| Result | MachineNFT in owner's wallet |

**Duration:** 1-2 days (depending on KYC)

---

### Stage 2: Vault Setup

**Goal:** Create infrastructure for fractionalization

| Participant | Actions |
|-------------|---------|
| Asset Owner | Request vault creation |
| Framework Owner | Deploy vault, token, distributor |
| Vault Owner | Configure accepted NFTs |
| Result | Vault ready for deposits |

**Duration:** Same day

---

### Stage 3: Fractionalization

**Goal:** Convert MachineNFT ownership to security tokens

| Participant | Actions |
|-------------|---------|
| Vault Owner | Register asset owner in identity registry |
| Asset Owner | Approve NFT transfer, call depositAndMint |
| Result | NFT locked, security tokens minted |

**Duration:** Same day

---

### Stage 4: Token Distribution

**Goal:** Distribute ownership to investors

| Participant | Actions |
|-------------|---------|
| Investors | Onboard (identity + KYC) |
| Vault Owner | Register investors in identity registry |
| Token Holder | Transfer tokens to investors |
| Result | Multiple investors hold fractional ownership |

**Duration:** 1-7 days (investor onboarding)

---

### Stage 5: Operations & Yield

**Goal:** Ongoing revenue generation and distribution

| Participant | Actions |
|-------------|---------|
| Machine Operator | Generate revenue from machine |
| Anyone | Deposit yield to vault |
| Investors | Claim proportional yield |
| Result | Passive income for investors |

**Duration:** Ongoing

---

### Complete Timeline

```
Week 1                    Week 2                    Ongoing
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐
│ Machine Registration │ │ Vault & Distribution │ │ Operations       │
│ - Owner onboarding   │ │ - Vault creation     │ │ - Revenue gen    │
│ - DID creation       │ │ - NFT deposit        │ │ - Yield deposit  │
│ - NFT minting        │ │ - Token minting      │ │ - Investor claims│
│                      │ │ - Investor onboard   │ │                  │
│                      │ │ - Token distribution │ │                  │
└──────────────────────┘ └──────────────────────┘ └──────────────────┘
```

---

### Success Metrics

| Stage | Success Indicator |
|-------|-------------------|
| Tokenization | MachineNFT token ID assigned |
| Vault Setup | Vault, token, distributor addresses |
| Fractionalization | Security token balance > 0 |
| Distribution | Multiple holder addresses |
| Yield | Positive claim amounts |

---

## Workflow Comparison

| Workflow | Complexity | Roles Involved | Time to Complete |
|----------|------------|----------------|------------------|
| Machine to Market | Medium | 4-5 | 1-2 days |
| Fractionalization | Medium | 2-3 | Same day |
| Investment Cycle | Low | 2-3 | Ongoing |
| Multi-Party Contract | Medium | 2+ | 1-7 days |
| Complete Lifecycle | High | All | 2+ weeks |

---

## Next Steps

- **[Introduction](../introduction.md)** - Return to framework overview
- **[Roles & Responsibilities](../roles/)** - Detailed role documentation
- **[Core Concepts](../concepts/)** - Deep dive into concepts
- **[Getting Started Guides](../guides/)** - Step-by-step instructions
- **[SDK Reference](../../../sdk_reference/)** - Complete API documentation
