/**
 * Removes the incomplete "exports" field from all metro-* packages.
 *
 * Node 20.17+ strictly enforces package.json "exports" maps. Metro and its
 * sub-packages ship with exports fields that omit many internal paths that
 * @expo/cli and @expo/metro-config rely on, causing ERR_PACKAGE_PATH_NOT_EXPORTED.
 *
 * Removing the exports field causes Node to fall back to classic file-based
 * resolution (the "main" field / index.js), which works correctly for all
 * CommonJS Metro packages and has no runtime side-effects.
 *
 * Runs automatically via the "postinstall" npm hook.
 */
const fs = require('fs');
const path = require('path');

const NODE_MODULES = path.join(__dirname, '..', 'node_modules');

if (!fs.existsSync(NODE_MODULES)) {
  console.log('[patch-metro] node_modules not found — skipping.');
  process.exit(0);
}

const metroPkgs = fs.readdirSync(NODE_MODULES).filter((d) => /^metro/.test(d));

let patched = 0;
for (const pkg of metroPkgs) {
  const pkgJsonPath = path.join(NODE_MODULES, pkg, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;

  let pkgJson;
  try {
    pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch {
    continue;
  }

  if (!pkgJson.exports) continue; // nothing to remove

  delete pkgJson.exports;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
  console.log(`[patch-metro] Removed incomplete exports from: ${pkg}`);
  patched++;
}

if (patched > 0) {
  console.log(`[patch-metro] Patched ${patched} metro package(s) ✓`);
} else {
  console.log('[patch-metro] No patches needed — all metro packages already clean.');
}
