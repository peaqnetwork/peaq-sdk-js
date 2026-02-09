## `vault.ensureTransferFeeAllowance(EnsureTransferFeeAllowance)`

Ensure an ERC20 allowance is set to pay the vault transfer fee for a given token transfer. If the allowance is insufficient, it submits an approval transaction.

### EnsureTransferFeeAllowance Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **allowanceSigner** | `Signer` | Required | Signer that pays the transfer fee. Must be connected to a provider. |
| **vault** | `string` | Required | Vault address that computes the transfer fee. |
| **token** | `string` | Required | Security token address being transferred. |
| **erc20** | `string` | Required | ERC20 token address used to pay the fee. |
| **transferAmountHuman** | `string` | Required | Transfer amount in human-readable units (e.g., `"2"`). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `already_sufficient` or `approved` | Whether an approval was sent. |
| **vault** | `string` | Vault address. |
| **feeToken** | `string` | ERC20 token address used for fees. |
| **transfer** | `{ token: string; amountHuman: string; amountUnits: bigint; tokenDecimals: number }` | Transfer amount details. |
| **fee** | `{ requiredAllowance: bigint; allowanceBefore: bigint; allowanceAfter: bigint }` | Fee allowance details. |
| **approvedBy** | `string` | Address that submitted the approval (or current allowance owner). |
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

  // 1. Allowance signer (pays transfer fee)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Ensure transfer fee allowance
  const result = await rwa_sdk.vault.ensureTransferFeeAllowance({
    allowanceSigner: alice,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    token: "0x811247945f5fcBD9068F71298a69e71B2A4Ba66f",
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    transferAmountHuman: "2"
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

  // 1. Allowance signer (pays transfer fee)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Ensure transfer fee allowance
  const result = await rwa_sdk.vault.ensureTransferFeeAllowance({
    allowanceSigner: alice,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    token: "0x811247945f5fcBD9068F71298a69e71B2A4Ba66f",
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    transferAmountHuman: "2"
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
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  feeToken: '0x...',
  transfer: {
    token: '0x811247945f5fcBD9068F71298a69e71B2A4Ba66f',
    amountHuman: '2',
    amountUnits: 2000000000000000000n,
    tokenDecimals: 18
  },
  fee: {
    requiredAllowance: 1000000000000000000n,
    allowanceBefore: 0n,
    allowanceAfter: 1000000000000000000n
  },
  approvedBy: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
