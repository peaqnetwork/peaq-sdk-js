## `mnfts.issueMachineNFT(IssueMachineNFT)`

Mint one or more Machine NFTs to a designated owner. Handles ERC20 fee approval from the owner and sends the required native deposit per mint with the issuer's transaction.

### IssueMachineNFT Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineIssuer** | `Signer` | Required | Authorized issuer/operator who submits the mint transactions (pays native deposit). |
| **machineOwner** | `Signer` | Required | Owner/recipient of the Machine NFT(s); approves ERC20 fee spending. |
| **machineNFT** | `string` | Required | Address of the `MachineNFTs` contract. |
| **metadata** | `IMachineMetadata` | Required | Machine details: `{ brand, model, serialNumber, uri, timestamp }`. |
| **count** | `number` | Optional | Number of NFTs to mint. Defaults to `1`. |
| **fees** | `{ feePerMint: bigint; machineValue: bigint; nativeDepositPerMint: bigint; }` | Optional | Fee overrides. Values are interpreted in 18-decimal units (via `parseEther`). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **result** | `string` | Human-readable summary of the mint operation. |


### Usage
```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Admin wallet (submits tx and pays native deposit)
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Machine owner (receives NFT and pays ERC20 fee via allowance)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 3. Create MachineNFT(s) for Alice
  const result = await rwa_sdk.mnfts.issueMachineNFT({
    machineIssuer: admin,
    machineOwner: alice,
    machineNFT: "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
    metadata: {
      brand: 'Bosch1',
      model: 'X2001',
      serialNumber: 'SN1234567891',
      uri: 'ipfs://Qm...xyz1',
      timestamp: '1231231231'
    },
    count: 2,
    fees: {
      // Interpreted as 18-decimal units (e.g., 20 -> 20 ether)
      feePerMint: 20,
      machineValue: 1000,
      nativeDepositPerMint: 2
    }
  });

  console.log('Result', result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
```
Result {
  result: 'Created 2 Machine NFTs for user: 0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2'
}
```

Notes:
- Ensure the `machineNFT` contract has sufficient native balance.
- Ensure the `machineOwner` has sufficient ERC20 balance, and approves spending for the `machineNFT` contract when needed (handled automatically if allowance is insufficient).
- Ensure the `machineIssuer` has enough native tokens to cover `nativeDepositPerMint * count` and gas.
- The spender for ERC20 approval is the `machineNFT` contract address.