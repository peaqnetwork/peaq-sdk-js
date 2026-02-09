## `cnft.signContract(SignContract)`

Sign a Contract NFT as a counterparty. This sends a transaction from the counterparty signer. If the final signature is collected, the contract becomes completed.

### SignContract Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **counterpartySigner** | `Signer` | Required | Counterparty signer authorized to sign the contract. Must be connected to a provider. |
| **contractNft** | `string` | Required | Contract NFT contract address. |
| **contractId** | `string` | Required | Contract ID to sign. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `completed` or `signed` or `mined_unknown` | Status of the signing operation. |
| **contractId** | `string` | Contract ID that was signed (from emitted event when available). |
| **counterpartySigner** | `string` | Counterparty address that signed (from emitted event when available). |
| **receipt** | `TransactionReceipt` | Transaction receipt for the signing call. |
| **progress** | `{ collected: number; total: number }` | Optional signature progress when `status` is `signed`. Total includes the initiator (+1). |


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

  // 1. Contract controller and counterparties
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
  const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);
  const charlie = new Wallet(process.env.CHARLIE_PRIVATE_KEY!, provider);

  // 2. Get information from contract creation
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const contractId = '1234567890'

  // 3. Counterparty signs
  const result = await rwa_sdk.cnft.signContract({
    counterpartySigner: bob,
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

  // 1. Contract counterparty
  const bob = new Wallet(process.env.BOB_PRIVATE_KEY, provider);

  // 2. Get information from contract creation
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const contractId = '1234567890'

  // 3. Counterparty signs
  const result = await rwa_sdk.cnft.signContract({
    counterpartySigner: bob,
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
Signed (more signatures required):
```
Result {
  status: 'signed',
  contractId: '1234567890',
  counterpartySigner: '0xbA9274C766A5961C40bB4a3e0e107699EE9Dab9C',
  receipt: ContractTransactionReceipt {
    ...
  },
  progress: { collected: 2, total: 3 }
}
```

Completed (final signature collected):
```
Result {
  status: 'completed',
  contractId: '1234567890',
  counterpartySigner: '0x68af027F5AaE3b1B6ff770b87aB7ac360b54ad40',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Note: If emitted events are not detected, the SDK returns `status: 'mined_unknown'` with `contractId` and `counterpartySigner` set to `'unknown'`.
