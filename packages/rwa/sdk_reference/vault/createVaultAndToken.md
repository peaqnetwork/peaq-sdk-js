solidity docs:
```
/**
* @dev Creates a new MachineVault and its associated token, allowing the caller to specify
*      existing Identity Registry Storage (IRS) and ONCHAINID addresses. Passing zero addresses
*      instructs the TREX factory to auto-deploy missing components.
* @notice The caller must be the owner of the factory.
* @param name The name of the token.
* @param symbol The symbol of the token.
* @param irs The address of the Identity Registry Storage.
* @param tokenIdentity The address of the ONCHAINID.
* @param claimIssuers The addresses of the claim issuers.
* @param claimTopics The topics of the claim issuers.
* @return vaultAddr The address of the MachineVault.
* @return tokenAddr The address of the token.
*/
```


working code:

```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet, ZeroAddress } from "ethers";

const CT_KYC_APPROVED = 666;


async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Admin wallet
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // 2. Create Vault and Token
    const result = await rwa_sdk.vaults.createVaultAndToken({
        admin: admin,
        name: "Alice Vault",
        symbol: "ALICE",
        irs: ZeroAddress,
        tokenIdentity: ZeroAddress,
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


Result:
```
{
  vault: '0x613eCe33c1e654c171155ead9fb37BD676671Fc4',
  token: '0xc66806cDF298B11548DC01F21fA04eE066b670c3'
}
```