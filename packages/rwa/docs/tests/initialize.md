# Setup Test Environment
Before you can execute the integration tests locally, you must first download the dependencies locally.
## 1. Clone this repository
```
git clone https://github.com/peaqnetwork/peaq-sdk-js.git
cd packages/rwa
npm install
```
## 2. Deploy Framework
Next, you must make sure you are interacting with a deployed framework. To learn how to deploy one yourself please checkout [the guide](../sdk_maintainers/initialization.md). 

## 3. Setup `.env` file
Once you have a proper framework setup you can define a `.env` file that your local tests will reference. Below is out outline to help you fill out the proper fields for your `.env` file.
```
HTTPS_BASE_URL="https://peaq-agung.api.onfinality.io/public"

# PEAQ OWNER Admin
ADMIN_PUBLIC_ADDRESS=""
ADMIN_PRIVATE_KEY=""

# Claim Issuer
CLAIM_ISSUER_PUBLIC_ADDRESS=""
CLAIM_ISSUER_PRIVATE_KEY=""
CLAIM_ISSUER_CONTRACT_ADDRESS=""
CLAIM_ISSUER_IDENTITY_ADDRESS=""


# Alice
ALICE_PUBLIC_ADDRESS=""
ALICE_PRIVATE_KEY=""

# Bob
BOB_PUBLIC_ADDRESS=""
BOB_PRIVATE_KEY=""
```

## 4. Run tests
After following all of the steps above you can able to execute the tests with the cmd:
```
npm test
```
It will run through module execution

