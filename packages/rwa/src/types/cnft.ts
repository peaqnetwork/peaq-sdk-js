import type { Signer } from "ethers";
import type { Contract, ContractDraft } from "../utils/nft";
import type { TransactionReceipt } from "ethers";

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
    status: 'created';
    contractNft: string;
    contractId: string;
    contractController: string;
    counterparties: string[];
    content: {
        hash: string;
        url: string;
    }
    fee: {
        token: string;
        tokenDecimals: number;
        setupAmount: bigint;
        balanceBefore: bigint;
        balanceAfter: bigint;
        humanTokenDelta: string;
    }
    receipt: TransactionReceipt;
}

export type SignContract = {
    counterpartySigner: Signer;
    contractNft: string;
    contractId: string;
}

export type SignContractResult = {
    status: 'completed' | 'signed' | 'mined_unknown';
    contractId: string;
    counterpartySigner: string;
    receipt: TransactionReceipt;
    progress?: {
        collected: number;
        total: number;
    }
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
    status: 'cancelled';
    contractNft: string;
    contractId: string;
    cancelledBy: string;
    receipt: TransactionReceipt;
}

export type SetBlocked = {
    contractNftSigner: Signer;
    contractNft: string;
    blocked: boolean;
}

export type SetBlockedResult = {
    status: 'set';
    contractNft: string;
    blocked: boolean;
    setBy: string;
    receipt: TransactionReceipt;
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