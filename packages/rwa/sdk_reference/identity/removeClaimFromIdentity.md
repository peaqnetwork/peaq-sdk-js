## `onchainid.removeClaimFromIdentity(RemoveClaimFromIdentity)`

Remove a claim from an ONCHAINID identity by `claimId`. This sends a transaction to the identity contract and requires the identity owner’s signer.

### RemoveClaimFromIdentity Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **identity**      | `string`  | Required | The ONCHAINID identity contract address to modify. |
| **identityOwner** | `Signer`  | Required | The signer authorized to remove claims from the identity (owner). |
| **claimId**       | `string`  | Required | The claim identifier, computed as `keccak256(abi.encode(issuer, topic))`. |

Note: The `claimId` uniquely identifies a claim for an identity. It is derived from the issuer contract address and the claim topic: in Solidity `keccak256(abi.encode(_issuer, _topic))`. In ethers this can be reproduced with `keccak256(new AbiCoder().encode(["address","uint256"], [issuer, topic]))`.

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **receipt** | `TransactionReceipt` | The transaction receipt confirming claim removal. |
| **result**  | `string`              | A success message with the identity address. |

### Usage
#### TypeScript
```Typescript
import 'dotenv/config';
import { RWA, Chain, type SDKInit, type GetIdentity, type RemoveClaimFromIdentity } from '@peaq-network/rwa';
import { JsonRpcProvider, AbiCoder, keccak256, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
    const rwa_sdk = new RWA(init);

    // 1. Resolve the identity for an EOA (or use a known identity address)
    const alice = process.env.ALICE_PUBLIC_ADDRESS!;
    const identityRes = await rwa_sdk.onchainid.getIdentity({ eoa: alice } as GetIdentity);
    if (identityRes.status !== 'found') throw new Error('Identity not found');
    const identity = identityRes.identity;

    // 2. Identity owner signer
    const identityOwner = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);

    // 3. Compute claimId = keccak256(abi.encode(issuer, topic))
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!;
    const topic = 777;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));

    // 4. Remove claim from identity
    const result = await rwa_sdk.onchainid.removeClaimFromIdentity({
      identity,
      identityOwner,
      claimId
    } as RemoveClaimFromIdentity);
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
import { JsonRpcProvider, AbiCoder, keccak256, Wallet } from "ethers";

async function main() {
    // 0. Create rwa_sdk instance and get provider
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });

    // 1. Resolve the identity for an EOA (or use a known identity address)
    const alice = process.env.ALICE_PUBLIC_ADDRESS;
    const identityRes = await rwa_sdk.onchainid.getIdentity({ eoa: alice });
    if (identityRes.status !== 'found') throw new Error('Identity not found');
    const identity = identityRes.identity;

    // 2. Identity owner signer
    const identityOwner = new Wallet(process.env.ALICE_PRIVATE_KEY, provider);

    // 3. Compute claimId = keccak256(abi.encode(issuer, topic))
    const issuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS;
    const topic = 777;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [issuerContract, topic]));

    // 4. Remove claim from identity
    const result = await rwa_sdk.onchainid.removeClaimFromIdentity({
      identity: identity,
      identityOwner: identityOwner,
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
{
  receipt: TransactionReceipt {
    ...
    hash: '0xbfb964e21d0a8f227e62752a1a5b7cca95aff0cd992430a6213d06e6ea548b9c',
    status: 1
  },
  result: 'Successfully removed claim for Identity 0xF16b0871271C2135b4Ffc374676e74a16aaDC2c9'
}
```

