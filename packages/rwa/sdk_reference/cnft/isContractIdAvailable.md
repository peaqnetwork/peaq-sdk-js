## `cnft.isContractIdAvailable(IsContractIdAvailable)`

Check whether a Contract ID is available for a Contract NFT. This is a read-only call.

### IsContractIdAvailable Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractNft** | `string` | Required | Contract NFT contract address. |
| **contractId** | `string` | Required | Contract ID to check. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **available** | `boolean` | `true` if available, `false` if already used. |


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

  // 1. Check availability
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const result = await rwa_sdk.cnft.isContractIdAvailable({
    contractNft,
    contractId: "1"
  });
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

  // 1. Check availability
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const result = await rwa_sdk.cnft.isContractIdAvailable({
    contractNft,
    contractId: "1"
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
  available: true
}
```
