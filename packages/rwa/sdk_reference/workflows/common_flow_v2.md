

```
HTTPS_BASE_URL="https://peaq-agung.api.onfinality.io/public"

# PEAQ OWNER Admin
ADMIN_PUBLIC_ADDRESS=""
ADMIN_PRIVATE_KEY=""

# Claim Issuer
CLAIM_ISSUER_PUBLIC_ADDRESS=""
CLAIM_ISSUER_PRIVATE_KEY=""
CLAIM_ISSUER_CONTRACT_ADDRESS=""
CLAIM_ISSUER_IDENTITY_ADDRESS=""

# Machine Issuer
MACHINE_ISSUER_PUBLIC_ADDRESS=""
MACHINE_ISSUER_PRIVATE_KEY=""

# Alice
ALICE_PUBLIC_ADDRESS=""
ALICE_PRIVATE_KEY=""

# Bob
BOB_PUBLIC_ADDRESS=""
BOB_PRIVATE_KEY=""

# Charlie
CHARLIE_PUBLIC_ADDRESS=""
CHARLIE_PRIVATE_KEY=""
```

We will assume all of these entities have some of the native token PEAQ in their wallet.

Peaq Owner Admin: entity that deployed the framework. Has the ability to: 
- ONCHAINID Admin: Add Identities via the `IdFactory` Smart Contract
- Machine Issuer: Default Machine Issuer who has the authority to allow for Machine Nft issuance
- Vault Deployer: Allows for vaults to be created on the deployed TREX Vault Factory

Claim Issuer: entity that has been wired up to issuer claims. Contract and Identity address were given after RWA deployment

Machine Issuer: Has the authority to issue MachineNfts to a user

Alice: Key participant in the framework who will be a: ... 
- Machine Controller: Machines are registered to this user with authority from the Machine Issuer (peaq owner admin default). They will be the machine controller of the newly issued MachineNft at the logged tokenIds, and they pay the necessary fees.
- Contract Controller: The initiator of the ContractNft creation process.
- Vault Controller: The Vault Deployer gives the vault controller address the authority to create a vault, token, and a distributor.
- Optional: Machine Issuer (when setup with [machine issuer flow](./machine_issuer_flow.md))

Bob - participant in the framework
- Counterparty signer in ContractNft

Charlie - participant in the framework
- Counterparty signer in ContractNft

1. Create Identity