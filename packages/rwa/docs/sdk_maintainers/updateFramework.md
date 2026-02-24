# Update Framework
The framework is defined and created at the [peaq-rwa-evm](https://github.com/peaqnetwork/peaq-rwa-evm/tree/dev) repository. Whenever new contracts, flows, or methods are added the sdk must be updated appropriately. Below is a rough estimate of what this could look like:

## 1. Add new functionality
For the new functionality in the RWA Framework, additional modules / functions may need to be added.

## 2. Testing
After new modules / functions has been written create test cases to ensure proper behavior. Please checkout the [tests docs](./tests/initialize.md) for more information.

## 3. Build project
Once all local tests have passed you may build the package in this repository following the instructions:
### Build:
```
npm run build
```
This will create `dist` file that allows for `cjs`, `esm`, and `ts` interactions

## 4. Create package
Now finally, we can pack together the build project in order to test a shippable executable file:
### Pack:
```
npm pack -w @peaq-network/rwa
```

# Updates:
TODO - will add relevant information here when updates are needed to a previously deployed RWA framework (... info desk)