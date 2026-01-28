

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { JsonRpcProvider, Wallet, AbiCoder, keccak256, toUtf8Bytes, parseUnits } from 'ethers';

import { RWA } from '../../src/rwa';
import { Chain } from '../../src/enums/core';
import { ClaimTopics } from '../../src/enums/claimTopics';
import { ClaimScheme } from '../../src/enums/claimSchemes';

describe.sequential('rwa.fullFlow [integration]', () => {    
  it('runs the full flow', async () => {
    // 0. Create RWA instance, get provider and get all participants wallets
    const provider = new JsonRpcProvider(process.env.HTTPS_BASE_URL);   
    const rwa_sdk = new RWA({ chainId: Chain.AGUNG, provider });

    // For more information about these participants please refer to the sdk_reference/workflows/common_flow.md file
    const admin = new Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
    const claimIssuer = new Wallet(process.env.CLAIM_ISSUER_PRIVATE_KEY!, provider);
    const machineIssuer = new Wallet(process.env.MACHINE_ISSUER_PRIVATE_KEY!, provider);

    const alice = new Wallet(process.env.ALICE_PRIVATE_KEY!, provider);
    const bob = new Wallet(process.env.BOB_PRIVATE_KEY!, provider);
    const charlie = new Wallet(process.env.CHARLIE_PRIVATE_KEY!, provider);

    // 1. Create Identities for the new participants
    const aliceIdentity = await identityCreation(rwa_sdk, admin, alice.address);
    const bobIdentity = await identityCreation(rwa_sdk, admin, bob.address);
    const charlieIdentity = await identityCreation(rwa_sdk, admin, charlie.address);

    // 2. Add Claims to the identities for KYC
    await addClaimToIdentity(rwa_sdk, claimIssuer, alice, aliceIdentity);
    await addClaimToIdentity(rwa_sdk, claimIssuer, bob, bobIdentity);
    await addClaimToIdentity(rwa_sdk, claimIssuer, charlie, charlieIdentity);


    // 3. Machine Registration for Alice
    const knownMachineNft = "0xaBB3961281123C336596153C4dfE83E11498fc54"; // logged after the Machine Issuer was added to the PeaqRwaNft contract (setup)
    const machineIds = await issueMachineNft(rwa_sdk, knownMachineNft, machineIssuer, alice);
    // const machineIds = ['1004354596407721988785058448123243826773126676574', '1276419267490181419884424543816884848811565363142']

    // 4. Create a ContractNft between Alice, Bob and Charlie
    const knownContractNft = "0xA00ee5b948E3E1cb293f57F7008721353416Aa2E"; // logged after the ContractNft contract was added to the PeaqRwaNft contract (setup)
    const contractId = await createContractNft(rwa_sdk, knownContractNft, alice, bob, charlie);

    // 5. Vault Creation for Alice
    const knownVaultFactory = "0x5C5Db5CcF63ed6C11063385070C8FD2C990BFd53";
    const knownInfoDesk = "0x3F2c72Ba389632079DA68Ee13E8b955d69D1B5c1";
    const { vault, token, distributor } = await createVault(rwa_sdk, admin, alice, knownVaultFactory, knownInfoDesk);

    // 6. Unpause Token for Vault (done by admin)
    await unpauseToken(rwa_sdk, admin, knownVaultFactory, vault);

    // 7. Register Identities that will interact with the vault / token (Alice, Bob, Charlie)
    await registerIdentities(rwa_sdk, admin, vault, [alice.address, bob.address, charlie.address]);

    // 8. Set vault approval for mnft / cnft per tokenId
    await setApproval(rwa_sdk, alice, vault, knownMachineNft, knownContractNft, machineIds, contractId);

    // 9. Deposit and Mint tokens for Alice
    await depositAndMint(rwa_sdk, alice, vault, knownMachineNft, knownContractNft, machineIds, contractId);

    // 10. Alice transfers tokens to Bob and Charlie
    await transfer(rwa_sdk, alice, bob.address, vault, token, "10");
    await transfer(rwa_sdk, alice, charlie.address, vault, token, "10");

    // 11. Alice deposits yield to the vault (peaq by default)
    await depositYield(rwa_sdk, alice, vault, "1");

    // 12. Bob claims yield to the vault
    await claimYield(rwa_sdk, bob, vault);

    // 13. Alice deposits yield to vault
    await depositYield(rwa_sdk, alice, vault, "1");

    // 14. Bob Claims to Charlie
    await claimYieldTo(rwa_sdk, bob, vault, charlie.address);

  }, 900_000); // 15 min buffer
});

async function identityCreation(rwa_sdk: RWA, admin: Wallet, subject: string) {
    // 1. Create identity
    const salt = 'identity-' + Date.now().toString();
    const result = await rwa_sdk.onchainid.createIdentity({ idFactoryAdmin: admin, subject: subject, deploymentSalt: salt });
    console.log(result);
    expect(['created', 'exists']).toContain(result.status);
    expect(result.identity).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // 2. Check if the identity was created
    const identity = await rwa_sdk.onchainid.getIdentity({ subject: subject });
    expect(result.identity).toBe(identity.identity);
    return result.identity;
}

async function addClaimToIdentity(rwa_sdk: RWA, claimIssuer: Wallet, subjectSigner: Wallet, subjectIdentity: string) {
    // 1. Get the previously deployed Claim Issuer contract address
    const claimIssuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!;

    // 2. Generate KYC claim (name, lastName, dateOfBirth, placeOfBirth does not matter for this test)
    const { claim, signature } = await rwa_sdk.onchainid.issueKycClaim({
        claimIssuerSigner: claimIssuer,
        claimIssuerContract: claimIssuerContract,
        subjectIdentity: subjectIdentity,
        name: subjectSigner.address,
        lastName: subjectSigner.address,
        dateOfBirth: '1990-01-01',
        placeOfBirth: subjectSigner.address,
        uri: 'https://example.com/kyc'
    });

    // 3. Identity owner signs and submits addClaim
    const result = await rwa_sdk.onchainid.addClaimToIdentity({
        identityController: subjectSigner,
        subjectIdentity: subjectIdentity,
        claim: claim,
        claimSignature: signature,
    });
    console.log(result);
    expect(result.receipt.status).toBe(1);
    expect(result.claimId).toBeDefined();
    expect(result.claimId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(['added', 'updated']).toContain(result.status);

    // 4. get claim to check it has been added to subject's identity contract
    const topic = ClaimTopics.CT_KYC_APPROVED;
    const abiCoder = new AbiCoder();
    const claimId = keccak256(abiCoder.encode(["address", "uint256"], [claimIssuerContract, topic]));
    expect(claimId).toBe(result.claimId);

    // 5. Fetch claim
    const fetchedClaim = await rwa_sdk.onchainid.getClaim({
      subjectIdentity: subjectIdentity,
      claimId: claimId
    });

    expect(fetchedClaim).toBeDefined();
    expect(typeof fetchedClaim.claim.topic).toBe('number');
    expect(fetchedClaim.claim.topic).toBe(ClaimTopics.CT_KYC_APPROVED);

    expect(typeof fetchedClaim.claim.scheme).toBe('number');
    expect(fetchedClaim.claim.scheme).toBe(ClaimScheme.ECDSA);

    expect(typeof fetchedClaim.claim.issuer).toBe('string');
    expect(fetchedClaim.claim.issuer.toLowerCase()).toBe(String(claimIssuerContract).toLowerCase());
    expect(/^0x[a-fA-F0-9]{40}$/.test(fetchedClaim.claim.issuer)).toBe(true);

    expect(typeof fetchedClaim.claim.signature).toBe('string');
    expect(/^0x[0-9a-fA-F]+$/.test(fetchedClaim.claim.signature)).toBe(true);
    expect(fetchedClaim.claim.signature.length).toBeGreaterThanOrEqual(132); // 65-byte ECDSA

    expect(typeof fetchedClaim.claim.data).toBe('string');
    expect(fetchedClaim.claim.data.startsWith('0x')).toBe(true);
    expect(fetchedClaim.claim.data.length).toBeGreaterThan(10);

    expect(fetchedClaim.claim.uri).toBe('https://example.com/kyc');
}

async function issueMachineNft(rwa_sdk: RWA, knownMachineNft: string, machineIssuer: Wallet, alice: Wallet) {
    const result = await rwa_sdk.mnft.ensureMachineNftAllowance({
        machineController: alice,
        machineNft: knownMachineNft,
        machineValueHuman: "10",
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        machineCount: 2
    });
    console.log(result);
    expect(['approved', 'already_sufficient']).toContain(result.status);
    expect(result.machineNft).toBe(knownMachineNft);
    expect(result.feeToken).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result.feePerMachine).toBe(10000000000000000000n);
    expect(result.requiredAllowance).toBe(20000000000000000000n);
    expect(result.currentAllowance).toBe(20000000000000000000n);

    // 4. Create MachineNFT(s) for Alice
    const result2 = await rwa_sdk.mnft.issueMachineNft({
        machineIssuer: machineIssuer,
        machineNft: knownMachineNft,
        machineValueHuman: "10",
        machineControllerAddr: alice.address,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        salt: Math.floor(Math.random() * 10000),
        count: 2
    });
    console.log(result2);
    expect(['issued']).toContain(result2.status);
    expect(result2.machineNft).toBe(knownMachineNft);
    expect(result2.machineIssuer).toBe(machineIssuer.address);
    expect(result2.machineController).toBe(alice.address);
    expect(result2.machineValue.human).toBe("10");
    expect(result2.machineValue.units).toBe(10000000000000000000n);
    expect(result2.machineValue.tokenDecimals).toBe(18);
    expect(result2.machineValue.feeToken).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result2.count).toBe(2);
    expect(result2.machines).toBeDefined();
    expect(result2.machines.length).toBe(2);


    // create a return object of machineIds
    const machineIds = result2.machines.map((machine) => machine.machineId);
    return machineIds
}

async function createContractNft(rwa_sdk: RWA, knownContractNft: string, alice: Wallet, bob: Wallet, charlie: Wallet) {
    const url = "https://example.com";
    const content = `This is a test contract ${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const hashDigest = keccak256(toUtf8Bytes(content));
    const result = await rwa_sdk.cnft.createContract({
        contractController: alice,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        tokenDecimals: 18,
        counterparties: [bob.address, charlie.address],
        contractNft: knownContractNft,
        contractHash: hashDigest,
        url: url
    });
    console.log(result);
    expect(['created']).toContain(result.status);
    expect(result.contractNft).toBe(knownContractNft);
    expect(result.contractId).toBeDefined();
    expect(result.contractId).toMatch(/^\d+$/);
    expect(result.contractController).toBe(alice.address);
    expect(result.counterparties).toBeDefined();
    expect(result.counterparties.length).toBe(2);
    expect(result.counterparties).toContain(bob.address);
    expect(result.counterparties).toContain(charlie.address);
    expect(result.content.hash).toBe(hashDigest);
    expect(result.content.url).toBe(url);
    expect(result.fee.token).toBe(rwa_sdk.getAddresses().erc20.peaq);
    expect(result.fee.tokenDecimals).toBe(18);
    expect(result.fee.setupAmount).toBe(1000000000000000000n);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);

    // bob and charlie sign the contract
    const signResultBob = await rwa_sdk.cnft.signContract({
        counterpartySigner: bob,
        contractNft: knownContractNft,
        contractId: result.contractId
    });
    console.log(signResultBob);
    expect(['signed']).toContain(signResultBob.status);
    expect(signResultBob.contractId).toBe(result.contractId);
    expect(signResultBob.counterpartySigner).toBe(bob.address);
    expect(signResultBob.receipt).toBeDefined();

    const signResultCharlie = await rwa_sdk.cnft.signContract({
        counterpartySigner: charlie,
        contractNft: knownContractNft,
        contractId: result.contractId
    });
    console.log(signResultCharlie);
    expect(['completed']).toContain(signResultCharlie.status);
    expect(signResultCharlie.contractId).toBe(result.contractId);
    expect(signResultCharlie.counterpartySigner).toBe(charlie.address);
    expect(signResultCharlie.receipt).toBeDefined();

    return [result.contractId];
}

async function createVault(rwa_sdk: RWA, admin: Wallet, alice: Wallet, knownVaultFactory: string, knownInfoDesk: string) {
    // Same claim issuer as before in our MVP case
    const claimIssuerContract = process.env.CLAIM_ISSUER_CONTRACT_ADDRESS!;

    // Create Vault; Can modify the token name, symbol, payout token, etc. here
    const result = await rwa_sdk.vault.createVault({
      vaultDeployer: admin,
      vaultController: alice.address,
      vaultFactory: knownVaultFactory,
      infoDesk: knownInfoDesk,
      trustedClaimIssuers: [claimIssuerContract],
      tokenName: "Test Token Q",
      tokenSymbol: "TTQ",
      payoutToken: rwa_sdk.getAddresses().erc20.peaq,
    });
    console.log(result);
    expect(['created']).toContain(result.status);
    expect(result.vault).toBeDefined();
    expect(result.vault).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.distributor).toBeDefined();
    expect(result.distributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);

    return { vault: result.vault, token: result.token, distributor: result.distributor };
}

async function unpauseToken(rwa_sdk: RWA, vaultDeployer: Wallet, knownVaultFactory: string, vault: string) {
    // Unpause Token
    const result = await rwa_sdk.vault.unpauseToken({
        vaultDeployer: vaultDeployer,
        vaultFactory: knownVaultFactory,
        vault: vault
    });
    console.log(result);
    expect(['unpaused']).toContain(result.status);
    expect(result.vault).toBe(vault);
    expect(result.vaultFactory).toBe(knownVaultFactory);
    expect(result.unpausedBy).toBe(vaultDeployer.address);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);
}

async function registerIdentities(rwa_sdk: RWA, vaultDeployer: Wallet, vault: string, subjects: string[]) {

    // Iterate through the identities and register them
    for (const subject of subjects) {
     const identity = await rwa_sdk.onchainid.getIdentity({ subject: subject });
      const result = await rwa_sdk.vault.registerIdentity({
        vaultDeployer: vaultDeployer,
        vault: vault,
        subject: subject,
        subjectIdentity: identity.identity!,
        country: "0"
      });
      console.log(result);
      expect(['registered']).toContain(result.status);
      expect(result.vault).toBe(vault);
      expect(result.subject).toBe(subject);    
      expect(result.subjectIdentity).toBe(identity.identity!);
      expect(result.country).toBe("0");
      expect(result.identityRegistry).toBeDefined();
      expect(result.identityRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.registeredBy).toBe(vaultDeployer.address);
      expect(result.receipt).toBeDefined();
      expect(result.receipt.status).toBe(1);
    }
}

async function setApproval(rwa_sdk: RWA, controller: Wallet, vault: string, knownMachineNft: string, knownContractNft: string, machineIds: string[], contractId: string[]) {
    const mnftApprovalResult = await rwa_sdk.vault.mnftApproval({
        machineController: controller,
        machineNft: knownMachineNft,
        vault: vault,
        tokenIds: machineIds
      });
      console.log(mnftApprovalResult);
      expect(['approved']).toContain(mnftApprovalResult.status);
      expect(mnftApprovalResult.machineNft).toBe(knownMachineNft);
      expect(mnftApprovalResult.vault).toBe(vault);
      expect(mnftApprovalResult.newlyApprovedTokenIds).toBe(machineIds);
      expect(mnftApprovalResult.receipts).toBeDefined();
      expect(mnftApprovalResult.receipts.length).toBe(machineIds.length);
      expect(mnftApprovalResult.receipts[0].status).toBe(1);


    const cnftApprovalResult = await rwa_sdk.vault.cnftApproval({
        contractController: controller,
        contractNft: knownContractNft,
        vault: vault,
        tokenIds: contractId
      });
      console.log(cnftApprovalResult);
      expect(['approved']).toContain(cnftApprovalResult.status);
      expect(cnftApprovalResult.contractNft).toBe(knownContractNft);
      expect(cnftApprovalResult.vault).toBe(vault);
      expect(cnftApprovalResult.newlyApprovedTokenIds).toBe(contractId);
      expect(cnftApprovalResult.receipts).toBeDefined();
      expect(cnftApprovalResult.receipts.length).toBe(contractId.length);
      expect(cnftApprovalResult.receipts[0].status).toBe(1);
}

async function depositAndMint(rwa_sdk: RWA, vaultController: Wallet, vault: string, knownMachineNft: string, knownContractNft: string, machineIds: string[], contractId: string[]) {
    const tokenIds = machineIds.concat(contractId);
    const controllerAddr = await vaultController.getAddress();

    // Deposit and Mint tokens, can set the amount to mint
    const result = await rwa_sdk.vault.depositAndMint({
        vaultController: vaultController,
        vault: vault,
        rwaNfts: [knownMachineNft, knownMachineNft, knownContractNft],
        tokenIds: tokenIds,
        amount: 10000
      });
      console.log(result);
      expect(['deposited_and_minted']).toContain(result.status);
      expect(result.vault).toBe(vault);
      expect(result.rwaNfts[0]).toBe(knownMachineNft);
      expect(result.rwaNfts[1]).toBe(knownMachineNft);
      expect(result.rwaNfts[2]).toBe(knownContractNft);
      expect(result.controller).toBe(controllerAddr);
      expect(result.tokenIds).toBe(tokenIds);
      expect(result.amount).toBe(10000);
      expect(result.receipt).toBeDefined();
      expect(result.receipt.status).toBe(1);
}

async function transfer(rwa_sdk: RWA, from: Wallet, to: string, vault: string, token: string, amount: string) {
    const fromAddr = await from.getAddress();
    // Ensure transfer fee allowance is set
    const result = await rwa_sdk.vault.ensureTransferFeeAllowance({
        allowanceSigner: from,
        vault: vault,
        token: token,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        transferAmountHuman: amount
      });
      console.log(result);
      expect(['approved']).toContain(result.status);
      expect(result.vault).toBe(vault);
      expect(result.feeToken).toBe(rwa_sdk.getAddresses().erc20.peaq);
      expect(result.transfer.token).toBe(token);
      expect(result.transfer.amountHuman).toBe(amount);
      expect(result.transfer.amountUnits).toBe(parseUnits(amount, 18));
      expect(result.transfer.tokenDecimals).toBe(18);
      expect(result.fee.feeAmount).toBe(1000000000000000000n);

      // Transfer tokens
      const resp = await rwa_sdk.vault.transfer({
        from: from,
        to: to,
        token: token,
        transferAmountHuman: amount
      });
      console.log(resp);
      expect(['transferred']).toContain(resp.status);
      expect(resp.token).toBe(token);
      expect(resp.sender).toBe(fromAddr);
      expect(resp.recipient).toBe(to);
      expect(resp.amount.human).toBe(amount);
      expect(resp.amount.units).toBe(parseUnits(amount, 18));
      expect(resp.amount.decimals).toBe(18);
      expect(resp.receipt).toBeDefined();
      expect(resp.receipt.status).toBe(1);
}

async function depositYield(rwa_sdk: RWA, depositor: Wallet, vault: string, amount: string) {
    const depositorAddr = await depositor.getAddress();
    const result = await rwa_sdk.vault.depositYield({
        depositorSigner: depositor,
        vault: vault,
        erc20: rwa_sdk.getAddresses().erc20.peaq,
        decimals: 18,
        humanReadableAmount: amount
      });
      console.log(result);
      expect(['deposited']).toContain(result.status);
      expect(result.vault).toBe(vault);
      expect(result.rewardDistributor).toBeDefined();
      expect(result.rewardDistributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.depositor).toBe(depositorAddr);
      expect(result.token.address).toBe(rwa_sdk.getAddresses().erc20.peaq);
      expect(result.token.decimals).toBe(18);
      expect(result.amount.human).toBe(amount);
}

async function claimYield(rwa_sdk: RWA, claimer: Wallet, vault: string) {
    const claimerAddr = await claimer.getAddress();
    const result = await rwa_sdk.vault.claimYield({
        claimerSigner: claimer,
        vault: vault
    });
    console.log(result);
    expect(['claimed']).toContain(result.status);
    expect(result.vault).toBe(vault);
    expect(result.rewardDistributor).toBeDefined();
    expect(result.rewardDistributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.claimer).toBe(claimerAddr);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);
}

async function claimYieldTo(rwa_sdk: RWA, claimer: Wallet, vault: string, to: string) { 
    const claimerAddr = await claimer.getAddress();
    const result = await rwa_sdk.vault.claimYieldTo({
        claimerSigner: claimer,
        vault: vault,
        to: to
    });
    console.log(result);
    expect(['claimed']).toContain(result.status);
    expect(result.vault).toBe(vault);
    expect(result.rewardDistributor).toBeDefined();
    expect(result.rewardDistributor).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.claimer).toBe(claimerAddr);
    expect(result.recipient).toBe(to);
    expect(result.receipt).toBeDefined();
    expect(result.receipt.status).toBe(1);
}