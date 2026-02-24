import type { Signer, TransactionReceipt } from "ethers";


export type GetMachineRegulatorsResult = {
    machineRegulators: string[];
}

export type AddMachineIssuer = {
    machineRegulatorSigner: Signer;
    newMachineIssuer: string;
}

export type AddMachineIssuerResult = {
    status: 'added';
    peaqRwaNft: string;
    machineIssuer: string;
    machineNft: string;
    addedBy: string;
    receipt: TransactionReceipt;
}

export type GetMachineIssuersResult = {
    machineIssuers: string[];
}

export type RemoveMachineIssuer = {
    machineRegulatorSigner: Signer;
    machineIssuer: string;
}

export type RemoveMachineIssuerResult = {
    status: 'removed';
    peaqRwaNft: string;
    machineIssuer: string;
    removedBy: string;
    receipt: TransactionReceipt;
}

export type SetMachineNftBlockState = {
    machineRegulatorSigner: Signer;
    issuerOrContractNft: string;
    blocked: boolean;
}

export type SetMachineNftBlockStateResult = {
    status: 'updated';
    peaqRwaNft: string;
    target: string;
    blocked: boolean;
    updatedBy: string;
    receipt: TransactionReceipt;
}

export type FindContractNft = {
    contractId: string;
}

export type FindContractNftResult = {
    contractNft: string;
}