import type { Signer, TransactionReceipt } from "ethers";

export type CreateVault = {
    vaultDeployer: Signer
    vaultController: string;
    vaultFactory: string;
    infoDesk: string;
    trustedClaimIssuers: string[];
    tokenName: string;
    tokenSymbol: string;
    payoutToken: string;
}

export type CreateVaultResult = {
    status: 'created';
    vault: string;
    token: string;
    distributor: string;
    receipt: TransactionReceipt;
}

// export type CreateVaultAndToken = {
//     admin: Signer;
//     name: string;
//     symbol: string;
//     irs: string;
//     tokenIdentity: string;
//     claimIssuers: string[];
//     claimTopics: number[];
// }

// export type CreateVaultAndTokenResult = {
//     vault: string;
//     token: string;
//     receipt: TransactionReceipt;
// }



// export type ApproveVaultAsOperator = {
//     machineNFT: string;
//     tokenOwner: Signer;
//     vault: string;
// }

// export type ApproveVaultAsOperatorResult = {
//     result: string;
//     receipt: TransactionReceipt;
// }

// export type MintSecurityTokens = {
//     tokenOwner: Signer;
//     vault: string;
//     machineNFTs: string[];
//     tokenIds: number[];
//     amount: number;
// }

// export type MintSecurityTokensResult = {
//     result: string;
// }

export type UnpauseToken = {
    vaultDeployer: Signer;
    vaultFactory: string;
    vault: string;
}

export type UnpauseTokenResult = {
    status: 'unpaused';
    vault: string;
    vaultFactory: string;
    unpausedBy: string;
    receipt: TransactionReceipt;
}


// export type BatchTransfer = {
//     token: string;
//     sender: Signer;
//     recipients: string[];
//     amounts: Array<string | number>;
// }

// export type BatchTransferResult = {
//     result: string;
// }

export type PauseToken = {
    vaultDeployer: Signer;
    vaultFactory: string;
    vault: string;
}

export type PauseTokenResult = {
    status: 'paused';
    vault: string;
    vaultFactory: string;
    pausedBy: string;
    receipt: TransactionReceipt;
}

export type RegisterIdentity = {
    vaultDeployer: Signer;
    vault: string;
    subject: string;
    subjectIdentity: string;
    country: string;
}

export type RegisterIdentityResult = {
    status: 'registered';
    vault: string;
    identityRegistry: string;
    subject: string;
    subjectIdentity: string;
    country: string;
    registeredBy: string;
    receipt: TransactionReceipt;
}

export type NftApproval = {
    machineController: Signer;
    nft: string;
    vault: string;
    tokenIds: string[];
}

export type NftApprovalResult = {
    status: 'approved';
    nft: string;
    vault: string;
    newlyApprovedTokenIds: string[];
    receipts: TransactionReceipt[];
}

export type DepositAndMint = {
    vaultController: Signer;
    vault: string;
    rwaNfts: string[];
    tokenIds: string[];
    amount: number;
}

export type DepositAndMintResult = {
    status: 'deposited_and_minted';
    vault: string;
    controller: string;
    rwaNfts: string[];
    tokenIds: string[];
    amount: number;
    receipt: TransactionReceipt;
}

export type EnsureTransferFeeAllowance = {
    allowanceSigner: Signer;
    vault: string
    token: string;
    erc20: string;
    transferAmountHuman: string;
}

export type EnsureTransferFeeAllowanceResult = {
    status: 'already_sufficient' | 'approved';
    vault: string;
    feeToken: string;
    transfer: {
        token: string;
        amountHuman: string;
        amountUnits: bigint;
        tokenDecimals: number;
      };
    fee: {
        requiredAllowance: bigint;
        allowanceBefore: bigint;
        allowanceAfter: bigint;
    };
    approvedBy: string;
    receipt?: TransactionReceipt;
}

export type Transfer = {
    from: Signer;
    to: string;
    token: string;
    transferAmountHuman: string;
}

export type TransferResult = {
    status: 'transferred';
    token: string;
    sender: string;
    recipient: string;
    amount: {
        human: string;
        units: bigint;
        decimals: number;
      };
    receipt: TransactionReceipt;
}

export type DepositYield = {
    depositorSigner: Signer;
    vault: string;
    erc20: string;
    decimals: number;
    humanReadableAmount: string;
}

export type DepositYieldResult = {
    status: 'deposited';
    vault: string;
    rewardDistributor: string;
    depositor: string;
    token: {
        address: string;          // erc20
        decimals: number;
      };
    amount: {
        human: string;
        units: bigint;
    };
    approval: {
        status: 'skipped' | 'approved';
        spender: string;          // rewardDistributorAddr
        allowanceBefore?: bigint;
        allowanceAfter?: bigint;
    };
    receipt: TransactionReceipt;
    
}

export type ClaimYield = {
    claimerSigner: Signer;
    vault: string;
}

export type ClaimYieldResult = {
    status: 'claimed';
    vault: string;
    rewardDistributor: string;
    claimer: string;
    receipt: TransactionReceipt;
}

export type ClaimYieldTo = {
    claimerSigner: Signer;
    vault: string;
    to: string;
}

export type ClaimYieldToResult = {
    status: 'claimed';
    vault: string;
    rewardDistributor: string;
    claimer: string;
    recipient: string;
    receipt: TransactionReceipt;
}