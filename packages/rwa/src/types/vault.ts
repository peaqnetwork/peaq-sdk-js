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
}

export type MintSecurityTokens = {
    admin: Signer;
    tokenOwner: Signer;
    tokenOwnerIdentity: string
    country: string;
    vault: string;
    token: string;
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


export type RegisterIdentity = {
    admin: Signer;
    token: string;
    recipientAddr: string;
    recipientIdentity: string;
}

export type RegisterIdentityResult = {
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