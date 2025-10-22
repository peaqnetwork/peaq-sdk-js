working code:

```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Token Owner Signer
    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

    const result = await rwa_sdk.vaults.approveVaultAsOperator({
        machineNFT: "0x1008234A9dc43A747bBe4a3100d8Ff46a7Fb6E97",
        tokenOwner: alice,
        vault: "0x5fa42Bb51c6770034a90FB5200e37e2Ce31Ba56a"
    })
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```