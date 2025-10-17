export class CreateIdentityArgumentError extends Error {
  constructor(details: string) {
    super(`createIdentity(): ${details}. Expected: { admin: Signer; eoa: string; salt: string }`);
    this.name = 'CreateIdentityArgumentError';
  }
}

