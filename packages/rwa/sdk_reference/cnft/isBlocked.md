## `cnft.isBlocked(IsBlocked)`

Check whether a Contract NFT contract is blocked. This is a read-only call.

### IsBlocked Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractNft** | `string` | Required | Contract NFT contract address. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **blocked** | `boolean` | `true` if blocked, `false` otherwise. |


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

  // 1. Check blocked state
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const result = await rwa_sdk.cnft.isBlocked({ contractNft });
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

  // 1. Check blocked state
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const result = await rwa_sdk.cnft.isBlocked({ contractNft });
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
  blocked: true
}
```
