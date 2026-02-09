## `mnft.ensureMachineNftAllowance(EnsureMachineNftAllowance)`

Ensure the ERC20 allowance for the Machine NFT registration account is sufficient to cover the registration fee for N machines of a given value. If the allowance is insufficient, it submits an approval transaction.

### EnsureMachineNftAllowance Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineController** | `Signer` | Required | Signer that will pay the ERC20 fee. Must be connected to a provider. |
| **machineNft** | `string` | Required | Machine NFT contract address. |
| **machineValueHuman** | `string` | Required | Machine value in human-readable units (e.g., `"10"`). |
| **erc20** | `string` | Required | ERC20 token address used to pay the fee. |
| **tokenDecimals** | `number` | Required | ERC20 token decimals. |
| **machineCount** | `number` | Required | Number of machines to register. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `approved` or `already_sufficient` | Whether an approval was sent. |
| **machineNft** | `string` | Machine NFT contract address. |
| **feeToken** | `string` | ERC20 token address used for fees. |
| **feePerMachine** | `bigint` | Fee per machine in token units. |
| **requiredAllowance** | `bigint` | Total allowance required for `machineCount`. |
| **currentAllowance** | `bigint` | Current allowance after the check/approval. |
| **receipt** | `TransactionReceipt` | Only present when `status` is `'approved'`. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Machine controller (pays ERC20 fee via allowance)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Ensure allowance
  const result = await rwa_sdk.mnft.ensureMachineNftAllowance({
    machineController: alice,
    machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
    machineValueHuman: "10",
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    tokenDecimals: 18,
    machineCount: 2
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
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Machine controller (pays ERC20 fee via allowance)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Ensure allowance
  const result = await rwa_sdk.mnft.ensureMachineNftAllowance({
    machineController: alice,
    machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
    machineValueHuman: "10",
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    tokenDecimals: 18,
    machineCount: 2
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
  status: 'approved',
  machineNft: '0xaBB3961281123C336596153C4dfE83E11498fc54',
  feeToken: '0x...',
  feePerMachine: 10000000000000000000n,
  requiredAllowance: 20000000000000000000n,
  currentAllowance: 20000000000000000000n,
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
