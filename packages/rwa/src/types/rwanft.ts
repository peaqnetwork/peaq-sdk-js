import type { Signer } from "ethers";


export type GetMachineRegulatorsResult = {
    machineRegulators: string[];
}

export type AddMachineIssuer = {
    machineRegulatorSigner: Signer;
    newMachineIssuer: string;
}

export type AddMachineIssuerResult = {
    result: string;
}

export type GetMachineIssuersResult = {
    machineIssuers: string[];
}

export type RemoveMachineIssuer = {
    machineRegulatorSigner: Signer;
    machineIssuer: string;
}

export type RemoveMachineIssuerResult = {
    result: string;
}

export type SetMachineNftBlockState = {
    machineRegulatorSigner: Signer;
    issuerOrContractNft: string;
    blocked: boolean;
}

export type SetMachineNftBlockStateResult = {
    result: string;
}

export type FindContractNft = {
    contractId: string;
}

export type FindContractNftResult = {
    contractNft: string;
}