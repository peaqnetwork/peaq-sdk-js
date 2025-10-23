import { Contract, Interface, getAddress } from 'ethers';
import type { Provider, Signer, TransactionRequest, JsonRpcProvider, TransactionReceipt, TransactionResponse } from 'ethers';
import type { TransactionStatusCallback, txOptions, EvmSendResult } from '../types/utils';
import { ConfirmationMode, TransactionStatus } from '../enums/utils';


export function getContract(addr: string, abi: any, runner: Signer | Provider | undefined) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    throw new Error('Contract address missing');
  }
  const iface = new Interface(abi);
  return new Contract(addr, iface, (runner) ? runner : undefined);
}


async function pollFinalizedHead(
    provider: { getBlock: (tag: string) => Promise<{ number: number } | null> },
    targetBlock: number,
    {
      intervalMs = 1000,
      maxTries = 300, // ~5 minutes default
    }: { intervalMs?: number; maxTries?: number } = {}
): Promise<{ number: number }> {
    let tries = 0;
    while (tries < maxTries) {
      const head = await provider.getBlock('finalized');
      if (!head) throw new Error('Could not fetch finalized head');
      if (head.number >= targetBlock) return head;
      await new Promise((r) => setTimeout(r, intervalMs));
      tries++;
    }
    throw new Error('Finality polling exceeded max tries');
  }
  
export async function waitForTx(
    signer: Signer,
    tx: TransactionRequest
): Promise<TransactionReceipt> {
    const result = await executeEvmTransaction(
        signer,
        tx,
        (status) => console.log('Status update:', status),
        { mode: ConfirmationMode.FINAL }
    );
    return result.receipt;
}

// EVM transaction execution helper
//
// WIP
export async function executeEvmTransaction(
  signer: Signer,
  unsignedTx: TransactionRequest,
  onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
  opts: txOptions = {},
): Promise<EvmSendResult> {

    const mode = opts.mode ?? ConfirmationMode.FAST;
    const targetConfirmations =
      mode === ConfirmationMode.CUSTOM
        ? (() => {
            if (!opts.confirmations) {
              throw new Error('confirmations must be set when using ConfirmationMode.CUSTOM');
            }
            return opts.confirmations;
          })()
        : 1;
  
    // cancellation flag (simple, no AbortController needed)
    let cancelled = false;
    const unsubscribe = onStatus ? () => { cancelled = true; } : undefined;

    // 1) Build & send (with one optional fee-bump retry)
    let txResponse: TransactionResponse;
    try {
        const tx = await _buildEvmTx(unsignedTx, signer, opts);
        txResponse = await signer.sendTransaction(tx);
    } catch (sendErr: any) {
        const message = _extractEvmErrorMessage(sendErr);
        if (_shouldBumpFees(message)) {
            const txBumped = await _buildEvmTx(unsignedTx, signer, opts, 1.25);
            txResponse = await signer.sendTransaction(txBumped);
        } else {
        throw sendErr;
        }
    }

    _emitStatusCallback(onStatus, cancelled, {
        status: TransactionStatus.BROADCAST,
        confirmationMode: mode,
        totalConfirmations: 0,
        hash: txResponse.hash,
        nonce: txResponse.nonce
    });

    // 2) Wait for first inclusion
    const inclusionReceipt = await txResponse.wait();
    if (!inclusionReceipt) throw new Error('Transaction receipt not found');
    if (inclusionReceipt.status === 0) throw new Error('Transaction failed');

    _emitStatusCallback(onStatus, cancelled, {
        status: TransactionStatus.IN_BLOCK,
        confirmationMode: mode,
        totalConfirmations: 1,
        receipt: inclusionReceipt,
        hash: txResponse.hash
    });

    // 3) Handle confirmation mode
    const finalReceipt = await _waitForConfirmations(
        txResponse,
        inclusionReceipt,
        mode,
        targetConfirmations,
        signer,
        onStatus,
        cancelled
    );

    // 4) Done
    return {
        txHash: txResponse.hash,
        unsubscribe,
        receipt: finalReceipt
    };
}


/**
* Builds an EVM transaction with gas estimation and fee calculation
*/
async function _buildEvmTx(
  unsignedTx: TransactionRequest, 
  signer: Signer, 
  opts: txOptions,
  bumpMultiplier?: number
): Promise<any> {
  // const provider = this.api as JsonRpcProvider;
  const address = await signer.getAddress();

  // Estimate gas as source of truth
  const estimatedGasLimit = await signer.provider!.estimateGas({
      from: address,
      to: unsignedTx.to,
      data: unsignedTx.data ?? '0x',
  });

  // Get current fee data for EIP-1559
  const feeData = await signer.provider!.getFeeData();
  
  // Use custom values if provided, otherwise use network defaults
  let maxFeePerGas = opts.maxFeePerGas ?? feeData.maxFeePerGas ?? undefined;
  let maxPriorityFeePerGas = opts.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas ?? undefined;
  const gasLimit = opts.gasLimit ?? estimatedGasLimit;

  // Optionally bump fees by multiplier (e.g., 1.25 for +25%)
  if (bumpMultiplier && bumpMultiplier > 1) {
      const scale = BigInt(Math.floor(bumpMultiplier * 100));
      if (typeof maxFeePerGas === 'bigint') {
          const bumped = (maxFeePerGas * scale) / 100n;
          maxFeePerGas = bumped > maxFeePerGas ? bumped : (maxFeePerGas + 1n);
      }
      if (typeof maxPriorityFeePerGas === 'bigint') {
          const bumpedPrio = (maxPriorityFeePerGas * scale) / 100n;
          maxPriorityFeePerGas = bumpedPrio > maxPriorityFeePerGas ? bumpedPrio : (maxPriorityFeePerGas + 1n);
      }
  }
  
  // Build EIP-1559 transaction
  return {
      to: unsignedTx.to,
      data: unsignedTx.data ?? '0x',
      gasLimit,
      type: 2, // EIP-1559 transaction type
      maxFeePerGas,
      maxPriorityFeePerGas,
  };
}

function _emitStatusCallback(
  onStatus: ((result: TransactionStatusCallback) => void | Promise<void>) | undefined,
  cancelled: boolean | undefined,
  statusUpdate: TransactionStatusCallback
): void {
  if (onStatus && !cancelled) {
      onStatus(statusUpdate);
  }
}

// Runtime option validation helpers

function _extractEvmErrorMessage(err: any): string {
  if (!err) return '';
  if (typeof err.message === 'string') return err.message;
  if (typeof err.shortMessage === 'string') return err.shortMessage;
  if (err?.info?.error?.message) return String(err.info.error.message);
  if (err?.error?.message) return String(err.error.message);
  return '';
}

function _shouldBumpFees(message: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('already known') ||
    m.includes('could not coalesce') ||
    m.includes('replacement') ||
    m.includes('underpriced') ||
    m.includes('fee too low')
  );
}

async function _waitForConfirmations(
    txResponse: TransactionResponse,
    inclusionReceipt: TransactionReceipt,
    mode: ConfirmationMode,
    targetConfirmations: number,
    signer: Signer,
    onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
    cancelled?: boolean
  ): Promise<TransactionReceipt> {
    const provider = signer.provider!;
    const inclusionBlock = inclusionReceipt.blockNumber;
  
    switch (mode) {
      case ConfirmationMode.FAST:
        return inclusionReceipt;
  
      case ConfirmationMode.CUSTOM: {
        const startingFinalized = await provider.getBlock('finalized');
        if (!startingFinalized) throw new Error('Could not fetch finalized head');
  
        const customReceipt = await txResponse.wait(targetConfirmations);
        if (!customReceipt) throw new Error('Could not get receipt after waiting for confirmations');
  
        // Re-fetch canonical receipt
        const canonicalReceipt = await provider.getTransactionReceipt(txResponse.hash);
        if (!canonicalReceipt) throw new Error('Could not fetch canonical transaction receipt');
  
        const finalizedHead = await provider.getBlock('finalized');
        if (!finalizedHead) throw new Error('Could not fetch finalized head');
  
        const confirmationsSeen = finalizedHead.number - startingFinalized.number + 1;
        const status =
          finalizedHead.number >= inclusionBlock
            ? TransactionStatus.FINALIZED
            : TransactionStatus.IN_BLOCK;
  
        _emitStatusCallback(onStatus, cancelled, {
          status,
          confirmationMode: mode,
          totalConfirmations: confirmationsSeen,
          receipt: canonicalReceipt,
          hash: txResponse.hash
        });
  
        return canonicalReceipt;
      }
  
      case ConfirmationMode.FINAL: {
        // bounded polling instead of while(true)
        await pollFinalizedHead(provider, inclusionBlock, {
          intervalMs: 1000,
          maxTries: 300, // tune per chain
        });
  
        const finalReceipt = await provider.getTransactionReceipt(inclusionReceipt.hash);
        if (!finalReceipt) throw new Error('Could not fetch canonical transaction receipt');
  
        const startingBlock = await provider.getBlock('finalized'); // post-finality fetch
        if (!startingBlock) throw new Error('Could not fetch finalized head');
  
        _emitStatusCallback(onStatus, cancelled, {
          status: TransactionStatus.FINALIZED,
          confirmationMode: mode,
          totalConfirmations: 0, // optional to compute precisely; can be omitted or recomputed if you store initial head
          receipt: finalReceipt,
          hash: txResponse.hash
        });
  
        return finalReceipt;
      }
  
      default:
        throw new Error(`Unknown confirmation mode: ${mode}`);
    }
}