<!-- Run tests:

1. Create .env file in repo root:
```
HTTPS_BASE_URL="" # your RPC URL
PUBLIC_KEY=0xdef...                       # wallet address to link to identity
PRIVATE_KEY=0xabc...                      # deployer wallet private key
```


2. Create tester files
Create test cases in `/packages/rwa/test/...`


3. Execute tests
Build once `npm run -w packages/rwa build`
```
npm run -w packages/rwa test
# or watch:
npm run -w packages/rwa test:watch
``` -->


# peaq RWA SDK
Authorized parties must be in communication with the peaq network in order to be properly onboard to the deployed ONCHAINID & TREX protocol.

## Claim Issuers
1. Deploy ClaimIssuer contracts
If you are approved claim issuer, please deploy a claim issuer using the following code:
```js
import { RWA, Chain } from "@peaq-network/rwa";

async function main() {
  // 0. Create rwa_sdk instance and get provider
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG });
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  
  // 1. Deploy a ClaimIssuer
  const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY, provider);
  const { claimIssuerAddr } = await rwa_sdk.onchainid.deployClaimIssuer({
      claimIssuerSigner: claimIssuer
  });
  console.log("Deployed Claim Issuer Address:", claimIssuerAddr);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
})
```
Contact peaq directly for claim issuer address addition in the deployed `TrustedIssuersRegistry`.