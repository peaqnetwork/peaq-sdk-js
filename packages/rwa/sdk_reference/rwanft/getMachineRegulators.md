## `rwanft.getMachineRegulators()`

Fetch the list of Machine Regulator addresses registered in the PeaqRwaNft contract. This is a read-only call.

### Parameters
None.

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **machineRegulators** | `string[]` | Array of Machine Regulator addresses. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from '@peaq-network/rwa';
import { JsonRpcProvider } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Get Machine Regulators
  const result = await rwa_sdk.rwanft.getMachineRegulators();
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
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

  // 1. Get Machine Regulators
  const result = await rwa_sdk.rwanft.getMachineRegulators();
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
  machineRegulators: [
    '0x8BCfa2e9FC4aCa66fCF36Bcf47646E5Fb8d74BA0'
  ]
}
```
