## `onchainid.createIdentity(opts)`

Create (or fetch if already exists) an ONCHAINID identity for a given EOA. This call is idempotent: if an identity is already associated with `walletAddr`, it returns that address with `status: 'exists'` and `receipt: null`.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **admin** | `Signer` | Required | Signer authorized to create identities (e.g., platform admin). |
| **walletAddr** | `string` | Required | EOA that the identity will be associated with. |
| **salt** | `string` | Required | Arbitrary string used for deterministic deployment. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `created` or `exists` | `'created'` when a new identity was deployed, `'exists'` if already present. |
| **identityAddress** | `string` | ONCHAINID contract address bound to `walletAddr`. |
| **receipt** | `TransactionReceipt` or `null` | Transaction receipt when created; `null` if it already existed. |


### Usage
```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG });
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  
    // 1. Get Admin wallet
 	const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // 2. Get Alice EOA address
    const aliceEoa = process.env.ALICE_PUBLIC_KEY

    // 3. Create ONCHAINID Identity
	const result = await rwa_sdk.onchainid.createIdentity({
        admin: admin,
        walletAddr: aliceEoa,
        salt: "alice-" + Date.now().toString()
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
```txt
Result {
  status: 'created',
  identityAddress: '0x1e747251c5F1A4cDC4CD667536db2949A93aB110',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Already exists:
```txt
Result {
  status: 'exists',
  identityAddress: '0x1e747251c5F1A4cDC4CD667536db2949A93aB110',
  receipt: null
}
```