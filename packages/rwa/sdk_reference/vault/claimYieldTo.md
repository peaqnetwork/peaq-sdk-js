## `vault.claimYieldTo(ClaimYieldTo)`

Claim yield from a vault’s reward distributor and send it to a specified address.

### ClaimYieldTo Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **claimerSigner** | `Signer` | Required | Signer that submits the claim. Must be connected to a provider. |
| **vault** | `string` | Required | Vault address. |
| **to** | `string` | Required | Recipient address for the claimed yield. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `claimed` | Status of the operation. |
| **vault** | `string` | Vault address. |
| **rewardDistributor** | `string` | Reward distributor contract address. |
| **claimer** | `string` | Address that submitted the transaction. |
| **recipient** | `string` | Address that received the yield. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the claim call. |


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

  // 1. Claimer signer
  const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);

  // 2. Recipient of yield
  const charlie = process.env.CHARLIE_PUBLIC_ADDRESS!

  // 3. Claim yield to Bob
  const result = await rwa_sdk.vault.claimYieldTo({
    claimerSigner: bob,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    to: charlie
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

  // 1. Claimer signer
  const bob = new Wallet(process.env.BOB_PRIVATE_KEY, provider);

  // 2. Recipient of yield
  const charlie = process.env.CHARLIE_PUBLIC_ADDRESS

  // 3. Claim yield to Bob
  const result = await rwa_sdk.vault.claimYieldTo({
    claimerSigner: bob,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    to: charlie
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
  status: 'claimed',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  rewardDistributor: '0x...',
  claimer: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  recipient: '0xbA9274C766A5961C40bB4a3e0e107699EE9Dab9C',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
