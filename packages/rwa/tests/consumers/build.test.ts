import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';

function run(cmd: string) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString();
  } catch (e: any) {
    // make TS/V8 errors readable in Vitest output
    throw new Error(e?.stdout?.toString() || e?.stderr?.toString() || String(e));
  }
}

describe('build outputs', () => {
  it('esm works', () => {
    const out = execSync('node tests/consumers/esm.mjs', { stdio: 'pipe' }).toString().trim();
    expect(out).toBe('ok-esm');
  });
  it('cjs works', () => {
    const out = execSync('node tests/consumers/cjs.cjs', { stdio: 'pipe' }).toString().trim();
    expect(out).toBe('ok-cjs');
  });
  it('types compile', () => {
    // If it fails, tsc exits non-zero and vitest fails
    run('tsc --noEmit -p tests/consumers/tsconfig.consumer.json');
  });
});
