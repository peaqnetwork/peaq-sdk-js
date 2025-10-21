working code:

```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Alice Signer
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

    // 2. Get Bob's eoa and identity
    const bob = process.env.BOB_PUBLIC_ADDRESS;

    // 4. Mint Security Tokens
    const result = await rwa_sdk.vaults.transfer({
        token: "0xa26A27df75b1074a54d1BaB2f6e49059954E796E",
        sender: alice,
        recipientAddr: bob,
        amount: 10
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```