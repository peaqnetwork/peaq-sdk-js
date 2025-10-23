# Most common flow:
In order to make this as reproducible on a deployed framework as possible we will need to have precise definitions for those participating. Formal documentation on such can be found <link_rwa_evm_docs>. 

Throughout the examples you will see the syntax, `process.env.HTTPS_BASE_URL`. This is an environmental variable which was set in the `.env` file during initialization. It is important to remember to keep this file secret.

Below is an example of the environmental variables we use throughout the sdk reference in this workflow for users to get an understanding on where to put authority keys and connect to users eoa wallet's for tx sending on their end.


```bash
# Network RPC URL
HTTPS_BASE_URL=""

# PEAQ OWNER Admin
ADMIN_PUBLIC_ADDRESS=""
ADMIN_PRIVATE_KEY=""

# Claim Issuer
CLAIM_ISSUER_PUBLIC_ADDRESS=""
CLAIM_ISSUER_PRIVATE_KEY=""
CLAIM_ISSUER_CONTRACT_ADDRESS=""


# Alice
ALICE_PUBLIC_ADDRESS=""
ALICE_PRIVATE_KEY=""

# Bob
BOB_PUBLIC_ADDRESS=""
BOB_PRIVATE_KEY=""
```


1. [Create Identity Alice](../identity/createIdentity.md)

2. [Create Identity Bob](../identity/createIdentity.md)

Replace the `ALICE_PUBLIC_ADDRESS` with `BOB_PUBLIC_ADDRESS`

3. [Add KYC Claim to Identity Alice](../identity/addClaimToIdentity.md)

4. [Add KYC Claim to Identity Bob](../identity/addClaimToIdentity.md)

Replace the `ALICE_PUBLIC_ADDRESS` with `BOB_PUBLIC_ADDRESS` and `ALICE_PRIVATE_KEY` with `BOB_PRIVATE_KEY`

5. [Issue Machine NFTs](../mnfts/issueMachineNFT.md)

6. [Create Vault and Token](../vault/createVaultAndToken.md)

7. Mint Security Token
    - [Register Token Owner Identity](../vault/registerIdentity.md)
    - [Token Owner Approves Vault as Operator](../vault/approveVaultAsOperator.md)
    - [Mint Security Token](../vault/mintSecurityTokens.md)

8. [Unpause Token](../vault/unpauseToken.md)

9. [Register Bob Token Identity](../vault/registerIdentity.md)

10. [Transfer Token from Alice to Bob](../vault/transfer.md)