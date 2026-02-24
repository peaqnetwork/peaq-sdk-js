## `vault.pauseToken(PauseToken)`

Pause the security token for a vault via the Vault Factory. This sends a transaction from the vault deployer.

### PauseToken Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **vaultDeployer** | `Signer` | Required | Deployer signer authorized to pause. Must be connected to a provider. |
| **vaultFactory** | `string` | Required | Vault Factory contract address. |
| **vault** | `string` | Required | Vault address whose token will be paused. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `paused` | Status of the operation. |
| **vault** | `string` | Vault address whose token was paused. |
| **vaultFactory** | `string` | Vault Factory contract address. |
| **pausedBy** | `string` | Address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the pause call. |


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
  const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Pause token
  const result = await rwa_sdk.vault.pauseToken({
    vaultDeployer: vaultDeployer,
    vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3"
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
  const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Pause token
  const result = await rwa_sdk.vault.pauseToken({
    vaultDeployer: vaultDeployer,
    vaultFactory: "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53",
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3"
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
  status: 'paused',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  vaultFactory: '0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53',
  pausedBy: '0x8BCfa2e9FC4aCa66fCF36Bcf47646E5Fb8d74BA0',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Notes:
- The vault deployer must be authorized in the Vault Factory.
