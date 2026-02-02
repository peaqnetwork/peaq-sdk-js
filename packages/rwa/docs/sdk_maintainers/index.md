# SDK Maintainer Documentation

This documentation is for developers who maintain or deploy the peaq RWA SDK and underlying smart contract framework.

> **Looking to use the SDK?** See the [User Documentation](../users/introduction.md) and [SDK Reference](../../sdk_reference/) instead.

## Guides

| Guide | Description |
|-------|-------------|
| [Deploy Framework](./deployFramework.md) | Deploy the RWA framework from scratch |
| [Update Framework](./updateFramework.md) | Update an existing deployment |
| [Test Setup](./tests/initialize.md) | Configure integration tests |

---

## Deployment Overview

The RWA framework consists of multiple interconnected smart contracts that must be deployed in a specific order:

```
1. ProxyAdmin           ← Manages upgradeable contracts
2. InfoDesk             ← Central configuration hub
3. ONCHAINID contracts  ← Identity infrastructure
4. T-REX contracts      ← Security token infrastructure
5. PeaqRwaNft           ← Machine NFT factory
6. PeaqVaultFactory     ← Vault factory
```

See [Deploy Framework](./deployFramework.md) for complete instructions.

---

## Post-Deployment Tasks

After deploying the framework:

1. **Update ABIs** - Copy interface files to `./src/abis/`
2. **Update Addresses** - Configure `./src/addresses/` with deployed contract addresses
3. **Regenerate TypeChain** - Run `npm run codegen`
4. **Update Environment** - Set Claim Issuer and Admin addresses in `.env`

---

## Reference Files

| File | Purpose |
|------|---------|
| [log_example.txt](./log_example.txt) | Sample deployment output |
| [tests/initialize.md](./tests/initialize.md) | Test environment configuration |

---

## Related Documentation

- [User Documentation](../users/introduction.md) - Framework concepts
- [SDK Reference](../../sdk_reference/) - API documentation
- [README](../../README.md) - Project overview

---

[← Back to Documentation Hub](../index.md)
