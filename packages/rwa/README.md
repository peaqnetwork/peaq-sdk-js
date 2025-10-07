Run tests:

1. Create .env file in repo root:
```
HTTPS_BASE_URL="" # your RPC URL
PUBLIC_KEY=0xdef...                       # wallet address to link to identity
PRIVATE_KEY=0xabc...                      # deployer wallet private key
```


2. Create tester files
Create test cases in `/packages/rwa/test/...`


3. Execute tests
Build once `npm run -w packages/rwa build`
```
npm run -w packages/rwa test
# or watch:
npm run -w packages/rwa test:watch
```