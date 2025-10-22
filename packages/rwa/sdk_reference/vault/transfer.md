## `vaults.transfer(Transfer)`

Transfer T-REX tokens between addresses, scaling the human-readable amount using the token's decimals.

### Transfer Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **token** | `string` | Required | Token address. |
| **sender** | `Signer` | Required | Sender wallet (must hold balance). |
| **recipientAddr** | `string` | Required | Recipient address. |
| **amount** | `string` or `number` | Required | Human-readable amount; scaled by token decimals. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **result** | `string` | Human-readable summary of the transfer. |


### Usage
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
  const result = await rwa_sdk.vaults.transfer({
    token: "0xeE73efbD1D4B272E4fADe0A323feE028d9439c64",
    sender: alice,
    recipientAddr: bob,
    amount: 10
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
  result: 'Transfered 10 tokens (scaled by 18 decimals) from one address to another'
}
```

Notes:
- The method fetches the token's decimals and scales the provided amount accordingly.
- Ensure the sender is allowed to transfer (compliance checks may apply).