## `onchainid.addClaimToIdentity(AddClaimToIdentity)`

Add a signed claim to an ONCHAINID identity (calls the identity contract's `addClaim`).

### AddClaimToIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **subjectIdentity** | `string` | Required | ONCHAINID identity contract address that will receive the claim. |
| **identityController** | `Signer` | Required | Signer/wallet that controls the identity, connected to a provider. |
| **claim** | `IClaim` | Required | Encoded claim payload: `{ identity, issuer, topic, scheme, data, uri }`. |
| **claimSignature** | `string` | Required | `0x`-prefixed hex signature over the claim by the claim issuer. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `added` or `updated` | `'added'` when the claim is new, `'updated'` when it replaces an existing claim. |
| **claimId** | `string` | Claim ID emitted by the identity contract. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the `addClaim` call. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, 
    type SDKInit, 
    type GetIdentity, 
    type IssueKycClaim, 
    type AddClaimToIdentity } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Claim Issuer admin wallet
  const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);

  // 2. Get User to KYC
  const getIdentity: GetIdentity = { subject: process.env.ALICE_PUBLIC_ADDRESS! };
  const alice = await rwa_sdk.onchainid.getIdentity(getIdentity);

  // 3. Create claim + signature
  const issueKycClaim: IssueKycClaim = {
    claimIssuerSigner: claimIssuer,
    claimIssuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!,
    subjectIdentity: alice.identity,
    name: 'Alice',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    placeOfBirth: 'New York',
    uri: 'https://example.com/kyc'
  }
  const { claim, signature } = await rwa_sdk.onchainid.issueKycClaim(issueKycClaim);

  // 4. Identity owner signs and submits addClaim
  const aliceSigner = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
  const addClaimToIdentity: AddClaimToIdentity = {
    subjectIdentity: alice.identity,
    identityController: aliceSigner,
    claim: claim,
    claimSignature: signature,
  }
  const { receipt, status, claimId } = await rwa_sdk.onchainid.addClaimToIdentity(addClaimToIdentity);

  console.log('Add claim result:', { status, claimId, txHash: receipt.hash });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### JavaScript
```js
import 'dotenv/config';
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Claim Issuer admin wallet
  const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY, provider);

  // 2. Get User to KYC
  const alice = await rwa_sdk.onchainid.getIdentity({ subject: process.env.ALICE_PUBLIC_ADDRESS });

  // 3. Create claim + signature
  const { claim, signature } = await rwa_sdk.onchainid.issueKycClaim({
    claimIssuerSigner: claimIssuer,
    claimIssuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS,
    subjectIdentity: alice.identity,
    name: 'Alice',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    placeOfBirth: 'New York',
    uri: 'https://example.com/kyc'
  });

  // 4. Identity owner signs and submits addClaim
  const aliceSigner = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);
  const { receipt, status, claimId } = await rwa_sdk.onchainid.addClaimToIdentity({
    subjectIdentity: alice.identity,
    identityController: aliceSigner,
    claim: claim,
    claimSignature: signature,
  });

  console.log('Add claim result:', { status, claimId, txHash: receipt.hash });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
```
{
  status: 'added',
  claimId: '0x29753f23d65eadcfc30f6988fa876cef5069d80f61802576d029c1272a2c9c4e',
  receipt: TransactionReceipt {
    ...
    hash: '0xabccaf471ad0afa2f059747baeb7f79be3d41ecdaae1beed0bd3d903348b302a',
    status: 1
  }
}
```

Notes:
- Ensure `identityController` controls the ONCHAINID at `subjectIdentity`.
- `claimSignature` must match the exact `claim` payload and issuer.