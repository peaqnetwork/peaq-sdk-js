working code:

```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // 2. Get Bob's eoa and identity
    const bob = await rwa_sdk.onchainid.getIdentity({ eoa: process.env.BOB_PUBLIC_ADDRESS});

    // 3. Add Identity to Token Registry
    const result = await rwa_sdk.vaults.registerIdentity({
        admin: admin,
        token: "0xa26A27df75b1074a54d1BaB2f6e49059954E796E",
        eoa: process.env.BOB_PUBLIC_ADDRESS,
        identity: bob.identity
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```