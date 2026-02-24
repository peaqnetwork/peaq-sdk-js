## `vault.depositYield(DepositYield)`

Deposit yield into a vault’s reward distributor. This approves the ERC20 amount and then deposits it.

### DepositYield Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **depositorSigner** | `Signer` | Required | Signer that deposits yield. Must be connected to a provider. |
| **vault** | `string` | Required | Vault address. |
| **erc20** | `string` | Required | ERC20 token address used to deposit yield. |
| **decimals** | `number` | Required | ERC20 token decimals. |
| **humanReadableAmount** | `string` | Required | Amount to deposit in human-readable units (e.g., `"1"`). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `deposited` | Status of the operation. |
| **vault** | `string` | Vault address. |
| **rewardDistributor** | `string` | Reward distributor contract address. |
| **depositor** | `string` | Address that submitted the transaction. |
| **token** | `{ address: string; decimals: number }` | ERC20 token details. |
| **amount** | `{ human: string; units: bigint }` | Amount details. |
| **approval** | `{ status: 'approved'; spender: string; allowanceBefore: bigint; allowanceAfter: bigint }` | Approval details for the reward distributor. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the deposit call. |


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

  // 1. Depositor signer
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Deposit yield
  const result = await rwa_sdk.vault.depositYield({
    depositorSigner: alice,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    decimals: 18,
    humanReadableAmount: "1"
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

  // 1. Depositor signer
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Deposit yield
  const result = await rwa_sdk.vault.depositYield({
    depositorSigner: alice,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    decimals: 18,
    humanReadableAmount: "1"
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
  status: 'deposited',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  rewardDistributor: '0x...',
  depositor: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  token: { address: '0x...', decimals: 18 },
  amount: { human: '1', units: 1000000000000000000n },
  approval: {
    status: 'approved',
    spender: '0x...',
    allowanceBefore: 0n,
    allowanceAfter: 1000000000000000000n
  },
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
