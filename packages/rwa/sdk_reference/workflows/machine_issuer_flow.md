# Machine Issuer flow

This workflow shows how to **add a new Machine Issuer** so that an address can call `mnft.registerMachine` for a given Machine NFT contract. It follows the integration test in `tests/rwanft/rwanft.addMachineIssuer.int.test.ts`.

## What “adding a Machine Issuer” means

- The **Machine Regulator** (e.g. Framework Owner) approves an EOA as a **Machine Issuer**.
- That EOA must have an ONCHAINID identity with a **Machine Issuer role claim** (`CT_MNFT_ISSUER`) issued by a trusted Claim Issuer.
- The regulator then registers that EOA in the **PeaqRwaNft** contract via `rwanft.addMachineIssuer`. After that, the address can register machines (mint Machine NFTs) for machine controllers.

## Prerequisites

- **Machine Regulator** signer (e.g. `MACHINE_REGULATOR_PRIVATE_KEY`) — will issue the role claim and call `addMachineIssuer`.
- **Claim Issuer** contract address (`CLAIM_ISSUER_CONTRACT_ADDRESS`) — the same Claim Issuer used for KYC; its signer can issue role claims (in the test the admin is both regulator and claim issuer).
- **Candidate Machine Issuer** — the EOA you want to turn into a Machine Issuer (e.g. Alice). They must already have an **ONCHAINID identity**. Create one first with [Create Identity](../identity/createIdentity.md) if needed.

## Steps

### 1. Ensure the candidate has an identity

Resolve the candidate’s ONCHAINID identity (create it first if they don’t have one):

- [Get Identity](../identity/getIdentity.md) with `subject: candidateAddress`.
- If `status === 'not_found'`, [Create Identity](../identity/createIdentity.md) for that address (ID Factory admin signs), then call Get Identity again.

### 2. Issue the Machine Issuer role claim

The **Claim Issuer** (or the same signer acting as claim issuer) issues a role claim for the candidate’s identity with topic `CT_MNFT_ISSUER`:

- [Issue Role Claim](../identity/issueRoleClaim.md) with:
  - `claimIssuerSigner`: Machine Regulator (or your Claim Issuer signer).
  - `claimIssuerContract`: `CLAIM_ISSUER_CONTRACT_ADDRESS`.
  - `subjectIdentity`: the candidate’s identity address from step 1.
  - `roleTopic`: `ClaimTopics.CT_MNFT_ISSUER` (e.g. `7` — use the value from your SDK’s `ClaimTopics` enum).
  - `roleDescription`: e.g. `'Machine Issuer'`.

You get back `{ claim, signature }`.

### 3. Add the claim to the candidate’s identity

The **identity owner** (the candidate) must add the claim to their identity:

- [Add Claim to Identity](../identity/addClaimToIdentity.md) with:
  - `identityController`: candidate’s signer (e.g. Alice’s wallet).
  - `subjectIdentity`: candidate’s identity address.
  - `claim`: the claim from step 2.
  - `claimSignature`: the signature from step 2.

### 4. Register the Machine Issuer in PeaqRwaNft

The **Machine Regulator** adds the candidate’s EOA to the PeaqRwaNft contract:

- [Add Machine Issuer](../rwanft/addMachineIssuer.md) with:
  - `machineRegulatorSigner`: Machine Regulator wallet.
  - `newMachineIssuer`: candidate’s EOA address (e.g. `alice.address`).

Result includes `status: 'added'`, `machineIssuer`, `machineNft` (the contract created for this issuer), and `receipt`.

### 5. (Optional) Verify

- [Get Machine Issuers](../rwanft/getMachineIssuers.md) before and after step 4 to confirm the new address appears in the list.

## Summary

| Step | Who acts | SDK call |
|------|----------|----------|
| 1 | ID Factory admin / — | `onchainid.getIdentity`; if needed `onchainid.createIdentity` |
| 2 | Claim Issuer (e.g. Machine Regulator) | `onchainid.issueRoleClaim` (topic `CT_MNFT_ISSUER`) |
| 3 | Candidate (identity owner) | `onchainid.addClaimToIdentity` |
| 4 | Machine Regulator | `rwanft.addMachineIssuer` |
| 5 | — | `rwanft.getMachineIssuers` (optional) |

For a single runnable example, see `tests/rwanft/rwanft.addMachineIssuer.int.test.ts`.
