## `rwanft.setMachineNftBlockState(SetMachineNftBlockState)`

Set the block state of a Machine Issuer address or a Machine NFT contract address in the PeaqRwaNft contract. This sends a transaction signed by a Machine Regulator.

### SetMachineNftBlockState Type Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **machineRegulatorSigner** | `Signer` | Required | Machine Regulator signer authorized to update the block state. Must be connected to a provider. |
| **issuerOrContractNft** | `string` | Required | EOA address of a Machine Issuer or Machine NFT contract address. |
| **blocked** | `boolean` | Required | `true` to block, `false` to unblock. |

### Returns
| Field | Type | Description |
|-------|------|-------------|
| **status** | `updated` | Status of the operation. |
| **peaqRwaNft** | `string` | PeaqRwaNft contract address. |
| **target** | `string` | The address whose block state was updated. |
| **blocked** | `boolean` | The resulting block state. |
| **updatedBy** | `string` | Machine Regulator address that submitted the transaction. |
| **receipt** | `TransactionReceipt` | Transaction receipt of the update operation. |


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

  // 2. Target Machine Issuer or Machine NFT contract
  const target = process.env.MACHINE_ISSUER_PUBLIC_ADDRESS!;

  // 3. Block target
  const result = await rwa_sdk.rwanft.setMachineNftBlockState({
    machineRegulatorSigner: machineRegulator,
    issuerOrContractNft: target,
    blocked: true
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

  // 2. Target Machine Issuer or Machine NFT contract
  const target = process.env.MACHINE_ISSUER_PUBLIC_ADDRESS;

  // 3. Block target
  const result = await rwa_sdk.rwanft.setMachineNftBlockState({
    machineRegulatorSigner: machineRegulator,
    issuerOrContractNft: target,
    blocked: true
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
  status: 'updated',
  peaqRwaNft: '0x9a7e2c5B4F9bE3C1dA7b5a6F8e2D3c4B5A6F7E8D',
  target: '0x3c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D',
  blocked: true,
  updatedBy: '0x8F7e6D5c4B3a2D1c0B9a8E7f6D5c4B3A2D1C0b9A',
  receipt: ContractTransactionReceipt {
    ...
  }
}
```
