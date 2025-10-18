working code:

```js
import 'dotenv/config';
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';
import { AbiCoder, keccak256, getBytes, verifyMessage } from 'ethers';


async function main() {
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa = new RWA({ chainId: Chain.AGUNG, provider: provider });

  // Identity subject
  const subjectEoa = process.env.ALICE_PUBLIC_KEY;
  const subject = await rwa.onchainid.getIdentity({ eoa: subjectEoa });
  if (subject.status !== 'found') throw new Error('Identity not found');

  // Signers
  const claimIssuer = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);     // issuer of the KYC claim
  const subjectSigner = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);     // controller of the ONCHAINID

  // Create claim + signature (or reuse existing)
  const { claim, signature } = await rwa.onchainid.issueKycClaim({
    claimIssuer,
    issuerContract: process.env.CLAIM_ISSUER_CONTRACT_ADDRESS,
    identity: subject.identity,
    name: 'Alice',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    placeOfBirth: 'New York',
    uri: 'https://example.com/kyc'
  });
  console.log('Claim:', claim);
  console.log('Signature:', signature);

  // Add the signed claim to the identity on-chain
  const { receipt } = await rwa.onchainid.addClaimToIdentity({
    identity: subject.identity,
    claim: claim,
    kycSignature: signature,
    identityOwner: subjectSigner
  });

  console.log('Added claim. txHash:', receipt.hash);
}

main().catch(console.error);
```