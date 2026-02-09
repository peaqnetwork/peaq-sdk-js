## `cnft.getDraft(GetDraft)`

Fetch a Contract NFT draft by contract ID. This is a read-only call.

### GetDraft Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractNft** | `string` | Required | Contract NFT contract address. |
| **contractId** | `string` | Required | Contract ID to fetch the draft for. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **draft** | `ContractDraft` | Draft tuple returned by the contract. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Get contract draft
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const contractId = "1234567890"

  // 2. Fetch draft
  const result = await rwa_sdk.cnft.getDraft({
    contractNft: contractNft,
    contractId: contractId
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
import { JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Get contract draft
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const contractId = "1234567890"

  // 2. Fetch draft
  const result = await rwa_sdk.cnft.getDraft({
    contractNft: contractNft,
    contractId: contractId
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
  draft: [
    [
      '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
      [
        '0xbA9274C766A5961C40bB4a3e0e107699EE9Dab9C',
        '0x68af027F5AaE3b1B6ff770b87aB7ac360b54ad40'
      ],
      1234567890n,
      'https://example.com'
    ],
    [
      '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2'
    ]
  ]
}
```
