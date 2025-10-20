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
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

    // 3. Get Alice Identity
    const aliceIdentity = await rwa_sdk.onchainid.getIdentity({ eoa: alice.address });

    // 4. Mint Security Tokens
    const result = await rwa_sdk.vaults.mintSecurityTokens({
        admin: admin,
        tokenOwner: alice,
        tokenOwnerIdentity: aliceIdentity.identity,
        vault: "0x5E951aE23a19E63c0B1b68D0e0d4cC9deB4DBfa9",
        token: "0xa26A27df75b1074a54d1BaB2f6e49059954E796E",
        tokenIds: [24,25,26],
        amount: 1000
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```