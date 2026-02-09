## `vault.depositAndMint(DepositAndMint)`

Deposit an array of RWA NFTs into the vault and mint the corresponding amount of security tokens.

### DepositAndMint Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **vaultController** | `Signer` | Required | Vault controller signer that owns the NFTs. Must be connected to a provider. |
| **vault** | `string` | Required | Vault address. |
| **rwaNfts** | `string[]` | Required | Addresses of the RWA NFT contracts (MNFT/CNFT). |
| **tokenIds** | `string[]` | Required | Token IDs of the NFTs to deposit. |
| **amount** | `number` | Required | Amount of security tokens to mint. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `deposited_and_minted` | Status of the operation. |
| **vault** | `string` | Vault address. |
| **controller** | `string` | Vault controller address. |
| **rwaNfts** | `string[]` | NFT contract addresses provided. |
| **tokenIds** | `string[]` | Token IDs deposited. |
| **amount** | `number` | Amount of security tokens minted. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the deposit and mint call. |


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

  // 1. Vault controller
  const vaultController = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Deposit NFTs and mint tokens
  const result = await rwa_sdk.vault.depositAndMint({
    vaultController: vaultController,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    rwaNfts: [
      "0xaBB3961281123C336596153C4dfE83E11498fc54",
      "0xaBB3961281123C336596153C4dfE83E11498fc54",
      "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E"
    ],
    tokenIds: [
      "1262843802665614120367007478296348432923457422026",
      "880598419457374294774049460835571533031091411284",
      "110399289532161649501907442204937966168773206671183427730650359857010370852178"
    ],
    amount: 10000
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

  // 1. Vault controller
  const vaultController = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Deposit NFTs and mint tokens
  const result = await rwa_sdk.vault.depositAndMint({
    vaultController: vaultController,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    rwaNfts: [
      "0xaBB3961281123C336596153C4dfE83E11498fc54",
      "0xaBB3961281123C336596153C4dfE83E11498fc54",
      "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E"
    ],
    tokenIds: [
      "1262843802665614120367007478296348432923457422026",
      "880598419457374294774049460835571533031091411284",
      "110399289532161649501907442204937966168773206671183427730650359857010370852178"
    ],
    amount: 10000
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
  status: 'deposited_and_minted',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  controller: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  rwaNfts: [
    '0xaBB3961281123C336596153C4dfE83E11498fc54',
    '0xaBB3961281123C336596153C4dfE83E11498fc54',
    '0xA00ee5b948E3E1cb293f57F7008721353416Aa2E'
  ],
  tokenIds: [
    '1262843802665614120367007478296348432923457422026',
    '880598419457374294774049460835571533031091411284',
    '110399289532161649501907442204937966168773206671183427730650359857010370852178'
  ],
  amount: 10000,
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Notes:
- Ensure the vault has been approved as operator for the provided NFTs by the `vaultController`.
- Ensure `rwaNfts` and `tokenIds` arrays align by index.