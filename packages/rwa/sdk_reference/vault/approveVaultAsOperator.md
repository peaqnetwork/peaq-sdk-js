## `vaults.approveVaultAsOperator(ApproveVaultAsOperator)`

Approve the MachineVault to operate on all of the owner's Machine NFTs (sets `setApprovalForAll(vault, true)`).

### ApproveVaultAsOperator Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineNFT** | `string` | Required | Address of the MachineNFTs contract. |
| **tokenOwner** | `Signer` | Required | Owner of the Machine NFTs granting operator approval. |
| **vault** | `string` | Required | MachineVault address to be approved as operator. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **result** | `string` | Human-readable summary. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the approval call. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type ApproveVaultAsOperator } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Token Owner Signer
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Approve the vault as operator over Alice's Machine NFTs
  const approveVaultAsOperator: ApproveVaultAsOperator = {
    machineNFT: "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
    tokenOwner: alice,
    vault: "0x26c13E26Fe20fc47f60B298b9F891F379E65631A"
  }
  const result = await rwa_sdk.vaults.approveVaultAsOperator(approveVaultAsOperator);
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

  // 1. Token Owner Signer
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Approve the vault as operator over Alice's Machine NFTs
  const result = await rwa_sdk.vaults.approveVaultAsOperator({
    machineNFT: "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
    tokenOwner: alice,
    vault: "0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a"
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
  result: 'Approved vault as operator',
  receipt: TransactionReceipt {
    hash: '0x44cce6b73fc6c9a625b75e4f279bdf2aee21f2b4d083a3e141719e953f921683',
    status: 1,
    ...
  }
}
```

Notes:
- The approval is global for all NFTs owned by `tokenOwner` in the `machineNFT` contract.
- Ensure `tokenOwner` is the intended owner granting the approval.