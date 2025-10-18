## `onchainid.issueKycClaim(IssueKycClaim)`

Generate and sign a KYC claim for an ONCHAINID identity. This does not broadcast a transaction; it returns the encoded claim payload and the issuer's signature that can be submitted or verified off-chain/on-chain by downstream contracts.

### IssueKycClaim Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **claimIssuer** | `Signer` | Required | Claim Issuer signer authorized to issue KYC claims. Must be connected to a provider. |
| **issuerContract** | `string` | Required | EVM address of the ClaimIssuer contract. |
| **identity** | `string` | Required | ONCHAINID identity contract address of the subject being KYCed. |
| **name** | `string` | Required | First name of the identity owner. |
| **lastName** | `string` | Required | Last name of the identity owner. |
| **dateOfBirth** | `string` | Required | Date of birth in ISO format `YYYY-MM-DD`. |
| **placeOfBirth** | `string` | Required | Place of birth. |
| **uri** | `string` or `null` | Required | Optional URI pointing to KYC evidence/metadata (use `null` if not applicable). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **claim** | `IClaim` | Encoded claim payload: `{ identity, issuer, topic, scheme, data, uri }`. |
| **signature** | `string` | Signature over the claim by `claimIssuer`. |


### Usage
```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Alice EOA
    const aliceEoa = process.env.ALICE_PUBLIC_KEY

    // 2. Get Alice identity
    const alice = await rwa_sdk.onchainid.getIdentity({ eoa: aliceEoa });
    console.log("Alice Identity", alice);

    // 3. Get Claim Issuer Admin
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // 4. Get Issuer Contract
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;


    // 5. Issue signed KYC claim
    const result = await rwa_sdk.onchainid.issueKycClaim({
        claimIssuer: admin,
        issuerContract: issuerContract,
        identity: alice.identity,
        name: "Alice",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        placeOfBirth: "New York",
        uri: "https://example.com/kyc"
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
```json
Alice Identity {
 status: 'found',
 identity: '0x1d0FDE95e971c5c78B6f9c745a8e2791Fe0c962C'
}
Result {
 claim: {
   identity: '0x1d0FDE95e971c5c78B6f9c745a8e2791Fe0c962C',
   issuer: '0x842d57632954943304441258E94f3f089235022c',
   topic: 666,
   scheme: 1,
   data: '0x252ec8044814d556905cc1587f4a375a2acfe3f84a17d7d104accd32ee25b3b6',
   uri: 'https://example.com/kyc'
 },
 signature: '0xffd77807790d0e764bcdd2bc7661c6a3e1e016758100f4afc5d6a5f3552455791ddcfd2bd5b705c27eaa66c45ca1c0bf7b53f5a3a533b6023b8bf3f2132a363a1b'
}
```

Note: `topic` and `scheme` are set according to the RWA KYC specification. Ensure your `claimIssuer` and `issuerContract` are recognized by your registry/verification flow for successful validation.