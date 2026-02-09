## `rwanft.removeMachineIssuer(RemoveMachineIssuer)`

Remove a Machine Issuer from the PeaqRwaNft contract. This sends a transaction signed by a Machine Regulator.

### RemoveMachineIssuer Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineRegulatorSigner** | `Signer` | Required | Machine Regulator signer authorized to remove a Machine Issuer. Must be connected to a provider. |
| **machineIssuer** | `string` | Required | EOA address of the Machine Issuer to remove. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `removed` | Status of the operation. |
| **peaqRwaNft** | `string` | PeaqRwaNft contract address. |
| **machineIssuer** | `string` | Machine Issuer address that was removed. |
| **removedBy** | `string` | Machine Regulator address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the remove operation. |


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
  const machineRegulator = new Wallet(process.env.MACHINE_REGULATOR_PRIVATE_KEY!, provider);

  // 2. Machine Issuer address to remove
  const machineIssuer = process.env.MACHINE_ISSUER_PUBLIC_ADDRESS!;

  // 3. Remove Machine Issuer
  const result = await rwa_sdk.rwanft.removeMachineIssuer({
    machineRegulatorSigner: machineRegulator,
    machineIssuer: machineIssuer
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

  // 2. Machine Issuer address to remove
  const machineIssuer = process.env.MACHINE_ISSUER_PUBLIC_ADDRESS;

  // 3. Remove Machine Issuer
  const result = await rwa_sdk.rwanft.removeMachineIssuer({
    machineRegulatorSigner: machineRegulator,
    machineIssuer: machineIssuer
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
  status: 'removed',
  peaqRwaNft: '0x9a7e2c5B4F9bE3C1dA7b5a6F8e2D3c4B5A6F7E8D',
  machineIssuer: '0x3c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D',
  removedBy: '0x8F7e6D5c4B3a2D1c0B9a8E7f6D5c4B3A2D1C0b9A',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
