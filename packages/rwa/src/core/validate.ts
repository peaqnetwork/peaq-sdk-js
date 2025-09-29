export function assertChainId(actual: number, expected: number) {
    if (actual !== expected) {
      throw new Error(`ChainId mismatch. Expected ${expected}, got ${actual}`);
    }
  }
