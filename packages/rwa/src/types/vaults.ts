import type { Signer, TransactionReceipt } from "ethers";


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
    token: string;
    eoa: string;
    identity: string;
    country: string;
}

export type RegisterIdentityResult = {
    result: string;
    receipt: TransactionReceipt;
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