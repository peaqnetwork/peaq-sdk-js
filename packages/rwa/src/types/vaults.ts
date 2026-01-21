import type { Signer, TransactionReceipt } from "ethers";

export type CreateVault = {
    recipient: string;
    tokenName: string;
    tokenSymbol: string;
    vaultFactory: string;
    infoDesk: string;
    trustedClaimIssuers: string[];
    owner: Signer;
    erc20Address: string;
}   

export type CreateVaultResult = {
    vault: string;
    token: string;
    distributor: string;
}

export type CreateVaultAndToken = {
    admin: Signer;
    name: string;
    symbol: string;
    irs: string;
    tokenIdentity: string;
    claimIssuers: string[];
    claimTopics: number[];
}

export type CreateVaultAndTokenResult = {
    vault: string;
    token: string;
    receipt: TransactionReceipt;
}

export type RegisterIdentity = {
    admin: Signer;
    vault: string;
    eoa: string;
    identity: string;
    country: string;
}

export type RegisterIdentityResult = {
    result: string;
}

export type ApproveVaultAsOperator = {
    machineNFT: string;
    tokenOwner: Signer;
    vault: string;
}

export type ApproveVaultAsOperatorResult = {
    result: string;
    receipt: TransactionReceipt;
}

export type MintSecurityTokens = {
    tokenOwner: Signer;
    vault: string;
    machineNFTs: string[];
    tokenIds: number[];
    amount: number;
}

export type MintSecurityTokensResult = {
    result: string;
}

export type UnpauseToken = {
    admin: Signer;
    vaultFactory: string;
    vault: string;
}

export type UnpauseTokenResult = {
    result: string;
    receipt: TransactionReceipt;
}


export type Transfer = {
    token: string;
    sender: Signer;
    recipientAddr: string;
    amount: string | number;
}

export type TransferResult = {
    result: string;
}

export type BatchTransfer = {
    token: string;
    sender: Signer;
    recipients: string[];
    amounts: Array<string | number>;
}

export type BatchTransferResult = {
    result: string;
}

export type PauseToken = {
    admin: Signer;
    vaultFactory: string;
    vault: string;
}

export type PauseTokenResult = {
    result: string;
    receipt: TransactionReceipt;
}

export type MnftApprovalForAll = {
    owner: Signer;
    mnft: string;
    vault: string;
    approved: boolean;
}

export type MnftApprovalForAllResult = {
    result: string;
}

export type CnftApprovalForAll = {
    owner: Signer;
    cnft: string;
    vault: string;
    approved: boolean;
}

export type CnftApprovalForAllResult = {
    result: string;
}

export type DepositAndMint = {
    owner: Signer;
    vault: string;
    rwaNfts: string[];
    tokenIds: string[];
    amount: number;
}

export type DepositAndMintResult = {
    result: string;
}

export type EnsureTransferFeeAllowance = {
    sender: Signer;
    vault: string
    erc20: string;
    token: string;
    amount: string | number;
}

export type EnsureTransferFeeAllowanceResult = {
    result: string;
}