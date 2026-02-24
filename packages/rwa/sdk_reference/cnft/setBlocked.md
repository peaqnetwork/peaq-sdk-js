## `cnft.setBlocked(SetBlocked)`

Set a Contract NFT contract to blocked or unblocked. This sends a transaction from the Contract NFT owner.

### SetBlocked Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractNftSigner** | `Signer` | Required | Contract NFT owner signer authorized to set blocked state. Must be connected to a provider. |
| **contractNft** | `string` | Required | Contract NFT contract address. |
| **blocked** | `boolean` | Required | `true` to block, `false` to unblock. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `set` | Status of the operation. |
| **contractNft** | `string` | Contract NFT contract address. |
| **blocked** | `boolean` | The resulting block state. |
| **setBy** | `string` | Address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the update operation. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Contract NFT owner signer
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Contract NFT address
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";

  // 3. Block the contract
  const result = await rwa_sdk.cnft.setBlocked({
    contractNftSigner: admin,
    contractNft: contractNft,
    blocked: true
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
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Contract NFT owner signer
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Contract NFT address
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";

  // 3. Block the contract
  const result = await rwa_sdk.cnft.setBlocked({
    contractNftSigner: admin,
    contractNft: contractNft,
    blocked: true
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
  status: 'set',
  contractNft: '0xA00ee5b948E3E1cb293f57F7008721353416Aa2E',
  blocked: true,
  setBy: '0x8BCfa2e9FC4aCa66fCF36Bcf47646E5Fb8d74BA0',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
