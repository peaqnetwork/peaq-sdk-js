## Set up TS ENV (todo)
SOMETHING LIKE:

1. Make Fresh Project
```bash
npm init -y
npm pkg set type=module
```

2. Install packages
TODO


npm i -D typescript tsx @types/node
npm i dotenv

3. Add a TypeScript config
tsconfig.json:
```js
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": ".",
    "verbatimModuleSyntax": true
  },
  "include": ["stream.ts", "listener.ts", "src/**/*"]
}
```

4. Add scripts to run TS or built JS
package.json (add these under "scripts")
```js
{
  "scripts": {
    "build": "tsc",
    "start-stream": "node dist/stream.js",
    "start-listener": "node dist/listener.js"
  }
}
```

5. Build and compile
Build:
```
npm run build
```
Execute:
```
npm run
```

## Set up JS ENV
1. Initialize node env
```
npm init
```
2. Set to module, install and create .env
```
npm pkg set type=module
npm install dotenv
touch .env
```
3. Install rwa sdk and create file
```
npm install @peaq-network/rwa
touch index.js
```
4. Execute code
```
node index.js
```

## `new RWA(opts)`

Initialize the peaq RWA SDK for a specific chain. The instance wires module addresses for that chain and exposes module entry points. Signers/providers are supplied per call when executing write/read operations.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **chainId** | `Chain` | Required | The Implementation Target network. `Chain.AGUNG` (9990) or `Chain.PEAQ` (3338). |


### Usage
#### TypeScript
```js
import { RWA, Chain } from "@peaq-network/rwa";

// Initialize SDK on Agung
const rwa_sdk = new RWA({ chainId: Chain.AGUNG });

```


#### JavaScript
```js
import { RWA, Chain } from "@peaq-network/rwa";

// Initialize SDK on Agung
const rwa_sdk = new RWA({ chainId: Chain.AGUNG });

