## `vaults.unpauseToken(UnpauseToken)`

Owner-only helper to unpause the T-REX token so transfers are enabled.

### UnpauseToken Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **admin** | `Signer` | Required | Owner/admin authorized to unpause. |
| **vault** | `string` | Required | MachineVault address controlling the token. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **result** | `string` | Human-readable summary. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the unpause call. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type UnpauseToken } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Admin wallet
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Unpause Security Tokens
  const unpauseToken: UnpauseToken = {
    admin: admin,
    vault: "0x26c13E26Fe20fc47f60B298b9F891F379E65631A",
  }
  const result = await rwa_sdk.vaults.unpauseToken(unpauseToken);
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
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Admin wallet
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Unpause Security Tokens
  const result = await rwa_sdk.vaults.unpauseToken({
    admin: admin,
    vault: "0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a",
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
Result {
  result: 'Unpaused token for vault: 0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a',
  receipt: TransactionReceipt {
    hash: '0xb09a1185bc35dc7e874cabe7375aad58318e081b0e0f4c71e8597c2f09d357df',
    status: 1,
    ...
  }
}
```

Notes:
- Only callable by the owner in the implementing contract.