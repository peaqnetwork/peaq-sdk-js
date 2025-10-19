import type { Signer } from "ethers";


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
    vault: string;
    token: string;
    tokenIds: number[];
    amount: number;
}

export type MintSecurityTokensResult = {
    result: string;
}