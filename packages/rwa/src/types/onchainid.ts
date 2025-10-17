import type { Signer, TransactionReceipt } from 'ethers';

export type CreateIdentity = {
    admin: Signer;
    walletAddr: string;
    salt: string;
}

export type CreateIdentityResult = {
    status: 'created' | 'exists';
    identityAddress: string;
    receipt: TransactionReceipt | null; // null when it already existed
}