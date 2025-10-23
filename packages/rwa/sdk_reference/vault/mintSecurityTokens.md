## `vaults.mintSecurityTokens(MintSecurityTokens)`

Deposit an array of Machine NFTs into the vault and mint the corresponding amount of T-REX tokens.

### MintSecurityTokens Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **tokenOwner** | `Signer` | Required | Owner of the Machine NFTs and recipient of the minted tokens. |
| **vault** | `string` | Required | MachineVault address. |
| **machineNFTs** | `string[]` | Required | Addresses of the ERC721 Machine NFT contracts. |
| **tokenIds** | `number[]` | Required | Token IDs of the ERC721 Machine NFTs to deposit. |
| **amount** | `number` | Required | Amount of T-REX tokens to mint. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **result** | `string` | Human-readable summary of the mint operation. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type MintSecurityTokens } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Token Owner Signer
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 2. Mint Security Tokens
  const mintSecurityTokens: MintSecurityTokens = {
    tokenOwner: alice,
    vault: "0x26c13E26Fe20fc47f60B298b9F891F379E65631A",
    machineNFTs: [
      "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
      "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97"
    ],
    tokenIds: [12, 13],
    amount: 1000
  }
  const result = await rwa_sdk.vaults.mintSecurityTokens(mintSecurityTokens);
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

  // 1. Token Owner Signer
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 2. Mint Security Tokens
  const result = await rwa_sdk.vaults.mintSecurityTokens({
    tokenOwner: alice,
    vault: "0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a",
    machineNFTs: [
      "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
      "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
      "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97"
    ],
    tokenIds: [5, 6, 7],
    amount: 1000
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
  result: 'Minted 1000 security tokens for vault: 0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a'
}
```

Notes:
- Ensure the vault has been approved as operator for the provided `machineNFTs` by the `tokenOwner`.
- Ensure `machineNFTs` and `tokenIds` arrays align by index.