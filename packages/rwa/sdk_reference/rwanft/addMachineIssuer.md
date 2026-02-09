## `rwanft.addMachineIssuer(AddMachineIssuer)`

Add a Machine Issuer to the PeaqRwaNft contract. This sends a transaction signed by a Machine Regulator.

### AddMachineIssuer Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineRegulatorSigner** | `Signer` | Required | Machine Regulator signer authorized to add a Machine Issuer. Must be connected to a provider. |
| **newMachineIssuer** | `string` | Required | EOA address of the Machine Issuer to add. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `added` | Status of the operation. |
| **peaqRwaNft** | `string` | PeaqRwaNft contract address. |
| **machineIssuer** | `string` | Machine Issuer address that was added. |
| **machineNft** | `string` | Machine NFT contract address associated with the Machine Issuer. |
| **addedBy** | `string` | Machine Regulator address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the add operation. |


### Usage
#### TypeScript
```TypeScript
import 'dotenv/config';
import { RWA, Chain, type SDKInit } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
  const rwa_sdk = new RWA(init);

  // 1. Machine Regulator signer
  const machineRegulator = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

  // 2. Machine Issuer address to add
  const machineIssuer = process.env.MACHINE_ISSUER_PUBLIC_ADDRESS!;

  // 3. Add Machine Issuer
  const result = await rwa_sdk.rwanft.addMachineIssuer({
    machineRegulatorSigner: machineRegulator,
    newMachineIssuer: machineIssuer
  });
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
import { RWA, Chain } from '@peaq-network/rwa';
import { JsonRpcProvider, Wallet } from 'ethers';

async function main() {
  // 0. Create RWA instance and get provider
  const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
  const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

  // 1. Machine Regulator signer
  const machineRegulator = new Wallet(process.env.MACHINE_REGULATOR_PRIVATE_KEY, provider);

  // 2. Machine Issuer address to add
  const machineIssuer = process.env.MACHINE_ISSUER_PUBLIC_ADDRESS;

  // 3. Add Machine Issuer
  const result = await rwa_sdk.rwanft.addMachineIssuer({
    machineRegulatorSigner: machineRegulator,
    newMachineIssuer: machineIssuer
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
  status: 'added',
  peaqRwaNft: '0x9a7e2c5B4F9bE3C1dA7b5a6F8e2D3c4B5A6F7E8D',
  machineIssuer: '0x3c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D',
  machineNft: '0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6D7e8F9A0b',
  addedBy: '0x8F7e6D5c4B3a2D1c0B9a8E7f6D5c4B3A2D1C0b9A',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```

Note: the Machine Issuer address typically must already have the appropriate Role claim before being added.
