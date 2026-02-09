## `mnft.getMachineDid(GetMachineDid)`

Read and deserialize a DID document from a Machine NFT. This is a read-only call.

### GetMachineDid Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineNft** | `string` | Required | Machine NFT contract address. |
| **tokenId** | `string` | Required | Machine NFT token ID. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **didDocument** | `Object` | Deserialized DID document for the machine. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from "@peaq-network/rwa";
import { JsonRpcProvider } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Get a known Machine NFT and tokenId
  const machineNft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
  const tokenId = "95044317769373976152348576528544002775282921045";

  // 2. Read DID document
  const result = await rwa_sdk.mnft.getMachineDid({
    machineNft,
    tokenId
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
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Get a known Machine NFT and tokenId
  const machineNft = "0xaBB3961281123C336596153C4dfE83E11498fc54";
  const tokenId = "95044317769373976152348576528544002775282921045";

  // 2. Read DID document
  const result = await rwa_sdk.mnft.getMachineDid({
    machineNft,
    tokenId
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
  didDocument: {
    id: 'did:peaq:...',
    controller: '0x...',
    verification_methods: [ ... ],
    services: [ ... ],
    authentications: [ ... ],
    verifiable_credential: {
      id: '...',
      type: 'MachineNft',
      issuer: '0x...',
      issuance_date: '...',
      credential_subject: { ... }
    }
  }
}
```
