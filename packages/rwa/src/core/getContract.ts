import { Contract, Interface } from 'ethers';
import type { Runner } from './types';

export function getContract(addr: string, abi: any, runner: Runner) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    throw new Error('Contract address missing');
  }
  const iface = new Interface(abi);
  return new Contract(addr, iface, runner);
}
