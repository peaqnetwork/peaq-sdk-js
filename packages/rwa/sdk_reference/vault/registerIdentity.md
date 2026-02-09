## `vault.registerIdentity(RegisterIdentity)`

Register an ONCHAINID for a user in the vault's Identity Registry. Must be called by a wallet authorized as an agent/operator for the registry.

### RegisterIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **vaultDeployer** | `Signer` | Required | Authorized agent of the Identity Registry. Must be connected to a provider. |
| **vault** | `string` | Required | Vault address whose Identity Registry will be updated. |
| **subject** | `string` | Required | User's EOA to be associated with the identity. |
| **subjectIdentity** | `string` | Required | ONCHAINID contract address for the user. |
| **country** | `string` | Required | Country code for the investor (e.g., `'0'`). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `registered` | Status of the operation. |
| **vault** | `string` | Vault address. |
| **identityRegistry** | `string` | Identity Registry contract address. |
| **subject** | `string` | User's EOA associated with the identity. |
| **subjectIdentity** | `string` | ONCHAINID contract address for the user. |
| **country** | `string` | Country code. |
| **registeredBy** | `string` | Address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the registration call. |


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

  // 1. Vault deployer (must be an authorized agent)
  const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Get EOA and identity
  const alice = await rwa_sdk.onchainid.getIdentity({ subject: process.env.ALICE_PUBLIC_ADDRESS! });

  // 3. Register Alice's identity in the vault's Identity Registry
  const result = await rwa_sdk.vault.registerIdentity({
    vaultDeployer: vaultDeployer,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    subject: process.env.ALICE_PUBLIC_ADDRESS!,
    subjectIdentity: alice.identity,
    country: '0'
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

  // 1. Vault deployer (must be an authorized agent)
  const vaultDeployer = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Get EOA and identity
  const alice = await rwa_sdk.onchainid.getIdentity({ subject: process.env.ALICE_PUBLIC_ADDRESS });

  // 3. Register Alice's identity in the vault's Identity Registry
  const result = await rwa_sdk.vault.registerIdentity({
    vaultDeployer: vaultDeployer,
    vault: "0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3",
    subject: process.env.ALICE_PUBLIC_ADDRESS,
    subjectIdentity: alice.identity,
    country: '0'
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
  status: 'registered',
  vault: '0x4b76a8F7cdB68a9353c83e18077E6bbC760243B3',
  identityRegistry: '0x...',
  subject: '0x16cd4D21537eD8F33bE08271A9FA6DCC426709b2',
  subjectIdentity: '0x...',
  country: '0',
  registeredBy: '0x8BCfa2e9FC4aCa66fCF36Bcf47646E5Fb8d74BA0',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Notes:
- Ensure the user does not already have an identity registered for this vault.
- `vaultDeployer` must be configured as an agent of the Identity Registry.