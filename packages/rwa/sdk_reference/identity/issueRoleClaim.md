## `onchainid.issueRoleClaim(IssueRoleClaim)`

Generate and sign a Role claim (Machine Regulator or Machine Issuer) for an ONCHAINID identity. This does not broadcast a transaction; it returns the encoded claim payload and the issuer's signature that can be submitted or verified off-chain/on-chain by downstream contracts.

### IssueRoleClaim Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **claimIssuerSigner** | `Signer` | Required | Claim Issuer signer authorized to issue Role claims. Must be connected to a provider. |
| **claimIssuerContract** | `string` | Required | EVM address of the ClaimIssuer contract. |
| **subjectIdentity** | `string` | Required | ONCHAINID identity contract address of the subject. |
| **roleTopic** | `number` | Required | Role topic identifier. |
| **roleDescription** | `string` | Required | Human-readable role description. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **claim** | `IClaim` | Encoded claim payload: `{ identity, issuer, topic, scheme, data, uri }`. |
| **signature** | `string` | Signature over the claim by `claimIssuerSigner`. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, ClaimTopics, type SDKInit, type GetIdentity, type IssueRoleClaim } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
    const rwa_sdk = new RWA(init);

    // 1. Get Alice EOA
    const aliceEoa = process.env.ALICE_PUBLIC_ADDRESS

    // 2. Get Alice identity
    const getIdentity: GetIdentity = { subject: aliceEoa! };
    const alice = await rwa_sdk.onchainid.getIdentity(getIdentity);
    console.log("Alice Identity", alice);

    // 3. Get Claim Issuer Admin
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);

    // 4. Get Issuer Contract
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;

    // 5. Issue signed Role claim
    const issueRoleClaim: IssueRoleClaim = {
        claimIssuerSigner: claimIssuer,
        claimIssuerContract: issuerContract!,
        subjectIdentity: alice.identity,
        roleTopic: ClaimTopics.CT_MNFT_ISSUER,
        roleDescription: "Machine Issuer"
    }
    const { claim, signature } = await rwa_sdk.onchainid.issueRoleClaim(issueRoleClaim);
    console.log("Result", { claim, signature });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

#### JavaScript
```js
import 'dotenv/config';
import { RWA, Chain, ClaimTopics } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Alice EOA
    const aliceEoa = process.env.ALICE_PUBLIC_ADDRESS

    // 2. Get Alice identity
    const alice = await rwa_sdk.onchainid.getIdentity({ subject: aliceEoa });
    console.log("Alice Identity", alice);

    // 3. Get Claim Issuer Admin
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY, provider);

    // 4. Get Issuer Contract
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;

    // 5. Issue signed Role claim
    const result = await rwa_sdk.onchainid.issueRoleClaim({
        claimIssuerSigner: claimIssuer,
        claimIssuerContract: issuerContract,
        subjectIdentity: alice.identity,
        roleTopic: ClaimTopics.CT_MNFT_ISSUER,
        roleDescription: "Machine Issuer"
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
```
Alice Identity {
 status: 'found',
 identity: '0x1d0FDE95e971c5c78B6f9c745a8e2791Fe0c962C'
}
Result {
 claim: {
   identity: '0x1d0FDE95e971c5c78B6f9c745a8e2791Fe0c962C',
   issuer: '0x842d57632954943304441258E94f3f089235022c',
   topic: 7,
   scheme: 1,
   data: '0x252ec8044814d556905cc1587f4a375a2acfe3f84a17d7d104accd32ee25b3b6',
   uri: 'https://issuer-regulator-provider.com/user/verification'
 },
 signature: '0xffd77807790d0e764bcdd2bc7661c6a3e1e016758100f4afc5d6a5f3552455791ddcfd2bd5b705c27eaa66c45ca1c0bf7b53f5a3a533b6023b8bf3f2132a363a1b'
}
```

Note: `roleTopic` and `roleDescription` are encoded into the claim data according to the RWA Role specification. Ensure your `claimIssuerSigner` and `claimIssuerContract` are recognized by your registry/verification flow for successful validation.
