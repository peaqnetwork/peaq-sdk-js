## `mnft.registerMachine(RegisterMachine)`

Register one or more Machine NFTs to a designated controller. This sends transactions from the Machine Issuer and charges the ERC20 fee from the controller.

### RegisterMachine Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineIssuer** | `Signer` | Required | Machine Issuer signer that submits the mint transactions. Must be connected to a provider. |
| **machineNft** | `string` | Required | Machine NFT contract address. |
| **machineValueHuman** | `string` | Required | Machine value in human-readable units (e.g., `"10"`). |
| **machineControllerAddr** | `string` | Required | EOA address that will control/own the machines. |
| **erc20** | `string` | Required | ERC20 token address used to pay the fee. |
| **tokenDecimals** | `number` | Required | ERC20 token decimals. |
| **salt** | `number` | Required | Salt used to derive the DID document. |
| **count** | `number` | Required | Number of machines to register. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `issued` | Status of the operation. |
| **machineNft** | `string` | Machine NFT contract address. |
| **machineIssuer** | `string` | Machine Issuer address that submitted the transaction(s). |
| **machineController** | `string` | Machine controller/owner address. |
| **machineValue** | `{ human: string; units: bigint; tokenDecimals: number; feeToken: string }` | Machine value details. |
| **count** | `number` | Number of machines issued. |
| **machines** | `{ machineId: string; did?: string; receipt?: TransactionReceipt }[]` | Per-machine results and receipts. |
| **feesPaid** | `bigint` | ERC20 fees paid by the controller. |
| **startingBalance** | `bigint` | Controller ERC20 balance before issuance. |
| **endingBalance** | `bigint` | Controller ERC20 balance after issuance. |
| **humanTokenDelta** | `string` | Human-readable fee delta. |


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

  // 1. Machine Issuer wallet
  const machineIssuer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Machine controller (receives NFT and pays ERC20 fee via allowance)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 3. Register MachineNFT(s) for Alice
  const result = await rwa_sdk.mnft.registerMachine({
    machineIssuer: machineIssuer,
    machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
    machineValueHuman: "10",
    machineControllerAddr: alice.address,
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    tokenDecimals: 18,
    salt: Math.floor(Math.random() * 10000),
    count: 2
  });

  console.log('Result', result);
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

  // 1. Machine Issuer wallet
  const machineIssuer = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Machine controller (receives NFT and pays ERC20 fee via allowance)
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 3. Register MachineNFT(s) for Alice
  const result = await rwa_sdk.mnft.registerMachine({
    machineIssuer: machineIssuer,
    machineNft: "0xaBB3961281123C336596153C4dfE83E11498fc54",
    machineValueHuman: "10",
    machineControllerAddr: alice.address,
    erc20: rwa_sdk.getAddresses().erc20.peaq,
    tokenDecimals: 18,
    salt: Math.floor(Math.random() * 10000),
    count: 2
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
  status: 'issued',
  machineNft: '0xaBB3961281123C336596153C4dfE83E11498fc54',
  machineIssuer: '0x8BCfa2e9FC4aCa66fCF36Bcf47646E5Fb8d74BA0',
  machineController: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  machineValue: {
    human: '10',
    units: 10000000000000000000n,
    tokenDecimals: 18,
    feeToken: '0x...'
  },
  count: 2,
  machines: [
    { machineId: '1', did: 'did:peaq:...', receipt: ContractTransactionReceipt { ... } },
    { machineId: '2', did: 'did:peaq:...', receipt: ContractTransactionReceipt { ... } }
  ],
  feesPaid: 20000000000000000000n,
  startingBalance: 100000000000000000000n,
  endingBalance: 80000000000000000000n,
  humanTokenDelta: '20.0'
}
```