## `rwanft.findContractNft(FindContractNft)`

Find a ContractNft address with available storage for a given contract ID. This is a read-only call.

### FindContractNft Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractId** | `string` | Required | Contract ID (stringified integer). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **contractNft** | `string` | ContractNft address with available storage for the provided contract ID. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from '@peaq-network/rwa';
import { JsonRpcProvider } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Find contract NFT by contract ID
  const contractId = "1234567890";
  const result = await rwa_sdk.rwanft.findContractNft({ contractId });
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
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Find contract NFT by contract ID
  const contractId = "1234567890";
  const result = await rwa_sdk.rwanft.findContractNft({ contractId });
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
  contractNft: '0xA00ee5b948E3E1cb293f57F7008721353416Aa2E'
}
```

Note: if the contract ID is already in use, the call will revert with a message similar to `Not available, please contact owner`.
