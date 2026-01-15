import type { Signer } from "ethers";

export type CreateContract = {
    contractInitiator: Signer;
    counterparties: string[];
    contractNft: string;
    content: string;
    hashDigest: string;
    url: string;
}

export type CreateContractResult = {
    result: string;
}