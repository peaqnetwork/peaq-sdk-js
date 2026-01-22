// ESM runtime import: should expose RWA (not OnchainID)
import * as m from '../../dist/index.js';

const hasRwa = typeof m.RWA === 'function';
const exposesModules =
  'OnchainID' in m || 'MachineNFTs' in m || 'Vaults' in m || 'TREX' in m;

if (hasRwa && !exposesModules) {
  console.log('ok-esm');
} else {
  console.log('bad-esm');
}
