## `onchainid.getClaim(GetClaim)`

Fetch a claim from an ONCHAINID identity by `claimId`. This is a read-only call to the identity contract.

### GetClaim Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **subjectIdentity** | `string` | Required | The ONCHAINID identity contract address to read from. |
| **claimId**  | `string` | Required | The claim identifier, computed as `keccak256(abi.encode(issuer, topic))`. |

Note: The `claimId` is derived from the issuer contract address and the claim topic to uniquely identify a claim on an identity. In Solidity this is `keccak256(abi.encode(_issuer, _topic))`. In ethers you can compute it via `keccak256(new AbiCoder().encode(["address","uint256"], [issuer, topic]))`.

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **claim** | `Claim` | The full claim payload read from the identity contract. |

### Usage
#### TypeScript
```Typescript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type GetIdentity, type GetClaim } from '@peaq-network/rwa';
import { JsonRpcProvider, AbiCoder, keccak256 } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
    const rwa_sdk = new RWA(init);

    // 1. Resolve the identity for an EOA (or use a known identity address)
    const alice = process.env.ALICE_PUBLIC_ADDRESS!;
    const identityRes = await rwa_sdk.onchainid.getIdentity({ subject: alice } as GetIdentity);
    if (identityRes.status !== 'found') throw new Error('Identity not found');
    const identity = identityRes.identity;

    // 2. Compute claimId = keccak256(abi.encode(issuer, topic))
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!;
    const topic = 666;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));

    // 3. Fetch claim
    const result = await rwa_sdk.onchainid.getClaim({
      subjectIdentity: identity,
      claimId
    } as GetClaim);
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

#### JavaScript
```js
import 'dotenv/config';
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider, AbiCoder, keccak256 } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Resolve the identity for an EOA (or use a known identity address)
    const alice = process.env.ALICE_PUBLIC_ADDRESS;
    const identityRes = await rwa_sdk.onchainid.getIdentity({ subject: alice });
    if (identityRes.status !== 'found') throw new Error('Identity not found');
    const identity = identityRes.identity;

    // 2. Compute claimId = keccak256(abi.encode(issuer, topic))
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;
    const topic = 666;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));

    // 3. Fetch claim
    const result = await rwa_sdk.onchainid.getClaim({
      subjectIdentity: identity,
      claimId: claimId
    });
    console.log("Result", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Example outputs
```
Result {
  claim: {
    topic: 666,
    scheme: 1,
    issuer: '0x187EB39e1aF4B9a79936635dBa52984af98464a9',
    signature: '0x4bab329329ea682e4ac675d9ebab2b8ec597124b98b5085a4e8f83104ce064d4728771567752a75db8ad75552579f0f805913f1f756947f25a8e85d67ce3055e1b',
    data: '0x252ec8044814d556905cc1587f4a375a2acfe3f84a17d7d104accd32ee25b3b6',
    uri: 'https://example.com/kyc'
  }
}
```

