# Documentation Hub

Welcome to the peaq RWA SDK documentation. This hub helps you find the right documentation for your needs.

## Choose Your Path

### 📘 I want to learn about the framework

Start with the **[User Documentation](./users/introduction.md)** to understand:
- What the RWA framework does
- How the different roles interact
- Core concepts like identity, claims, and vaults

**Documentation sections:**

| Section | Description |
|---------|-------------|
| [Introduction](./users/introduction.md) | Framework overview and SDK architecture |
| [Roles & Responsibilities](./users/roles/index.md) | Detailed guide for each participant role |
| [Core Concepts](./users/concepts/index.md) | Deep dives into identity, claims, NFTs, vaults |
| [Getting Started Guides](./users/guides/index.md) | Step-by-step instructions for your role |
| [End-to-End Workflows](./users/workflows/index.md) | Complete scenarios from start to finish |

---

### 💻 I want to build with the SDK

Head to the **[SDK Reference](../sdk_reference/initialize.md)** for API documentation:
- Installation and setup
- Function signatures and parameters
- Code examples in TypeScript and JavaScript

**Quick links:**

| Module | Purpose |
|--------|---------|
| [Initialization](../sdk_reference/initialize.md) | SDK setup and configuration |
| [Identity](../sdk_reference/identity/) | Create identities, issue claims |
| [Machine NFT](../sdk_reference/mnft/) | Register machines as NFTs |
| [Vault](../sdk_reference/vault/) | Create vaults, mint tokens, manage yield |

---

### 🔧 I maintain or deploy the SDK

See the **[Maintainer Documentation](./sdk_maintainers/deployFramework.md)** for:
- Deploying the RWA framework
- Updating contract addresses
- Configuring the SDK

**Maintainer guides:**

| Guide | Description |
|-------|-------------|
| [Deploy Framework](./sdk_maintainers/deployFramework.md) | Initial framework deployment |
| [Update Framework](./sdk_maintainers/updateFramework.md) | Updating existing deployments |
| [Test Setup](./sdk_maintainers/tests/initialize.md) | Setting up integration tests |

---

## Documentation Map

```
docs/
├── index.md                    ← You are here
├── users/                      ← Educational documentation
│   ├── introduction.md         ← Start here for framework overview
│   ├── roles/                  ← Role-specific documentation
│   ├── concepts/               ← Core concept deep dives
│   ├── guides/                 ← Step-by-step guides
│   └── workflows/              ← End-to-end scenarios
└── sdk_maintainers/            ← Maintainer documentation
    ├── deployFramework.md      ← Initial deployment
    ├── updateFramework.md      ← Updates and upgrades
    └── tests/                  ← Test configuration

sdk_reference/                  ← API documentation
├── initialize.md               ← SDK setup
├── identity/                   ← Identity & claims
├── mnft/                       ← Machine NFTs
├── vault/                      ← Vaults & tokens
└── workflows/                  ← Example workflows
```

## Suggested Reading Order

**For first-time users:**
1. [Introduction](./users/introduction.md) - Understand the framework
2. [Roles](./users/roles/index.md) - Find your role
3. [Concepts](./users/concepts/index.md) - Learn the core concepts
4. [Getting Started](./users/guides/index.md) - Follow your role's guide
5. [SDK Reference](../sdk_reference/initialize.md) - Start building

**For developers ready to build:**
1. [SDK Reference - Initialize](../sdk_reference/initialize.md) - Setup
2. [Workflows](../sdk_reference/workflows/) - Example implementations
3. Specific module documentation as needed

---

[← Back to README](../README.md)
