Please help me write documentation similar to './sdk_reference/identity/createIdentity' for './sdk_reference/mnfts/issueMachineNFT'

with entry/return types <paste entry/return types used in sdk>:
```bash
export type GetIdentity = {
    eoa: string;
}

export type GetIdentityResult = {
    status: 'found' | 'not_found';
    identity: string;
}
```


in a working RWA framework. Some other documentation: <paste full flow docs>:
```bash
/**
 * @dev Generates and signs a KYC claim containing name, last name, date of birth and place of birth
 * @param claimIssuer The ClaimIssuer signer
 * @param identityK The Identity contract instance or its EVM address
 * @param claimIssuerK The ClaimIssuer contract instance or its EVM address
 * @param name The first name of the identity owner
 * @param lastName The last name of the identity owner
 * @param dateOfBirth The date of birth of the identity owner in ISO format (YYYY-MM-DD)
 * @param placeOfBirth The place of birth of the identity owner
 * @return An object containing the IClaim data and the KYC signature
 */
 ```


 here is the working sdk code <paste code>
 ```bash
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Alice EOA
    const aliceEoa = process.env.ALICE_PUBLIC_KEY

    // 2. Get Alice identity
    const alice = await rwa_sdk.onchainid.getIdentity({ eoa: aliceEoa });
    console.log("Alice Identity", alice);

    // 3. Get Claim Issuer Admin
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

    // 4. Get Issuer Contract
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;


    // 3. Create ONCHAINID Identity
    const result = await rwa_sdk.onchainid.issueKycClaim({
        claimIssuer: admin,
        issuerContract: issuerContract,
        identity: alice.identity,
        name: "Alice",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        placeOfBirth: "New York",
        uri: "https://example.com/kyc"
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

 ```



 with outputs: <paste output>
 ```bash
 Alice Identity {
  status: 'found',
  identity: '0x1d0FDE95e971c5c78B6f9c745a8e2791Fe0c962C'
}
Result {
  claim: {
    identity: '0x1d0FDE95e971c5c78B6f9c745a8e2791Fe0c962C',
    issuer: '0x842d57632954943304441258E94f3f089235022c',
    topic: 777,
    scheme: 1,
    data: '0x252ec8044814d556905cc1587f4a375a2acfe3f84a17d7d104accd32ee25b3b6',
    uri: 'https://example.com/kyc'
  },
  signature: '0xffd77807790d0e764bcdd2bc7661c6a3e1e016758100f4afc5d6a5f3552455791ddcfd2bd5b705c27eaa66c45ca1c0bf7b53f5a3a533b6023b8bf3f2132a363a1b'
}
```