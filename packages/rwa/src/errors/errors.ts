// core/errors.ts
import { toUtf8String } from 'ethers';

// 1) Canonical error codes (stable surface for users & tests)
export type SDKErrorCode =
  // simulation & preflight
  | 'SIMULATE/CREATE_IDENTITY'
  | 'SIMULATE/ADD_CLAIM'
  | 'SIMULATE/APPROVE_ERC20'
  | 'SIMULATE/ISSUE_MNFT'
  | 'SIMULATE/CREATE_VAULT'
  | 'SIMULATE/REGISTER_TOKEN_IDENTITY'
  | 'SIMULATE/APPROVE_VAULT_AS_OPERATOR'
  | 'SIMULATE/UNPAUSE_TOKEN'
  | 'SIMULATE/TRANSFER_TOKENS'
  | 'SIMULATE/BATCH_TRANSFER'

// 2) Public shape (safe to serialize)
export interface SDKErrorShape {
  name: 'SDKError';
  code: SDKErrorCode;
  message: string;
  hint?: string;
  // Minimal cause details for logging without leaking secrets
  cause?: { reason?: string; code?: string | number; data?: string; method?: string };
  stack?: string;
}

// 3) Error class
export class SDKError extends Error implements SDKErrorShape {
  public readonly name = 'SDKError' as const;
  public readonly code: SDKErrorCode;
  public readonly cause?: SDKErrorShape['cause'];

  constructor(code: SDKErrorCode, message: string, opts?: {
    cause?: unknown;            // raw error
    meta?: Record<string, unknown>;
  }) {
    super(message);
    this.code = code;

    // Normalize cause to a small, non-sensitive object
    if (opts?.cause) this.cause = normalizeCause(opts.cause);

    // Preserve stack where supported
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SDKError);
    }
  }

  toJSON(): SDKErrorShape {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      cause: this.cause,
      stack: this.stack,
    };
  }
}

// 4) Type guard that survives cross-bundle boundaries
export function isSDKError(e: unknown): e is SDKError {
  return !!e && typeof e === 'object' && (e as any).name === 'SDKError' && typeof (e as any).code === 'string';
}

// 5) Helpers
function normalizeCause(err: any): SDKErrorShape['cause'] {
  // ethers v6 errors often include: code, reason, shortMessage, data, info, method, requestBody
  const out: SDKErrorShape['cause'] = {};

  if (typeof err?.code !== 'undefined') out.code = String(err.code);
  if (typeof err?.reason === 'string') out.reason = err.reason;
  if (typeof err?.shortMessage === 'string' && !out.reason) out.reason = err.shortMessage;
  if (typeof err?.message === 'string' && !out.reason) out.reason = cleanMessage(err.message);

  // data may be hex-encoded revert reason
  const data = err?.data ?? err?.error?.data;
  if (typeof data === 'string') {
    out.data = trimHex(data);
    // optional: try decodeErrorString selector (0x08c379a0) -> Error(string)
    const reason = tryDecodeRevertReason(data);
    if (reason && !out.reason) out.reason = reason;
  }

  if (typeof err?.method === 'string') out.method = err.method;

  // Avoid leaking request/response bodies, params, private keys, etc.
  return out;
}

function cleanMessage(msg: string): string {
  // Strip common noise (keep it conservative)
  return msg.replace(/\s+at .+$/s, '').trim();
}

function trimHex(hex: string): string {
  if (!hex.startsWith('0x')) return hex;
  // cap to avoid giant logs
  return hex.length > 66 ? hex.slice(0, 66) + '…' : hex;
}

function tryDecodeRevertReason(data: string): string | null {
  try {
    // 0x08c379a0 = Error(string)
    if (data.startsWith('0x08c379a0') && data.length >= 10 + 64 + 64) {
      // very light decoder: last bytes often hold the utf8 reason
      // this is intentionally minimal to avoid ABI deps here
      const reasonHex = '0x' + data.slice(- (data.length - 10 - 64)); // rough; safe fallback
      const reason = toUtf8String(reasonHex as any);
      return reason;
    }
  } catch {}
  return null;
}
