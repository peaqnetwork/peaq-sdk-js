# peaq RWA SDK

The **peaq Real World Asset (RWA) SDK** enables the tokenization of physical assets on the peaq network. It provides a TypeScript/JavaScript interface for creating compliant security tokens that represent fractionalized ownership of machines and equipment.

## What This SDK Does

- **Tokenize machines** as NFTs with embedded DID documents
- **Fractionalize ownership** into T-REX (ERC-3643) compliant security tokens
- **Manage compliance** through on-chain KYC via ONCHAINID
- **Distribute yield** automatically to token holders


## Documentation

| Section | Description | Audience |
|---------|-------------|----------|
| **[Learn the Framework](./docs/users/introduction.md)** | Understand the RWA ecosystem, roles, and concepts | Everyone |
| **[SDK Reference](./sdk_reference/initialize.md)** | API documentation with code examples | Developers |
| **[Maintainer Guide](./docs/sdk_maintainers/deployFramework.md)** | Deploy and update the framework | SDK Maintainers |

### Educational Documentation

New to the framework? Start here:

| Guide | What You'll Learn |
|-------|-------------------|
| [Introduction](./docs/users/introduction.md) | Framework overview and SDK architecture |
| [Roles & Responsibilities](./docs/users/roles/index.md) | Framework Owner, Claim Issuers, Machine Issuers, Users |
| [Core Concepts](./docs/users/concepts/index.md) | Identity, Claims, MachineNFTs, Vaults, Security Tokens |
| [Getting Started](./docs/users/guides/index.md) | Step-by-step guides for your specific role |
| [End-to-End Workflows](./docs/users/workflows/index.md) | Complete scenarios from machine to yield |

### SDK Reference

Ready to code? Implementation details here:

| Module | Purpose |
|--------|---------|
| [Initialization](./sdk_reference/initialize.md) | SDK setup and configuration |
| [Identity](./sdk_reference/identity/) | Create identities, issue and manage claims |
| [Machine NFT](./sdk_reference/mnft/) | Register machines, read DID documents |
| [Vault](./sdk_reference/vault/) | Create vaults, mint tokens, manage yield |

## Roles Overview

The framework defines specific roles with different capabilities:

| Role | Description | Required Claim |
|------|-------------|----------------|
| **Framework Owner** | Administers ecosystem, creates vaults | Admin access |
| **Claim Issuer** | Issues KYC and role claims | Trusted by Framework Owner |
| **Machine Regulator** | Approves machine issuers | `CT_MNFT_REGULATOR` |
| **Machine Issuer** | Registers machines as NFTs | `CT_MNFT_ISSUER` |
| **User / Investor** | Owns assets, holds tokens | `CT_KYC_APPROVED` |

**Want to participate?** Contact **peaq (the Implementation Authority)** for onboarding.

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| PEAQ Mainnet | 3338 | Production |
| AGUNG Testnet | 9990 | Testing |

## External Resources

- [T-REX Whitepaper](https://cdn.prod.website-files.com/63d7968e79bf1252d92c981f/64c0f2c72ea4fb62e1c838e6_Whitepaper%20-%20T-REX%20v4%20-%20Security%20tokens.pdf) - Security token standard
- [ONCHAINID](https://github.com/onchain-id/solidity) - Decentralized identity protocol
- [ERC-3643](https://github.com/ERC-3643/ERC-3643) - T-REX token standard
- [peaq-rwa-evm](https://github.com/peaqnetwork/peaq-rwa-evm/tree/dev) - Smart contract repository

