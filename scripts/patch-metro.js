/**
 * Patches metro's package.json to add missing `exports` entries that
 * @expo/cli needs but Metro omits in its exports map.
 *
 * Node 20.17+ and Node 22+ enforce package exports strictly, so any path
 * not listed in "exports" throws ERR_PACKAGE_PATH_NOT_EXPORTED.
 * This script runs automatically via the "postinstall" npm hook.
 */
const fs = require('fs');
const path = require('path');

const METRO_PKG = path.join(__dirname, '..', 'node_modules', 'metro', 'package.json');

if (!fs.existsSync(METRO_PKG)) {
  console.log('[patch-metro] metro not found in node_modules — skipping.');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(METRO_PKG, 'utf8'));

if (!pkg.exports) {
  console.log('[patch-metro] metro has no "exports" field — no patch needed.');
  process.exit(0);
}

// Paths that @expo/cli requires but Metro's exports map does not include.
const MISSING = [
  './src/lib/TerminalReporter',
  './src/lib/reporting',
];

let changed = false;
for (const p of MISSING) {
  if (!pkg.exports[p]) {
    pkg.exports[p] = p + '.js';
    console.log(`[patch-metro] Added export: ${p}`);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(METRO_PKG, JSON.stringify(pkg, null, 2) + '\n');
  console.log('[patch-metro] metro package.json patched successfully ✓');
} else {
  console.log('[patch-metro] All required exports already present — no patch needed.');
}
