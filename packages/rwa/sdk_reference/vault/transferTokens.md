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

    // 2. Get Alice Signer
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY, provider);

    // 3. Get recipient eoa and identity
    const aliceIdentity = await rwa_sdk.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_KEY });


    // 4. Mint Security Tokens
    const result = await rwa_sdk.vaults.transfer({
        admin: admin,
        vault: "0x228547b933d75Ca6109052Ce9be571C0dF8b8890",
        token: "0x3B2db6E4d351e5f7B26f611e61edf2E31bFAe256",
        sender: bob,
        recipientAddr: process.env.ALICE_PUBLIC_KEY,
        recipientIdentity: aliceIdentity.identity,
        amount: 1
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```