# Introduction to the peaq RWA SDK

## What is the peaq RWA Framework?
Brief paragraph + reference to `overview.png`
- Fractionalized machine ownership as security tokens
- TREX compliance framework on peaq EVM

## SDK Architecture Overview
[SDK Flow Diagram](./RWA-V2.svg)
- Initialize SDK → RWA instance with chainId + provider
- Modules available: onchainid, mnft, cnft, & vault
- Flow: User calls module methods → SDK handles smart contract interactions

## Core Modules at a Glance

### OnChainID Module (`sdk.onchainid`)
Purpose: Identity creation, KYC claims, claim management
Functions (high-level descriptions, no code):
- Create/retrieve user identities
- Issue and add KYC claims
- Remove claims
→ Link to [sdk_reference/identity/](./sdk_reference/identity/)

### Machine NFT Module (`sdk.mnft`)
Purpose: Issue and manage Machine NFTs representing physical assets
Functions:
- Ensure registration fee allowances
- Issue Machine NFTs with embedded DID documents
→ Reference `peaq-rwa-nft.png` briefly
→ Link to [sdk_reference/mnft/](./sdk_reference/mnft/)

### Vault Module (`sdk.vault`)
Purpose: Fractionalized ownership via security tokens
Functions:
- Create vaults for machines
- Register identities in vault registry
- Deposit machines and mint fractional tokens
- Yield management
→ Reference `peaq-vault.png` briefly
→ Link to [sdk_reference/vault/](./sdk_reference/vault/)

### Contract NFT Module (`sdk.cnft`)
Purpose: Multi-party contracts between machines/users
Functions:
- Create and sign contracts
→ Link to [sdk_reference/cnft/](./sdk_reference/cnft/)

## Roles in the Ecosystem
Brief descriptions pulling from existing docs:
- Framework Owner / Admin
- Claim Issuers
- Machine Issuers / Regulators
- Users / Investors
→ Link to detailed roles section (Section 2)

## Next Steps
- [Roles & Responsibilities](./roles/)
- [Getting Started Guide](./guides/)
- [SDK Reference](../sdk_reference/)