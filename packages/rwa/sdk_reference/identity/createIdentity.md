## `onchainid.createIdentity(CreateIdentity)`

Create (or fetch if already exists) an ONCHAINID identity for a given EOA (Externally Owned Account where the user controls the keys). If an identity is already associated with an `eoa`, it returns that identity address with `status: 'exists'`.

### CreateIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **admin** | `Signer` | Required | ID Factory Signer authorized to create identities. |
| **eoa**   | `string` | Required | EOA of the identity the deployed ONCHAINID will be associated with. |
| **salt**  | `string` | Required | Arbitrary string used for deterministic deployment. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status**   | `created` or `exists` | `'created'` when a new identity was deployed, `'exists'` if already present. |
| **identity** | `string`    | ONCHAINID identity contract address that is bound to their EOA. |
| **receipt**  | `TransactionReceipt` | Transaction receipt when created. |


### Usage
#### TypeScript
```Typescript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type CreateIdentity } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
    const rwa_sdk = new RWA(init);
  
    // 1. Get Admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

    // 2. Get Alice public address
    const alice = process.env.ALICE_PUBLIC_ADDRESS!

    // 3. Create ONCHAINID Identity params
    const createIdentity: CreateIdentity = {
        admin: admin,
        eoa: alice,
        salt: "identity-" + Date.now().toString()
    }
    const result = await rwa_sdk.onchainid.createIdentity(createIdentity);
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

#### JavaScript
```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });
  
    // 1. Get Admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // 2. Get Alice public address
    const alice = process.env.ALICE_PUBLIC_ADDRESS

    // 3. Create ONCHAINID Identity
    const result = await rwa_sdk.onchainid.createIdentity({
        admin: admin,
        eoa: alice,
        salt: "identity-" + Date.now().toString()
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
Created:
```
Result {
  status: 'created',
  identityAddress: '0x1e747251c5F1A4cDC4CD667536db2949A93aB110',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Already exists:
```
Result {
  status: 'exists',
  identityAddress: '0x1e747251c5F1A4cDC4CD667536db2949A93aB110'
}
```