## `vault.createVault(CreateVault)`

Create a new Vault and its associated security token using a Vault Factory. This sends a transaction from the vault deployer.

### CreateVault Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **vaultDeployer** | `Signer` | Required | Deployer signer authorized to create vaults. Must be connected to a provider. |
| **vaultController** | `string` | Required | EOA address that will control the vault. |
| **vaultFactory** | `string` | Required | Vault Factory contract address. |
| **infoDesk** | `string` | Required | InfoDesk contract address. |
| **trustedClaimIssuers** | `string[]` | Required | Addresses of trusted Claim Issuer contracts. |
| **tokenName** | `string` | Required | Security token name. |
| **tokenSymbol** | `string` | Required | Security token symbol. |
| **payoutToken** | `string` | Required | ERC20 token address used for payouts. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `created` | Status of the operation. |
| **vault** | `string` | Deployed Vault address. |
| **token** | `string` | Deployed security token address. |
| **distributor** | `string` | Deployed reward distributor address. |
| **receipt** | `TransactionReceipt` | Transaction receipt for the creation call. |


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

  // 1. Vault deployer signer
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Vault controller
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

  // 3. Create Vault
  const result = await rwa_sdk.vault.createVault({
    vaultDeployer: admin,
    vaultController: alice.address,
    vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
    infoDesk: "0x3F2c72Ba389632079DA68Ee13E8b955d69D1B5c1",
    trustedClaimIssuers: [process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!],
    tokenName: "Test Token ABC",
    tokenSymbol: "ABC",
    payoutToken: rwa_sdk.getAddresses().erc20.peaq
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

  // 1. Vault deployer signer
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Vault controller
  const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

  // 3. Create Vault
  const result = await rwa_sdk.vault.createVault({
    vaultDeployer: admin,
    vaultController: alice.address,
    vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
    infoDesk: "0x3F2c72Ba389632079DA68Ee13E8b955d69D1B5c1",
    trustedClaimIssuers: [process.env.CLAIM_ISSUER_CONTRACT_ADDRESS],
    tokenName: "Test Token ABC",
    tokenSymbol: "ABC",
    payoutToken: rwa_sdk.getAddresses().erc20.peaq
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
  status: 'created',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  token: '0x811247945f5fcBD9068F71298a69e71B2A4Ba66f',
  distributor: '0x4210D83E736789e361DC96CC07756cb573e23CEd',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Notes:
- The Vault deployer must be authorized in the Vault Factory.
- `trustedClaimIssuers` should include Claim Issuer contracts required by compliance.