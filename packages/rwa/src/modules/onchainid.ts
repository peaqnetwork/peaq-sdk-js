// get abis
import IIdentityABI from '../abis/IIdentity.json';
import IIdFactoryABI from '../abis/IIdFactory.json';

// get types
import type { NetworkAddresses } from '../types/core';
import type { CreateIdentity, CreateIdentityResult } from '../types/onchainid';

// get utils
import { getContract } from '../utils/index';
import { waitForTx } from '../utils/index';

// get 3rd part tools
import {  type Signer, ZeroAddress } from 'ethers';


export class OnchainID {
  private addresses: NetworkAddresses;
  constructor(addresses: NetworkAddresses) {
    this.addresses = addresses;
  }
  

  // returns back Identity contract stored in config (or use provided address)
  private _identity(signer: Signer) {
    const addr = this.addresses.onchainid.identity;
    return getContract(addr, IIdentityABI, signer);
  }

  // returns back IdFactory contract stored in config (or use provided address)
  private _idFactory(signer: Signer) {
    const addr = this.addresses.onchainid.idFactory;
    return getContract(addr, IIdFactoryABI, signer);
  }
  

  public async createIdentity(opts: CreateIdentity): Promise< CreateIdentityResult> {
    const { admin, walletAddr, salt } = opts;
    const idFactory = this._idFactory(admin);

    const existing = await idFactory.getIdentity(walletAddr);
    if (existing && existing !== ZeroAddress) {
      return { status: 'exists', identityAddress: existing, receipt: null };
    }

    const tx = await idFactory.createIdentity.populateTransaction(walletAddr, salt);
    // const receipt = await tx.wait();
    const receipt = await waitForTx(admin, tx);
    const identityAddress = await idFactory.getIdentity(walletAddr);

    const identity = this._identity(admin);
    identity.attach(identityAddress);

    return { status: 'created', identityAddress, receipt: receipt };
  }

}
