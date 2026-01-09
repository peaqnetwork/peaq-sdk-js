# Deploy Framework
The following is only ever to be done once by the sdk maintainers. The tutorial has been written to make it as reproducible as possible for future iterations. We will provide a brief overview that demonstrates the steps taken in order to reproduce on your own machine.
## 1. Clone peaq's RWA framework.
Clone the most recent dev branch of [peaq-rwa-evm](https://github.com/peaqnetwork/peaq-rwa-evm/tree/dev). The following cmds are to be executed on a local terminal of the linked code that has been cloned.
### Install packages:
```
npm install
```
### Compile Contracts
```
npx hardhat compile
```
### Generate Typechain
```
npx hardhat typechain
```

## 2. Add network & private key
In the `hardhat.config.ts` file in the cloned repository, we can now add the network of our choice. In this example we will deploy on peaq's test network, `agung`, whose configuration file is:
```JavaScript
    agung: {
      url: 'https://peaq-agung.api.onfinality.io/public',
      accounts: [
        'framework_owner_private_key'
      ],
      chainId: 9990,
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
```

## 3. Deploy MVP V2
Once the dependencies have been installed, the contracts compiled, the typechain generated, and framework owner key added - we can now deploy the framework. You can do so using the following cmd:
```
npx hardhat deploy-mvp-test-setup --network agung
```
While the framework is deploying, contract addresses will be logged to the console. Make sure to save the terminal output in a safe location as it will be needed to configure the SDK in the next step. The logs that has been used to link the contracts to this SDK has been saved under `log_example`.

## 4. Update ABIs and Contract Configs
After you have deployed the framework, you will need to update the abis at `./src/abis/` directory in this rwa sdk codebase. You can do so by copying over the interface files that were generated in `peaq-rwa-evm` inside artifacts after compilation. Once that has been completed, you must updated the `./src/addresses/` with the new addresses that were logged during the deployment of the framework in step 3.


## 5. Add new functionality
For the new functionality in the RWA Framework, additional modules / functions may need to be added.

## 6. Testing
After new modules / functions has been written create test cases to ensure proper behavior.

## 7. Create package
Once all local tests have passed you may build the package in this repository following the instructions:
### Build:
```
npm run build
```
### Pack:
```
npm pack -w @peaq-network/rwa
```


# Updates:
TODO - will add relevant information here when updates are needed to a previously deployed RWA framework (... info desk)