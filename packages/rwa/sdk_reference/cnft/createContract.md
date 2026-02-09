## `cnft.createContract(CreateContract)`

Create a Contract NFT draft by initializing the contract with counterparties and content, and paying the setup fee (ERC20). This sends a transaction from the contract controller.

### CreateContract Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **contractController** | `Signer` | Required | Signer that controls the contract and submits the transaction. Must be connected to a provider. |
| **erc20** | `string` | Required | ERC20 token address used to pay the setup fee. |
| **tokenDecimals** | `number` | Required | ERC20 token decimals for human-readable fee amounts. |
| **counterparties** | `string[]` | Required | Array of counterparty EOA addresses that must sign the contract. |
| **contractNft** | `string` | Required | Contract NFT contract address. |
| **contractHash** | `string` | Required | Content hash (e.g., `keccak256` of the contract content). |
| **url** | `string` | Required | URL pointing to the contract content/metadata. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `created` | Status of the operation. |
| **contractNft** | `string` | Contract NFT contract address. |
| **contractId** | `string` | Contract ID for the draft. |
| **contractController** | `string` | Controller EOA address. |
| **counterparties** | `string[]` | Counterparty addresses included in the draft. |
| **content** | `{ hash: string; url: string }` | Content hash and URL. |
| **fee** | `{ token: string; tokenDecimals: number; setupAmount: bigint; balanceBefore: bigint; balanceAfter: bigint; humanTokenDelta: string }` | Fee and ERC20 balance details for the setup. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the creation call. |


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

  // 1. Contract controller (submits tx and pays ERC20 fee)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Counterparties
  const bob = process.env.BOB_PUBLIC_ADDRESS!;
  const charlie = process.env.CHARLIE_PUBLIC_ADDRESS!;

  // 3. Prepare content
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const url = "https://example.com";
  const content = `This is a test contract ${Date.now()}`;
  const contractHash = keccak256(toUtf8Bytes(content));

  // 4. Create contract draft
  const result = await rwa_sdk.cnft.createContract({
    contractController: alice,
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    tokenDecimals: 18,
    counterparties: [bob, charlie],
    contractNft: contractNft,
    contractHash: contractHash,
    url: url
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

  // 1. Contract controller (submits tx and pays ERC20 fee)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Counterparties
  const bob = process.env.BOB_PUBLIC_ADDRESS;
  const charlie = process.env.CHARLIE_PUBLIC_ADDRESS;

  // 3. Prepare content
  const contractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E";
  const url = "https://example.com";
  const content = `This is a test contract ${Date.now()}`;
  const contractHash = keccak256(toUtf8Bytes(content));

  // 4. Create contract draft
  const result = await rwa_sdk.cnft.createContract({
    contractController: alice,
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    tokenDecimals: 18,
    counterparties: [bob, charlie],
    contractNft: contractNft,
    contractHash: contractHash,
    url: url
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
  status: 'created',
  contractNft: '0xA00ee5b948E3E1cb293f57F7008721353416Aa2E',
  contractId: '1234567890',
  contractController: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  counterparties: [
    '0xbA9274C766A5961C40bB4a3e0e107699EE9Dab9C',
    '0x68af027F5AaE3b1B6ff770b87aB7ac360b54ad40'
  ],
  content: {
    hash: '0x...',
    url: 'https://example.com'
  },
  fee: {
    token: '0x...',
    tokenDecimals: 18,
    setupAmount: 1000000000000000000n,
    balanceBefore: 1000000000000000000n,
    balanceAfter: 0n,
    humanTokenDelta: '1.0'
  },
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Note: the contract ID is deterministic based on initiator, counterparties, content hash, and URL.
