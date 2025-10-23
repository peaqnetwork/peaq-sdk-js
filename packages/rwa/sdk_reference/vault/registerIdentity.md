## `vaults.registerIdentity(RegisterIdentity)`

Register an ONCHAINID for a user in a token's Identity Registry. Must be called by a wallet authorized as an agent/operator for the registry.

### RegisterIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **admin** | `Signer` | Required | Authorized agent of the Identity Registry. |
| **token** | `string` | Required | Address of the token whose Identity Registry will be updated. |
| **eoa** | `string` | Required | User's EOA to be associated with the identity. |
| **identity** | `string` | Required | ONCHAINID contract address for the user. |
| **country** | `string` | Required | Country code for the investor (e.g., `'0'`). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **result** | `string` | Human-readable summary. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the registration call. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type RegisterIdentity } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
  // 0. Create RWA instance and provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Admin wallet (must be an authorized agent)
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Get EOA and identity
  const alice = await rwa_sdk.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_ADDRESS! });

  // 3. Register Bob's identity in the token's Identity Registry
  const registerIdentity: RegisterIdentity = {
    admin: admin,
    token: "0x5493Ba57D7A52583A43791183775e7EDa9c7373C",
    eoa: process.env.ALICE_PUBLIC_ADDRESS!,
    identity: alice.identity,
    country: '0'
  }
  const result = await rwa_sdk.vaults.registerIdentity(registerIdentity);
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

  // 1. Admin wallet (must be an authorized agent)
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Get EOA and identity
  const alice = await rwa_sdk.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_ADDRESS });

  // 3. Register Bob's identity in the token's Identity Registry
  const result = await rwa_sdk.vaults.registerIdentity({
    admin: admin,
    token: "0xa26A27df75b1074a54d1BaB2f6e49059954E796E",
    eoa: process.env.ALICE_PUBLIC_ADDRESS,
    identity: alice.identity,
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
  result: 'Registered identity for recipient: 0x095982dD1F182E60E0705cbC9F9E99a358414Da1',
  receipt: TransactionReceipt {
    hash: '0x43a399bf942b6d71fbe5ced81c7f7c6550fd01792be6d904507cb102d3e8e346',
    status: 1,
    ...
  }
}
```

Notes:
- Ensure the user does not already have an identity registered for this token.
- `admin` must be configured as an agent of the Identity Registry.