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


export async function waitForTx(
  signer: Signer,
  tx: TransactionRequest
): Promise<TransactionReceipt> {
  // default to use status updates and final confirmation mode
  const result = await executeEvmTransaction(
    signer,
    tx,
    status => console.log('Status update:', status),
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

  // Handle confirmation modes
  const mode = opts.mode ?? ConfirmationMode.FAST;
  let targetConfirmations = 1;  // Default to 1 for FAST mode
  
  if (mode === ConfirmationMode.CUSTOM) {
      if (!opts.confirmations) {
          throw new Error('confirmations must be set when using ConfirmationMode.CUSTOM');
      }
      targetConfirmations = opts.confirmations;
  }

  return new Promise<EvmSendResult>(async (resolveMain, rejectMain) => {
      let cancelled = false;
      
      const receipt = new Promise<TransactionReceipt>(async (resolve, reject) => {
          try {
              // Build and send transaction
              const tx = await _buildEvmTx(unsignedTx, signer, opts);
              const txResponse = await signer.sendTransaction(tx);
              
              // Emit broadcast status
              _emitStatusCallback(onStatus, cancelled, {
                  status: TransactionStatus.BROADCAST,
                  confirmationMode: mode,
                  totalConfirmations: 0,
                  hash: txResponse.hash,
                  nonce: txResponse.nonce
              });

              // Wait for first confirmation
              const inclusionReceipt = await txResponse.wait();
              if (!inclusionReceipt) {
                  throw new Error('Transaction receipt not found');
              }

              if (inclusionReceipt.status === 0) {
                  throw new Error('Transaction failed');
              }

            // Return immediately with transaction hash
            resolveMain({
                txHash: txResponse.hash,
                unsubscribe: onStatus ? () => { cancelled = true; } : undefined,
                receipt,
            });

              // Emit in-block status
              _emitStatusCallback(onStatus, cancelled, {
                  status: TransactionStatus.IN_BLOCK,
                  confirmationMode: mode,
                  totalConfirmations: 1,
                  receipt: inclusionReceipt,
                  hash: txResponse.hash
              });

              // Wait for confirmations based on mode
              const userReceipt = await _waitForConfirmations(
                  txResponse, 
                  inclusionReceipt, 
                  mode, 
                  targetConfirmations, 
                  signer,
                  onStatus, 
                  cancelled
              );

              resolve(userReceipt);
          } catch (error: any) {
              // TODO possible add error parsing
              // const errorMessage = _parseEvmError(error, iface);
              return reject(error);
          }
      });

      // Handle cases where finalize rejects before we return
      receipt.catch((error) => {
          rejectMain(error);
      });
  });
}

/**
* Builds an EVM transaction with gas estimation and fee calculation
*/
async function _buildEvmTx(
  unsignedTx: TransactionRequest, 
  signer: Signer, 
  opts: txOptions
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
  const maxFeePerGas = opts.maxFeePerGas ?? feeData.maxFeePerGas;
  const maxPriorityFeePerGas = opts.maxPriorityFeePerGas ?? feeData.maxPriorityFeePerGas;
  const gasLimit = opts.gasLimit ?? estimatedGasLimit;
  
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

async function _waitForConfirmations(
  txResponse: TransactionResponse,
  inclusionReceipt: TransactionReceipt,
  mode: ConfirmationMode,
  targetConfirmations: number,
  signer: Signer,
  onStatus?: (result: TransactionStatusCallback) => void | Promise<void>,
  cancelled?: boolean
): Promise<TransactionReceipt> {
  const inclusionBlock = inclusionReceipt.blockNumber;

  switch (mode) {
      case ConfirmationMode.FAST:
          // Already have 1 confirmation, nothing more needed
          return inclusionReceipt;

      case ConfirmationMode.CUSTOM:
          // Wait for user's target confirmations
          const startingFinalized = await signer.provider!.getBlock("finalized");
          if (!startingFinalized) {
              throw new Error("Could not fetch finalized head");
          }

          const customReceipt = await txResponse.wait(targetConfirmations);
          if (!customReceipt) {
              throw new Error('Could not get receipt after waiting for confirmations');
          }
          
          // Validate the receipt is still canonical to guard against chain reorgs
          const canonicalReceipt = await signer.provider!.getTransactionReceipt(txResponse.hash);
          if (!canonicalReceipt) {
              throw new Error('Could not fetch canonical transaction receipt');
          }
          
          const finalizedHead = await signer.provider!.getBlock("finalized");
          if (!finalizedHead) {
              throw new Error("Could not fetch finalized head");
          }

          const confirmationsSeen = finalizedHead.number - startingFinalized.number + 1;
          const status = finalizedHead.number >= inclusionBlock 
              ? TransactionStatus.FINALIZED 
              : TransactionStatus.IN_BLOCK;

          // Emit custom confirmations callback
          _emitStatusCallback(onStatus, cancelled, {
              status,
              confirmationMode: mode,
              totalConfirmations: confirmationsSeen,
              receipt: canonicalReceipt,
              hash: txResponse.hash
          });
          
          return canonicalReceipt;

      case ConfirmationMode.FINAL:
          // Poll until the GRANDPA-finalized head >= inclusion block
          const FINALITY_POLL_INTERVAL_MS = 1000;
          let finalizedHeadFINAL;
          let startingBlock = await signer.provider!.getBlock("finalized");
          if (!startingBlock) {
              throw new Error('Could not get finalized block');
          }
          
          do {
              finalizedHeadFINAL = await signer.provider!.getBlock("finalized");
              if (!finalizedHeadFINAL) {
                  throw new Error('Could not get finalized block');
              }
              if (finalizedHeadFINAL.number >= inclusionBlock) {
                  break;
              }
              await new Promise(r => setTimeout(r, FINALITY_POLL_INTERVAL_MS));
          } while (true);
          
          // Fetch new receipt after finalized head has passed inclusion block
          const finalReceipt = await signer.provider!.getTransactionReceipt(inclusionReceipt.hash);
          if (!finalReceipt) {
              throw new Error("Could not fetch finalized head");
          }

          const finalConfirmations = finalReceipt.blockNumber - startingBlock.number;

          // Emit finalized status callback
          _emitStatusCallback(onStatus, cancelled, {
              status: TransactionStatus.FINALIZED,
              confirmationMode: mode,
              totalConfirmations: finalConfirmations,
              receipt: finalReceipt,
              hash: txResponse.hash
          });
          
          return finalReceipt;

      default:
          throw new Error(`Unknown confirmation mode: ${mode}`);
  }
}

