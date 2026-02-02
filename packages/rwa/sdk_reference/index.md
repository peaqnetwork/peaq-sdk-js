# SDK Reference

Complete API documentation for the peaq RWA SDK. This reference provides function signatures, parameters, return types, and code examples.

> **New to the framework?** Start with the [User Documentation](../docs/users/introduction.md) to understand the concepts before diving into the API.

## Quick Navigation

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| [Initialization](./initialize.md) | SDK setup | `new RWA()` |
| [Identity](./identity/) | Identity & claims | `createIdentity`, `issueKycClaim`, `addClaimToIdentity` |
| [Machine NFT](./mnft/) | Machine registration | `ensureMachineNftAllowance`, `registerMachine`, `getMachineDid` |
| [Vault](./vault/) | Vaults & tokens | `createVault`, `registerIdentity`, `depositAndMint`, `claim` |

---

## Getting Started

### Installation

```bash
npm install @peaq-network/rwa
```

### Initialization

```typescript
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://peaq.api.onfinality.io/public');
const sdk = new RWA({ chainId: Chain.PEAQ, provider });
```

→ See [Initialization](./initialize.md) for complete setup instructions.

---

## Modules

### Identity Module (`sdk.onchainid`)

Manage ONCHAINID identities and claims for KYC compliance.

| Function | Description |
|----------|-------------|
| [createIdentity](./identity/createIdentity.md) | Deploy a new Identity contract |
| [getIdentity](./identity/getIdentity.md) | Retrieve an existing Identity address |
| [issueKycClaim](./identity/issueKycClaim.md) | Generate a signed KYC claim |
| [addClaimToIdentity](./identity/addClaimToIdentity.md) | Add a signed claim to an Identity |
| [getClaim](./identity/getClaim.md) | Retrieve a claim from an Identity |
| [removeClaimFromIdentity](./identity/removeClaimFromIdentity.md) | Remove a claim from an Identity |

---

### Machine NFT Module (`sdk.mnft`)

Register physical machines as NFTs with embedded DID documents.

| Function | Description |
|----------|-------------|
| [ensureMachineNftAllowance](./mnft/registerMachineNft.md) | Verify/approve registration fee allowance |
| [registerMachine](./mnft/registerMachineNft.md) | Mint a MachineNFT for a machine |
| getMachineDid | Read the DID document from a MachineNFT |

---

### Vault Module (`sdk.vault`)

Create vaults, fractionalize assets, and manage yield distribution.

| Function | Description |
|----------|-------------|
| [createVaultAndToken](./vault/createVaultAndToken.md) | Deploy a new vault with security token |
| [unpauseToken](./vault/unpauseToken.md) | Enable token transfers |
| [registerIdentity](./vault/registerIdentity.md) | Add an identity to the vault registry |
| [mintSecurityTokens](./vault/mintSecurityTokens.md) | Mint tokens for deposited assets |
| [transfer](./vault/transfer.md) | Transfer security tokens |
| depositYield | Deposit revenue for distribution |
| claim | Claim accumulated yield |

---

### Contract NFT Module (`sdk.cnft`)

Create and manage multi-party contractual agreements.

| Function | Description |
|----------|-------------|
| createContract | Initialize a new contract with counterparties |
| signContract | Sign a contract as a counterparty |
| cancelContract | Cancel a contract draft |
| getDraft | Retrieve contract draft details |

---

## Workflows

Example implementations showing complete flows:

| Workflow | Description |
|----------|-------------|
| [Common Flow](./workflows/common_flow.md) | Basic SDK usage pattern |
| [Common Flow V2](./workflows/common_flow_v2.md) | Updated workflow pattern |
| [Machine Issuer Flow](./workflows/machine_issuer_flow.md) | Machine registration workflow |

---

## SDK Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        RWA SDK                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  onchainid  │ │    mnft     │ │    cnft     │            │
│  │  (Identity) │ │ (Machines)  │ │ (Contracts) │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐                            │
│  │    vault    │ │   rwanft    │                            │
│  │  (Tokens)   │ │  (Factory)  │                            │
│  └─────────────┘ └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

**Read operations:** Use the `provider` passed at initialization
**Write operations:** Require a `Signer` passed to each function

---

## Supported Networks

| Network | Chain ID | Enum |
|---------|----------|------|
| PEAQ Mainnet | 3338 | `Chain.PEAQ` |
| AGUNG Testnet | 9990 | `Chain.AGUNG` |

---

## Additional Resources

- [User Documentation](../docs/users/introduction.md) - Conceptual guides
- [Maintainer Documentation](../docs/sdk_maintainers/) - Deployment guides
- [README](../README.md) - Project overview

---

[← Back to README](../README.md)
