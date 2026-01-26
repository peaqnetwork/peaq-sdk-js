import type { Signer } from "ethers";
import type { Contract, ContractDraft } from "../utils/nft";

export type CreateContract = {
    contractController: Signer;
    erc20: string;
    tokenDecimals: number;
    counterparties: string[];
    contractNft: string;
    contractHash: string;
    url: string;
}

export type CreateContractResult = {
    message: string;
    contractId: string;
}

export type SignContract = {
    counterpartySigner: Signer;
    contractNft: string;
    contractId: string;
}

export type SignContractResult = {
    message: string;
}

export type GetDraft = {
    contractNft: string;
    contractId: string;
}

export type GetDraftResult = {
    draft: ContractDraft;
}
export type GetContract = {
    contractNft: string;
    contractId: string;
}

export type GetContractResult = {
    contract: Contract;
}

export type CancelContract = {
    contractController: Signer;
    contractNft: string;
    contractId: string;
}

export type CancelContractResult = {
    message: string;
}

export type SetBlocked = {
    contractNftSigner: Signer;
    contractNft: string;
    blocked: boolean;
}

export type SetBlockedResult = {
    message: string;
}

export type IsBlocked = {
    contractNft: string;
}

export type IsBlockedResult = {
    blocked: boolean;
}

export type IsContractIdAvailable = {
    contractNft: string;
    contractId: string;
}

export type IsContractIdAvailableResult = {
    available: boolean;
}