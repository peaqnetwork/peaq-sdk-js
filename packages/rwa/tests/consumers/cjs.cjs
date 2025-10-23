// CJS runtime require: should expose RWA (not OnchainID)
const m = require('../../dist/index.cjs');

const hasRwa = typeof m.RWA === 'function';
const exposesModules =
  'OnchainID' in m || 'MachineNFTs' in m || 'Vaults' in m || 'TREX' in m;

if (hasRwa && !exposesModules) {
  console.log('ok-cjs');
} else {
  console.log('bad-cjs');
}
