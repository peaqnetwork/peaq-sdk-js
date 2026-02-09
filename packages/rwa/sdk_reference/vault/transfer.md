## `vault.transfer(Transfer)`

Transfer tokens between addresses, scaling the human-readable amount using the token's decimals.

### Transfer Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **from** | `Signer` | Required | Sender wallet (must hold balance). Must be connected to a provider. |
| **to** | `string` | Required | Recipient address. |
| **token** | `string` | Required | Token address. |
| **transferAmountHuman** | `string` | Required | Human-readable amount; scaled by token decimals. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `transferred` | Status of the operation. |
| **token** | `string` | Token address. |
| **sender** | `string` | Sender address. |
| **recipient** | `string` | Recipient address. |
| **amount** | `{ human: string; units: bigint; decimals: number }` | Amount details. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the transfer. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Sender
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Recipient
  const bob = process.env.BOB_PUBLIC_ADDRESS!;

  // 3. Transfer
  const result = await rwa_sdk.vault.transfer({
    from: alice,
    to: bob,
    token: "0x811247945f5fcBD9068F71298a69e71B2A4Ba66f",
    transferAmountHuman: "1"
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
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Sender
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Recipient
  const bob = process.env.BOB_PUBLIC_ADDRESS;

  // 3. Transfer
  const result = await rwa_sdk.vault.transfer({
    from: alice,
    to: bob,
    token: "0x811247945f5fcBD9068F71298a69e71B2A4Ba66f",
    transferAmountHuman: "1"
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
  status: 'transferred',
  token: '0x811247945f5fcBD9068F71298a69e71B2A4Ba66f',
  sender: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  recipient: '0xbA9274C766A5961C40bB4a3e0e107699EE9Dab9C',
  amount: {
    human: '1',
    units: 1000000000000000000n,
    decimals: 18
  },
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Notes:
- The method fetches the token's decimals and scales the provided amount accordingly.
- Ensure the sender is allowed to transfer (compliance checks may apply).