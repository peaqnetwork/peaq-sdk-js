import type { Signer } from "ethers";
import type { Contract, ContractDraft } from "../utils/nft";

export type CreateContract = {
    contractInitiator: Signer;
    counterparties: string[];
    contractNft: string;
    hashDigest: string;
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