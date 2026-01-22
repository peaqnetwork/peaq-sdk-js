## `onchainid.getIdentity(GetIdentity)`

Fetch the ONCHAINID identity contract address associated with a given EOA (Externally Owned Account). This is a read-only query against the ID Factory; no transaction is sent.

### GetIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **eoa**   | `string` | Required | EOA to check for an associated ONCHAINID identity. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status**   | `found` or `not_found` | `'found'` when an identity is associated with the EOA, otherwise `'not_found'`. |
| **identity** | `string`    | The identity address when found; empty string `''` when not found. |

### Usage
#### TypeScript
```Typescript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type GetIdentity } from '@peaq-network/rwa';
import { JsonRpcProvider } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
    const rwa_sdk = new RWA(init);
  
    // 1. Get Alice public address
    const alice = process.env.ALICE_PUBLIC_ADDRESS!;

    // 2. Query ONCHAINID Identity
    const params: GetIdentity = { eoa: alice };
    const result = await rwa_sdk.onchainid.getIdentity(params);
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
import { JsonRpcProvider } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });
  
    // 1. Get Alice public address
    const alice = process.env.ALICE_PUBLIC_ADDRESS

    // 2. Query ONCHAINID Identity
    const result = await rwa_sdk.onchainid.getIdentity({
        eoa: alice
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
Found:
```
Result {
  status: 'found',
  identity: '0xF16b0871271C2135b4Ffc374676e74a16aaDC2c9'
}
```

Not found:
```
Result {
  status: 'not_found',
  identity: ''
}
```