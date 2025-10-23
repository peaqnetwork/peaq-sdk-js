## `vaults.createVaultAndToken(CreateVaultAndToken)`

Create a new MachineVault and its associated security token. You may pass existing IRS and ONCHAINID addresses or `ZeroAddress` to auto-deploy missing components.

### CreateVaultAndToken Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **admin** | `Signer` | Required | Factory owner/admin who is authorized to deploy vaults and tokens. |
| **name** | `string` | Required | Token name. |
| **symbol** | `string` | Required | Token symbol. |
| **irs** | `string` | Required | Address of the Identity Registry Storage, or `ZeroAddress` to auto-deploy. |
| **tokenIdentity** | `string` | Required | ONCHAINID address for the token, or `ZeroAddress` to auto-deploy. |
| **claimIssuers** | `string[]` | Required | Addresses of allowed claim issuers. |
| **claimTopics** | `number[]` | Required | Allowed claim topics (e.g., `777` for KYC approved). |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **vault** | `string` | Deployed MachineVault address. |
| **token** | `string` | Deployed security token address. |


### Usage
```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet, ZeroAddress } from "ethers";

const CT_KYC_APPROVED = 777;

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Admin wallet (must be factory owner)
  const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  // 2. Create Vault and Token
  const result = await rwa_sdk.vaults.createVaultAndToken({
    admin: admin,
    name: "Alice Vault",
    symbol: "ALICE",
    irs: ZeroAddress,              // auto-deploy IRS
    tokenIdentity: ZeroAddress,    // auto-deploy ONCHAINID
    claimIssuers: [process.env.CLAIM_ISSUER_CONTRACT_ADDRESS],
    claimTopics: [CT_KYC_APPROVED]
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
  vault: '0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a',
  token: '0xeE73efbD1D4B272E4fADe0A323feE028d9439c64'
}
```

Notes:
- Admin must be the owner of the MachineVault factory.
- Passing `ZeroAddress` for `irs` and/or `tokenIdentity` instructs the factory to deploy missing components.
- Ensure provided `claimIssuers` and `claimTopics` are recognized by your compliance and registry setup.