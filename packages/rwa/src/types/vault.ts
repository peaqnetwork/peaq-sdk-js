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
    vault: string;
    token: string;
    distributor: string;
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
    result: string;
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
    result: string;
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
    result: string;
}

export type MnftApproval = {
    machineController: Signer;
    machineNft: string;
    vault: string;
    tokenIds: string[];
}

export type MnftApprovalResult = {
    result: string;
}

export type CnftApproval = {
    contractController: Signer;
    contractNft: string;
    vault: string;
    tokenIds: string[];
}

export type CnftApprovalResult = {
    result: string;
}

export type DepositAndMint = {
    vaultController: Signer;
    vault: string;
    rwaNfts: string[];
    tokenIds: string[];
    amount: number;
}

export type DepositAndMintResult = {
    result: string;
}

export type EnsureTransferFeeAllowance = {
    allowanceSigner: Signer;
    vault: string
    token: string;
    erc20: string;
    transferAmountHuman: string;
}

export type EnsureTransferFeeAllowanceResult = {
    result: string;
}

export type Transfer = {
    from: Signer;
    to: string;
    token: string;
    transferAmountHuman: string;
}

export type TransferResult = {
    result: string;
}

export type DepositYield = {
    depositorSigner: Signer;
    vault: string;
    erc20: string;
    decimals: number;
    humanReadableAmount: string;
}

export type DepositYieldResult = {
    result: string;
}

export type ClaimYield = {
    claimerSigner: Signer;
    vault: string;
}

export type ClaimYieldResult = {
    result: string;
}

export type ClaimYieldTo = {
    claimerSigner: Signer;
    vault: string;
    to: string;
}

export type ClaimYieldToResult = {
    result: string;
}