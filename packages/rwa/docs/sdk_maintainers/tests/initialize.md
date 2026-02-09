# Setup Test Environment
Before you can execute the integration tests locally, you must clone this repository download the dependencies, and deploy the framework.
## 1. Clone this repository
```
git clone https://github.com/peaqnetwork/peaq-sdk-js.git
cd packages/rwa
npm install
```
## 2. Deploy Framework
Next, you must make sure you are interacting with a deployed framework. To learn how to deploy one yourself please checkout [the guide](../deployFramework.md). 

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

# Machine Regulator
MACHINE_REGULATOR_PUBLIC_ADDRESS=""
MACHINE_REGULATOR_PRIVATE_KEY=""

# Machine Issuer
MACHINE_ISSUER_PUBLIC_ADDRESS=""
MACHINE_ISSUER_PRIVATE_KEY=""

# Alice
ALICE_PUBLIC_ADDRESS=""
ALICE_PRIVATE_KEY=""

# Bob
BOB_PUBLIC_ADDRESS=""
BOB_PRIVATE_KEY=""

# Charlie
CHARLIE_PUBLIC_ADDRESS=""
CHARLIE_PRIVATE_KEY=""
```
### Variable Definitions
- **HTTPS_BASE_URL**: The HTTPS RPC endpoint for the target chain (e.g., peaq Agung). Used by the SDK/tests to create an ethers Provider.
- **ADMIN_PUBLIC_ADDRESS**: The EOA address of the framework/admin operator account (e.g., deployer / default admin for TREX + supporting contracts).
- **ADMIN_PRIVATE_KEY**: The private key for ADMIN_PUBLIC_ADDRESS. Used to sign admin-only transactions in tests.
- **CLAIM_ISSUER_PUBLIC_ADDRESS**: The EOA address that acts as a Claim Issuer operator (the signer that issues KYC/claims on-chain).
- **CLAIM_ISSUER_PRIVATE_KEY**: The private key for CLAIM_ISSUER_PUBLIC_ADDRESS. Used to sign claim-issuer transactions in tests.
- **CLAIM_ISSUER_CONTRACT_ADDRESS**: The EVM contract address of the deployed Claim Issuer contract (the on-chain contract that records/validates claims).
- **CLAIM_ISSUER_IDENTITY_ADDRESS**: The OnChainID Identity contract address that represents the Claim Issuer as an identity (i.e., the issuer’s Identity on-chain, not their EOA).
- **MACHINE_REGULATOR_PUBLIC_ADDRESS**: Machine Regulator EOA address (authorized to add/remove issuers and update block state).
- **MACHINE_REGULATOR_PRIVATE_KEY**: Private key for MACHINE_REGULATOR_PUBLIC_ADDRESS.
- **MACHINE_ISSUER_PUBLIC_ADDRESS**: Machine Issuer that who has the authority to issuer new MachineNfts
- **MACHINE_ISSUER_PRIVATE_KEY**: Private key for MACHINE_ISSUER_PUBLIC_ADDRESS.
- **ALICE_PUBLIC_ADDRESS**: Test user EOA address for “Alice” (typically a subject/holder/participant in flows).
- **ALICE_PRIVATE_KEY**: Private key for ALICE_PUBLIC_ADDRESS.
- **BOB_PUBLIC_ADDRESS**: Test user EOA address for “Bob”.
- **BOB_PRIVATE_KEY**: Private key for BOB_PUBLIC_ADDRESS.
- **CHARLIE_PUBLIC_ADDRESS**: Test user EOA address for “Charlie”.
- **CHARLIE_PRIVATE_KEY**: Private key for CHARLIE_PUBLIC_ADDRESS.


## 4. Run tests
After following all of the steps above you can checkout the tests found inside the [tests directory](../../../tests/). Please note that the majority of these tests are integration that interact with a live network. Therefore, you may need to manually test one-by-one as some are dependent on future actions. A common flow example is given for the required dependent execution in the [full flow test](../../../tests/full_flow/rwa.fullFlow.int.test.ts).

Each test has an `it` to describe the test. To skip a particular test you may add `it.skip()`, else it will execute with the following cmd:
```
npm test
```