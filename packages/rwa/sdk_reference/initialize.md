# SDK Installation Tutorial
Before interacting with the packaged sdk, please read the [users](../docs/users/) portion of the docs page to have proper background.

## Set up TS ENV
### 1. New Project
```bash
npm init -y
npm pkg set type=module
```

### 2. Install packages
```
npm install peaq-network-rwa-0.0.1.tgz
npm i -D typescript tsx @types/node
npm i dotenv
```

### 3. Add a TypeScript config
```
touch tsconfig.json
```
Add the following into the file:
```js
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "sourceMap": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Update scripts in `package.json`.
The `src/index.ts` is the executable file.
```js
    "scripts": {
        "dev": "tsx watch src/index.ts",
        "start": "tsx src/index.ts",
        "typecheck": "tsc -p tsconfig.json --noEmit"
    },
```
### 5. Create source file
```
mkdir src
touch src/index.ts
```

## Set up JS ENV
### 1. Initialize node env
```
npm init -y
npm pkg set type=module
```
### 2. Install packages
```
npm install peaq-network-rwa-0.0.1.tgz
npm i dotenv
```
### 3. Create source file
```
mkdir src
touch src/index.js
```

## Execute
For both TS/JS environments your next steps are
### Create .env file
Next we will create the `.env` file where we store `VARIABLES_LIKE_THIS`. Make sure you add the corresponding variables named in the sdk code into this same file.
We also add a gitignore to make sure you don't accidently post secrets.
```
touch .env
touch .gitignore
```
Add to `.env`:
```
ADMIN_PRIVATE_KEY=""
ALICE_PRIVATE_KEY=""
```
Add to `.gitignore`:
```
.env
```

### TS Execution
Copy one of the examples with the proper authority into `src/index.ts` for execution and run with:
```
npm start
```

### JS Execution
Copy one of the examples with the proper authority into `src/index.js` for execution and run with:
```
node src/index.js
```

## `new RWA(opts)`

Initialize the peaq RWA SDK for a specific chain. The instance wires module addresses for that chain and exposes module entry points. A Provider is required at initialization and is used for read operations; write operations require an explicit Signer.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **chainId** | `Chain` | Required | The Implementation Target network. `Chain.AGUNG` (9990) or `Chain.PEAQ` (3338). |
| **provider** | `Provider` | Required | An ethers Provider used for read-only calls across modules. |


### Usage
#### TypeScript
```Typescript
import { RWA, Chain, type SDKInit } from '@peaq-network/rwa';
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL!);
const init: SDKInit = { chainId: Chain.AGUNG, provider: provider };
const rwa_sdk = new RWA(init);
console.log(rwa_sdk);
```


#### ESM JavaScript
Default setup in JS guide with `"type": "module",` set via cmd: `npm pkg set type=module`
```js
import { RWA, Chain } from "@peaq-network/rwa";
import { JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });
console.log(rwa_sdk);
```

#### Common JavaScript
Optional setup to use **cjs**. Remove `"type": "module",` from your `package.json`.
```js
const { RWA, Chain } = require('@peaq-network/rwa');
const { JsonRpcProvider } = require('ethers');

const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);
const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider: provider });
console.log(rwa_sdk);
```