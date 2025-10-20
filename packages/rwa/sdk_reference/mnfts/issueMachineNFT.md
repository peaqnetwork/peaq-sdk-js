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

    // 3. Create MachineNFT for Alice
    const result = await rwa_sdk.mnfts.issueMachineNFT({
        machineIssuer: admin,
        machineOwner: alice,
        metadata: {
            brand: 'Bosch1',
            model: 'X2001',
            serialNumber: 'SN1234567891',
            uri: 'ipfs://Qm...xyz1',
            timestamp: "1231231231"
    }
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```