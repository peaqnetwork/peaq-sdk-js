## `onchainid.addClaimToIdentity(AddClaimToIdentity)`

Add a signed claim to an ONCHAINID identity (calls the identity contract's `addClaim`).

### AddClaimToIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **identity** | `string` | Required | ONCHAINID identity contract address that will receive the claim. |
| **identityOwner** | `Signer` | Required | Signer/wallet of the identity owner connected to a provider. |
| **claim** | `IClaim` | Required | Encoded claim payload: `{ identity, issuer, topic, scheme, data, uri }`. |
| **kycSignature** | `string` | Required | `0x`-prefixed hex signature over the claim by the claim issuer. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **receipt** | `TransactionReceipt` | Transaction receipt of the `addClaim` call. |


### Usage
```js
import 'dotenv/config';
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Claim Issuer admin wallet
  const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY, provider);

  // 2. Get User to KYC
  const alice = await rwa.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_ADDRESS });

  // 3. Create claim + signature
  const { claim, signature } = await rwa.onchainid.issueKycClaim({
    claimIssuer: claimIssuer,
    issuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS,
    identity: alice.identity,
    name: 'Alice',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    placeOfBirth: 'New York',
    uri: 'https://example.com/kyc'
  });

  // 4. Identity owner signs and submits addClaim
  const aliceSigner = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);
  const { receipt } = await rwa.onchainid.addClaimToIdentity({
    identity: alice.identity,
    identityOwner: aliceSigner,
    claim: claim,
    kycSignature: signature,
  });

  console.log('Added claim. txHash:', receipt.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
```
{
  receipt: TransactionReceipt {
    ...
    hash: '0xabccaf471ad0afa2f059747baeb7f79be3d41ecdaae1beed0bd3d903348b302a',
    status: 1
  }
}
Added claim. txHash: 0xabccaf471ad0afa2f059747baeb7f79be3d41ecdaae1beed0bd3d903348b302a
```

Notes:
- Ensure `identityOwner` controls the ONCHAINID at `identity`.
- `kycSignature` must match the exact `claim` payload and issuer.