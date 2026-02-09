## `cnft.cancelContract(CancelContract)`

Cancel a Contract NFT draft. This sends a transaction from the contract controller and removes the draft from storage.

### CancelContract Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractController** | `Signer` | Required | Contract controller signer authorized to cancel the contract. Must be connected to a provider. |
| **contractNft** | `string` | Required | Contract NFT contract address. |
| **contractId** | `string` | Required | Contract ID to cancel. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `cancelled` | Status of the operation. |
| **contractNft** | `string` | Contract NFT contract address. |
| **contractId** | `string` | Contract ID that was cancelled (from emitted event). |
| **cancelledBy** | `string` | Controller address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the cancellation call. |


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

  // 1. Contract controller
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Get contract draft
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const contractId - "1234567890"

  // 3. Cancel the contract
  const result = await rwa_sdk.cnft.cancelContract({
    contractController: alice,
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

  // 1. Contract controller and counterparties
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Get contract draft
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const contractId = "1234567890"

  // 3. Cancel the contract
  const result = await rwa_sdk.cnft.cancelContract({
    contractController: alice,
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
  status: 'cancelled',
  contractNft: '0xA00ee5b948E3E1cb293f57F7008721353416Aa2E',
  contractId: '1234567890',
  cancelledBy: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Note: Once cancelled, `getDraft` for the same `contractId` will revert with `Not found`.
