## `vault.nftApproval(NftApproval)`

Approve a Vault as operator for specific Machine/Contract NFT token IDs by calling `approve` per token. This sends transactions from the NFT owner/controller.

### NftApproval Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineController** | `Signer` | Required | Owner/controller signer that grants approvals. Must be connected to a provider. |
| **nft** | `string` | Required | Machine NFT or Contract NFT contract address. |
| **vault** | `string` | Required | Vault address to approve as operator. |
| **tokenIds** | `string[]` | Required | Token IDs to approve. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `approved` | Status of the operation. |
| **nft** | `string` | NFT contract address. |
| **vault** | `string` | Vault address approved for the token IDs. |
| **newlyApprovedTokenIds** | `string[]` | Token IDs approved in this call. |
| **receipts** | `TransactionReceipt[]` | Transaction receipts (one per token ID). |


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

  // 1. Machine Controller
  const controller = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Approve the vault for specific MNFT token IDs
  const result = await rwa_sdk.vault.nftApproval({
    machineController: controller,
    nft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    tokenIds: [
      "1262843802665614120367007478296348432923457422026",
      "880598419457374294774049460835571533031091411284"
    ]
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

  // 1. Machine Controller
  const controller = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Approve the vault for specific MNFT token IDs
  const result = await rwa_sdk.vault.nftApproval({
    machineController: controller,
    nft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    tokenIds: [
      "1262843802665614120367007478296348432923457422026",
      "880598419457374294774049460835571533031091411284"
    ]
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
  nft: '0xaBB3961281123C336596153C4dfE83E11498fc54',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  newlyApprovedTokenIds: [
    '1262843802665614120367007478296348432923457422026',
    '880598419457374294774049460835571533031091411284'
  ],
  receipts: [
    ContractTransactionReceipt { ... },
    ContractTransactionReceipt { ... }
  ]
}
```

Notes:
- This approves specific token IDs (not `setApprovalForAll`).
- For Contract NFTs, pass the Contract NFT address and its token IDs.