/**
 * Patches metro-* packages to expose all internal .js files via the exports map.
 *
 * Problem: Node 20.17+ strictly enforces package.json "exports" fields.
 * Metro and its sub-packages ship with INCOMPLETE exports maps — some internal
 * paths that @expo/cli / @expo/metro-config rely on are missing, causing
 * ERR_PACKAGE_PATH_NOT_EXPORTED.
 *
 * Fix: For every metro-* package that has an "exports" field, we ADD the
 * missing entries by scanning the package's .js files on disk. We never
 * REMOVE existing entries (some, like "private/" remappings in metro-core,
 * are intentional and must stay).
 *
 * Runs automatically via the "postinstall" npm hook.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const NODE_MODULES = path.join(__dirname, '..', 'node_modules');

if (!fs.existsSync(NODE_MODULES)) {
  console.log('[patch-metro] node_modules not found — skipping.');
  process.exit(0);
}

// Directories to skip when scanning for .js files
const SKIP_DIRS = new Set(['__tests__', '__mocks__', '__flowtests__', 'node_modules']);

/** Recursively collect relative paths for all .js files under a directory */
function collectJsFiles(dir, rootDir) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(full, rootDir));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      // Use forward slashes; prefix with './'
      results.push('./' + path.relative(rootDir, full).replace(/\\/g, '/'));
    }
  }
  return results;
}

/** Return the set of all path strings already reachable via the exports map */
function reachablePaths(exportsMap) {
  const reachable = new Set();
  for (const key of Object.keys(exportsMap)) {
    reachable.add(key);
    // Track both with and without .js so we don't double-add
    if (key.endsWith('.js')) reachable.add(key.slice(0, -3));
    else                     reachable.add(key + '.js');
  }
  return reachable;
}

// ── main ────────────────────────────────────────────────────────────────────

const metroPkgNames = fs.readdirSync(NODE_MODULES).filter(d => /^metro/.test(d));

let totalPatched = 0;

for (const pkgName of metroPkgNames) {
  const pkgDir     = path.join(NODE_MODULES, pkgName);
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;

  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')); }
  catch { continue; }

  // Only patch packages that already have an exports field.
  // Packages without exports use classic resolution — no patch needed.
  if (!pkg.exports || typeof pkg.exports !== 'object') continue;

  const reachable = reachablePaths(pkg.exports);
  const jsFiles   = collectJsFiles(pkgDir, pkgDir);

  let changed = false;
  for (const file of jsFiles) {
    const keyNoExt = file.endsWith('.js') ? file.slice(0, -3) : file;
    // Skip if the file (with or without extension) is already exported
    if (reachable.has(file) || reachable.has(keyNoExt)) continue;

    // Add the path-without-extension as the export key (Node convention)
    pkg.exports[keyNoExt] = file;
    reachable.add(keyNoExt);
    reachable.add(file);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`[patch-metro] Patched: ${pkgName}`);
    totalPatched++;
  }
}

if (totalPatched > 0) {
  console.log(`[patch-metro] Done — patched ${totalPatched} metro package(s) ✓`);
} else {
  console.log('[patch-metro] All metro exports already complete — no patch needed.');
}
