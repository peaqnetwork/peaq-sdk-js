# Common flow (start to finish)

## What this workflow shows

This page describes an **end-to-end RWA flow** that matches the integration test in `tests/full_flow/rwa.fullFlow.int.test.ts`. It runs in order:

1. **Onboard participants** – Create ONCHAINID identities for Alice, Bob, and Charlie; then attach KYC claims so they can hold compliant tokens.
2. **Asset side** – Alice receives Machine NFTs (via a Machine Issuer) and completes a multi-party Contract NFT with Bob and Charlie.
3. **Vault and token** – Admin creates a vault with Alice as controller and unpauses the security token; then registers Alice, Bob, and Charlie in the vault’s Identity Registry.
4. **Collateralize and mint** – Alice approves the vault to move her Machine NFTs and Contract NFT, deposits them into the vault, and mints security tokens.
5. **Transfers and yield** – Alice transfers tokens to Bob and Charlie; Alice deposits yield into the vault; Bob claims yield (for himself and to Charlie).

Throughout the examples you will see `process.env.*` (e.g. `process.env.HTTPS_BASE_URL`). These come from a **`.env` file** you set during [initialization](../initialize.md). Keep this file secret and never commit it.

---

## Environment variables

Use the same variable names as in the SDK reference so you can copy-paste and compare with the test. Example layout:

```bash
# Network RPC URL
HTTPS_BASE_URL="https://peaq-agung.api.onfinality.io/public"

# PEAQ OWNER Admin
ADMIN_PUBLIC_ADDRESS=""
ADMIN_PRIVATE_KEY=""

# Claim Issuer
CLAIM_ISSUER_PUBLIC_ADDRESS=""
CLAIM_ISSUER_PRIVATE_KEY=""
CLAIM_ISSUER_CONTRACT_ADDRESS=""
CLAIM_ISSUER_IDENTITY_ADDRESS=""

# Machine Regulator
MACHINE_REGULATOR_PUBLIC_ADDRESS=""
MACHINE_REGULATOR_PRIVATE_KEY=""

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

---

## Parties at play

### Admin (Framework owner / Implementation Authority)

**Who:** In production this is peaq (or the Implementation Authority). In tests it is the wallet you put in `ADMIN_*`.

**What they do:** Own the ID Factory and Vault Factory; create ONCHAINID identities for users; create vaults and set the vault controller; unpause vault tokens; register identities in a vault’s Identity Registry so those EOAs can hold and transfer the security token.

### Claim Issuer

**Who:** A trusted entity that issues and attests to claims (e.g. KYC). Onboarding is required; peaq approves and adds them to the Trusted Issuers Registry.

**What they do:** Issue KYC (and optionally role) claims for identities. The Claim Issuer **contract** address is used by the vault’s compliance; the Claim Issuer **signer** (`CLAIM_ISSUER_PRIVATE_KEY`) signs claims. You need both `CLAIM_ISSUER_CONTRACT_ADDRESS` and the signer in `.env`.

### Machine Regulator

**Who:** Authority that decides which addresses may act as Machine Issuers.

**What they do:** Add or remove Machine Issuers via the PeaqRwaNft contract; set block state for issuers or Contract NFT contracts. Uses `MACHINE_REGULATOR_*` in the full flow setup (e.g. adding the Machine Issuer before the test runs).

### Machine Issuer

**Who:** Entity allowed by the Machine Regulator to register Machine NFTs for a given machine value.

**What they do:** Call `mnft.registerMachine` to mint Machine NFTs to a **machine controller** (e.g. Alice). The controller pays the ERC20 fee (after setting allowance via `mnft.ensureMachineNftAllowance`). Uses `MACHINE_ISSUER_*`.

### Alice (Asset owner / Vault controller)

**Who:** In this flow, the main asset owner and vault controller.

**What they do:** Get an identity and KYC; receive Machine NFTs from the Machine Issuer; create a Contract NFT as controller and have Bob and Charlie sign; become the vault controller when Admin creates the vault; approve the vault for her MNFT and CNFT token IDs; deposit those NFTs and mint security tokens; transfer tokens to Bob and Charlie; deposit yield into the vault.

### Bob and Charlie (Investors / Counterparties)

**Who:** Participants who will hold security tokens and (in this flow) sign the Contract NFT as counterparties.

**What they do:** Get identities and KYC; sign the Contract NFT created by Alice; get registered in the vault’s Identity Registry; receive token transfers from Alice; claim yield from the vault (Bob claims for himself and can claim to Charlie via `claimYieldTo`).

---

## Flow (step-by-step)

Each step links to the SDK reference for that operation. Replace placeholders (e.g. Alice vs Bob) where the doc says “use this address/signer”.

1. **Create identities**  
   [Create Identity](../identity/createIdentity.md) for Alice, Bob, and Charlie (use `idFactoryAdmin: admin`, `subject: ALICE_PUBLIC_ADDRESS` / Bob / Charlie, and a unique `deploymentSalt`).

2. **Add KYC claims**  
   [Add claim to identity](../identity/addClaimToIdentity.md) for each of Alice, Bob, and Charlie (Claim Issuer signer + contract; each identity owner signs `addClaimToIdentity`).

3. **Register Machine NFTs for Alice**  
   [Ensure allowance](../mnft/ensureMachineNftAllowance.md) then [Register machine](../mnft/registerMachineNft.md). Use `machineIssuer` (Machine Issuer signer), `machineControllerAddr: alice.address`, and the same used in your deployment. Record the `machineIds` as these will be needed later when approving and minting.

4. **Create and complete a Contract NFT**  
   [Create contract](../cnft/createContract.md) (Alice as controller, Bob and Charlie as counterparties). Then [Sign contract](../cnft/signContract.md) as Bob and as Charlie until status is `completed`. Save the `contractId` that is generated as it will be needed for signing and approval/minting later.

5. **Create vault and unpause token**  
   [Create vault](../vault/createVaultAndToken.md) (Admin as `vaultDeployer`, Alice as `vaultController`). Set the vault factory and info desk as the same contracts in your deployed framework. Make sure to write down the addresses for the vault, token, and distributor. Then [Unpause token](../vault/unpauseToken.md) for that vault.

6. **Register identities for the vault**  
   [Register identity](../vault/registerIdentity.md) for Alice, Bob, and Charlie in the vault’s Identity Registry (Admin as `vaultDeployer`).

7. **Approve vault for NFTs**  
   [NFT approval](../vault/approveVaultAsOperator.md): approve the vault for the Machine NFT token IDs, then for the Contract NFT contract and its token ID (Alice as `machineController`).

8. **Deposit and mint**  
   [Deposit and mint](../vault/mintSecurityTokens.md): Alice deposits the same Machine NFTs and Contract NFT token IDs and mints the chosen amount of security tokens.

9. **Transfer tokens**  
   [Ensure transfer fee allowance](../vault/ensureTransferFeeAllowance.md) then [Transfer](../vault/transfer.md) from Alice to Bob and from Alice to Charlie (use the vault’s security token address from step 5).

10. **Yield (optional)**  
    [Deposit yield](../vault/depositYield.md) (e.g. Alice deposits). [Claim yield](../vault/claimYield.md) (e.g. Bob claims). [Claim yield to](../vault/claimYieldTo.md) (e.g. Bob claims to Charlie).

For a single script that runs this sequence, see `tests/full_flow/rwa.fullFlow.int.test.ts`.
