// helps validate argument options for functions with clean error messages; chat generated.
import { getAddress, Result, TransactionReceipt, TransactionResponse, EventLog, parseEther, parseUnits, type Contract, Interface } from 'ethers';


export async function toTokenUnits(human: string, token: Contract) {
  const d = await token.decimals?.();
  return BigInt(parseUnits(human, d));
}
export function toWei(human: string) {
  return BigInt(parseEther(human));
}


export type OptionRule<T = any> = {
    required?: boolean;
    validator?: (value: any) => boolean | T;
    expected?: string;
    default?: T;
  };
  
  export type Schema<T extends Record<string, any>> = { [K in keyof T]-?: OptionRule<T[K]> };
  

  // parses options and validates them against a schema for clean error messages when arguments are missing or invalid.
  export function parseOptions<T extends Record<string, any>>(
    options: any,
    schema: Schema<T>,
    caller: string = 'function'
  ): T {
    if (!options || typeof options !== 'object') {
      throw new Error(`${caller}: options must be an object`);
    }
  
    const out: any = { ...options };
    const missing: string[] = [];
    const invalid: string[] = [];
  
    for (const [key, rule] of Object.entries(schema)) {
      const present = Object.prototype.hasOwnProperty.call(out, key);
      if (!present && 'default' in (rule as OptionRule)) {
        out[key] = (rule as OptionRule).default;
      }
      const nowPresent = Object.prototype.hasOwnProperty.call(out, key);
  
      if ((rule as OptionRule).required && !nowPresent) {
        missing.push(key);
        continue;
      }
  
      if (nowPresent && (rule as OptionRule).validator) {
        let res: any;
        try {
          res = (rule as OptionRule).validator!(out[key]);
        } catch (e: any) {
          invalid.push((rule as OptionRule).expected ? `${key} (expected ${(rule as OptionRule).expected})` : key);
          continue;
        }
        if (typeof res === 'boolean') {
          if (!res) invalid.push((rule as OptionRule).expected ? `${key} (expected ${(rule as OptionRule).expected})` : key);
        } else {
          // transformed value → adopt it
          out[key] = res;
        }
      }
    }
  
    if (missing.length) {
      throw new Error(`${caller}: missing required field(s): ${missing.join(', ')}`);
    }
    if (invalid.length) {
      throw new Error(`${caller}: invalid field(s): ${invalid.join(', ')}`);
    }
  
    return out as T;
  }
  
  // Common validators
  export const validators = {
    nonEmptyString: (v: any) => typeof v === 'string' && v.length > 0,
    string: (v: any) => typeof v === 'string',
    number: (v: any) => typeof v === 'number' && Number.isFinite(v),
    boolean: (v: any) => typeof v === 'boolean',
    bigint: (v: any) => typeof v === 'bigint',
    address: (v: any): string => {
      if (typeof v !== 'string') throw new Error('expected 0x-address string');
      return getAddress(v);
    },
    signerWithProvider: (v: any) => v && typeof v.getAddress === 'function' && !!v.provider,
    arrayOf: (elemValidator: (x: any) => boolean | any) => (v: any) => Array.isArray(v) && v.every((el: any) => {
      const res = elemValidator(el);
      return typeof res === 'boolean' ? res : true;
    }),
    oneOf: <T extends readonly any[]>(choices: T) => (v: any) => (choices as readonly any[]).includes(v),
    hexString: (v: any) => typeof v === 'string' && /^0x[0-9a-fA-F]*$/.test(v),
    regex: (re: RegExp) => (v: any) => typeof v === 'string' && re.test(v),
    // Validates a partial object: for each key in the provided shape, if the key exists on v,
    // it must satisfy the corresponding validator. Missing keys are allowed.
    partialObject: (shape: Record<string, (x: any) => boolean>) => (v: any) => {
      if (!v || typeof v !== 'object') return false;
      for (const [key, validate] of Object.entries(shape)) {
        if (Object.prototype.hasOwnProperty.call(v, key)) {
          if (!validate((v as any)[key])) return false;
        }
      }
      return true;
    },
  };

/**
 * @dev Extracts the arguments of a specific event from a transaction receipt.
 * @param tx The transaction response object.
 * @param eventName The name of the event to extract arguments from.
 * @return A promise that resolves to the event arguments if found, otherwise throws an error.
 */
export async function getArgsFromTxEvent(
  receipt: TransactionReceipt,
  eventName: string,
  iface?: Interface
): Promise<Result> {
  // Try typed EventLog entries first
  for (const log of receipt.logs) {
    if (log instanceof EventLog && log.eventName === eventName) {
      return log.args;
    }
  }

  // Fallback: parse raw logs using provided Interface
  if (iface) {
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        if (parsed?.name === eventName) {
          return parsed.args as Result;
        }
      } catch {}
    }
  }
  throw new Error(`Event ${eventName} not found in transaction logs`);
}