working code:

```js
import 'dotenv/config';
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';


async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Get Claim Issuer Admin wallet
    const claimIssuer = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);     // issuer of the KYC claim

    // 2. Get User to KYC
    const alice = await rwa.onchainid.getIdentity({ eoa: process.env.ALICE_PUBLIC_KEY });

    // 3. Create claim + signature
    const { claim, signature } = await rwa.onchainid.issueKycClaim({
        claimIssuer: claimIssuer,
        issuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS,
        identity: alice.identity,
        name: 'Alice',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        placeOfBirth: 'New York',
        uri: 'https://example.com/kyc'
    });
    console.log('Claim:', claim);
    console.log('Signature:', signature);

    // 4. Add the signed claim to the identity on-chain
    const aliceSigner = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);     // controller of the ONCHAINID
    const { receipt } = await rwa.onchainid.addClaimToIdentity({
        identity: alice.identity,
        claim: claim,
        kycSignature: signature,
        identityOwner: aliceSigner
    });

    console.log('Added claim. txHash:', receipt.hash);
}

main().catch(console.error);
```