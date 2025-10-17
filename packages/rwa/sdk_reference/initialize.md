## `new RWA(opts)`

Initialize the peaq RWA SDK for a specific chain. The instance wires module addresses for that chain and exposes module entry points. Signers/providers are supplied per call when executing write/read operations.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **chainId** | `Chain` | Required | Target network. `Chain.AGUNG` (9990) or `Chain.PEAQ` (3338). |


### Usage
```js
import { RWA, Chain } from "@peaq-network/rwa";

// Initialize SDK on Agung
const rwa_sdk = new RWA({ chainId: Chain.AGUNG });

```

### Example output
```txt
RWA instance initialized for chainId 9990 (AGUNG)
Modules available: trex, vaults, mnfts, onchainid
```