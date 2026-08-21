#!/usr/bin/env node
/**
 * Generator for the four `@knowvah/plantuml-stdlib*` npm packages (mission SI5b
 * batch-3, T8): reads `assets/stdlib/` (the SI5b T1 vendor pipeline's
 * output) and writes a gitignored `generated/` tree into each of
 * `packages/{stdlib,stdlib-aws,stdlib-tupadr3,stdlib-all}/` containing
 * `BundleData`-shaped ESM modules (`src/core/tim/StdlibStore.ts`'s
 * contract) plus a per-package `index.{js,d.ts}`.
 *
 * Emission is plain ESM JS + hand-paired `.d.ts` (no `tsc` compile step for
 * the generated data itself -- `plans/si5b-stdlib/batch-3/overview.md` T8:
 * 'tsconfig or plain-JS emission, pick the simplest that yields working ESM
 * + .d.ts'). Each package's own `tsconfig.json` (extending
 * `packages/tsconfig.base.json`) type-checks the resulting `.d.ts` files
 * against `plantuml-ts`'s `BundleData` export -- see `npm run build:stdlib`
 * in the root `package.json`.
 *
 * Usage:
 *   jiti scripts/build-stdlib-packages.ts
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { acquireBuildLock } from './build-stdlib-packages/build-lock.js';
import { emitAllIndexDts, emitAllIndexJs } from './build-stdlib-packages/emit-all-index.js';
import { emitIndexDts, emitIndexJs } from './build-stdlib-packages/emit-index.js';
import { emitModuleDts, emitModuleJs } from './build-stdlib-packages/emit-module.js';
import {
  emitRemoteManifestDts,
  emitRemoteManifestJs,
} from './build-stdlib-packages/emit-remote-manifest.js';
import {
  BOOTSTRAP_SPRITE_SPLIT,
  PACKAGE_SPECS,
  type SpriteSplitBundleSpec,
} from './build-stdlib-packages/package-specs.js';
import type { PackageSpec } from './build-stdlib-packages/types.js';
import { splitSpriteBundle } from './split-sprite-bundle/split.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

function freshGeneratedDir(packageDir: string): string {
  const generatedDir = join(PACKAGES_DIR, packageDir, 'generated');
  rmSync(generatedDir, { recursive: true, force: true });
  mkdirSync(generatedDir, { recursive: true });
  return generatedDir;
}

/**
 * Every `generated/<fileName>` a `PackageSpec` would produce, as an
 * in-memory map -- a pure function of `spec` and the current `.puml`
 * content under `assetsStdlibDir`, with no filesystem write. Exported so
 * {@link isGeneratedDirUpToDate} (and its tests) can compute "what a build
 * WOULD write" without writing anything (stdlib-build-race T2 -- D4,
 * `plans/stdlib-build-race/decisions.md`).
 */
export function computePackageOutputs(spec: PackageSpec, assetsStdlibDir: string): Map<string, string> {
  const outputs = new Map<string, string>();

  // SI12 ADR-2/ADR-5: `modules` is optional -- a spec that omits it (e.g.
  // stdlib-aws, stdlib-tupadr3) gets no eager module emitted at all, matching
  // the existing `spec.remoteModules ?? []` idiom below.
  for (const mod of spec.modules ?? []) {
    outputs.set(`${mod.fileBaseName}.js`, emitModuleJs(mod, assetsStdlibDir));
    outputs.set(`${mod.fileBaseName}.d.ts`, emitModuleDts(mod));
  }

  // The si11a per-RESOURCE manifests, emitted ALONGSIDE the eager modules
  // above rather than instead of them (si11a ADR-1): the eager module stays
  // byte-identical for offline consumers, and a `.remote` sibling describes
  // the same bundle as key -> relative path with no content. Packages with
  // no `remoteModules` (stdlib, stdlib-all) are unaffected.
  for (const mod of spec.remoteModules ?? []) {
    outputs.set(`${mod.fileBaseName}.remote.js`, emitRemoteManifestJs(mod, assetsStdlibDir));
    outputs.set(`${mod.fileBaseName}.remote.d.ts`, emitRemoteManifestDts(mod));
  }

  outputs.set('index.js', emitIndexJs(spec));
  outputs.set('index.d.ts', emitIndexDts(spec));

  return outputs;
}

function computeAllPackageOutputs(): Map<string, string> {
  return new Map([
    ['index.js', emitAllIndexJs()],
    ['index.d.ts', emitAllIndexDts()],
  ]);
}

function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Whether `generatedDir` already holds byte-identical content, for every
 * file `freshOutputs` would write, to what a fresh build would produce --
 * content-derived (sha256 of the bytes actually on disk vs. sha256 of the
 * freshly computed content), NEVER a file count or an mtime (stdlib-build-race
 * D4, `plans/stdlib-build-race/decisions.md`). This is the up-to-date half of
 * the fix; the other half (a cross-process lock that re-checks this predicate
 * INSIDE the critical section) lands in a later task -- this predicate alone
 * does not close the inter-process race (`.agent-notes/sre-T0.md`).
 *
 * Read-only: never creates, deletes, or modifies anything, so it is safe to
 * call independently of a build. Any failure to read -- the directory or a
 * file is missing, or a read throws for any reason (permissions, a path
 * that turns out to be a directory, and so on) -- is treated as "not
 * up to date": D4's asymmetry is that a redundant rebuild costs seconds
 * while a wrongly-skipped one can silently corrupt a test oracle, so
 * uncertainty always means rebuild, never skip.
 */
export function isGeneratedDirUpToDate(generatedDir: string, freshOutputs: ReadonlyMap<string, string>): boolean {
  try {
    for (const [fileName, freshContent] of freshOutputs) {
      const onDiskContent = readFileSync(join(generatedDir, fileName), 'utf8');
      if (sha256Hex(onDiskContent) !== sha256Hex(freshContent)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function logBuildDecision(packageDir: string, decision: 'skip' | 'rebuild', reason: string): void {
  // eslint-disable-next-line no-console
  console.log(`[build-stdlib-packages] ${packageDir}: ${decision} -- ${reason}`);
}

/** Writes `outputs` into `packages/<packageDir>/generated/`, skipping the
 * destructive `freshGeneratedDir` (and so the `rmSync` inside it) entirely
 * when {@link isGeneratedDirUpToDate} says the tree already matches. */
function writeOutputs(packageDir: string, outputs: ReadonlyMap<string, string>): void {
  const generatedDir = join(PACKAGES_DIR, packageDir, 'generated');

  if (isGeneratedDirUpToDate(generatedDir, outputs)) {
    logBuildDecision(packageDir, 'skip', 'generated/ content hash already matches the current build inputs');
    return;
  }

  const freshDir = freshGeneratedDir(packageDir);
  for (const [fileName, content] of outputs) {
    writeFileSync(join(freshDir, fileName), content, 'utf8');
  }
  logBuildDecision(packageDir, 'rebuild', 'generated/ was missing, stale, or unreadable for the current build inputs');
}

function buildPackage(spec: PackageSpec): void {
  writeOutputs(spec.packageDir, computePackageOutputs(spec, ASSETS_STDLIB_DIR));
}

function buildAllPackage(): void {
  writeOutputs('stdlib-all', computeAllPackageOutputs());
}

/**
 * The fresh `{ 'sprites.json', 'sprites/<name>.puml', ... }` a sprite split
 * WOULD produce for `spec`'s current source content -- computed by calling
 * the real, unmodified `splitSpriteBundle` (owned by `split.ts`, not
 * reimplemented here) against a throwaway scratch directory, never the real
 * `packages/<packageDir>/assets/<bundleName>/sprites/` path. `split.ts`'s
 * `splitSpriteBundle` is not structured as a pure function (it writes as it
 * computes), so getting "what it would emit" without touching the shared
 * tree means paying for one real, isolated split into `os.tmpdir()` and
 * reading the result back -- the sprite-split analogue of
 * {@link computePackageOutputs}, which can stay purely in-memory because its
 * emitters (`emit-module.ts` etc.) already are.
 */
function computeSpriteSplitOutputs(spec: SpriteSplitBundleSpec, assetsStdlibDir: string): Map<string, string> {
  const scratchDir = mkdtempSync(join(tmpdir(), 'stdlib-sprite-split-check-'));
  try {
    const manifest = splitSpriteBundle({
      sourcePumlPath: join(assetsStdlibDir, spec.bundleName, spec.sourceFile),
      outDir: scratchDir,
      bundleName: spec.bundleName,
      license: spec.license,
    });

    const outputs = new Map<string, string>();
    outputs.set('sprites.json', JSON.stringify(manifest));
    for (const name of manifest.sprites) {
      outputs.set(`sprites/${name}.puml`, readFileSync(join(scratchDir, `${name}.puml`), 'utf8'));
    }
    return outputs;
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

/**
 * Whether `bundleAssetsDir` (the `sprites.json` + `sprites/` pair a sprite
 * split writes) already matches what re-splitting `spec`'s CURRENT source
 * `.puml` would produce -- the sprite-split sibling of
 * {@link isGeneratedDirUpToDate}, reusing it directly rather than
 * duplicating its content-hash comparison: `sprites.json` carries the
 * emitted manifest (every sprite name the source currently declares) and
 * the source `.puml` is the input, exactly as D4 asks for. Same asymmetry:
 * `computeSpriteSplitOutputs` throwing for any reason (a refused
 * non-allowlisted license, a missing source file, ...) is treated as "not
 * up to date" -- uncertain always means rebuild, never skip.
 *
 * Residual, documented rather than closed: this compares every file
 * `computeSpriteSplitOutputs` says the CURRENT source produces, but does
 * not scan `bundleAssetsDir` for an extra fragment a fresh split would NOT
 * write (e.g. one left over from a since-renamed sprite). That leak is
 * narrow: `sprites.json`'s `sprites` list enumerates every name the CURRENT
 * source declares, so a renamed/removed sprite changes `sprites.json`
 * itself, which mismatches here and forces the real rebuild below --
 * `splitSpriteBundle`'s own unconditional `rmSync` (`split.ts:144`) is what
 * actually cleans the stale fragment at that point. A `readdirSync` count
 * or set-comparison could close this deliberately-left gap, but is not
 * added here: per D4, doing so risks being read as the exact
 * count-based staleness signal that mission `.gitignore`/`copy-assets.mjs`
 * precedent already shows is unsafe.
 */
export function isSpriteSplitUpToDate(bundleAssetsDir: string, spec: SpriteSplitBundleSpec, assetsStdlibDir: string): boolean {
  try {
    return isGeneratedDirUpToDate(bundleAssetsDir, computeSpriteSplitOutputs(spec, assetsStdlibDir));
  } catch {
    return false;
  }
}

/**
 * si11b T1: derives `bootstrap1.13.1`'s per-sprite fragments (ADR-1) into
 * `packages/<packageDir>/assets/<bundleName>/sprites/<name>.puml`, plus a
 * sibling `sprites.json` carrying the returned `SpriteSplitManifest` --
 * `JSON.stringify` on the whole object, matching `emit-module.ts`'s
 * VERBATIM escaping discipline. This is the wiring SI11a's equivalent task
 * skipped (T5 shipped an emitter nothing called): `buildStdlibPackages`
 * calls it directly, so `npm run build:stdlib` actually emits.
 *
 * stdlib-build-race T2: guarded by {@link isSpriteSplitUpToDate} so the real
 * `splitSpriteBundle` call below -- which opens with its own unconditional
 * `rmSync` of `bundleAssetsDir/sprites` (`split.ts:144`, not owned by this
 * task) -- is skipped entirely when the tree already matches the current
 * source, closing the same class of race si11a/SI12 already fixed for
 * `generated/` but had not yet closed here.
 */
function buildSpriteSplits(): void {
  const spec = BOOTSTRAP_SPRITE_SPLIT;
  const bundleAssetsDir = join(PACKAGES_DIR, spec.packageDir, 'assets', spec.bundleName);

  if (isSpriteSplitUpToDate(bundleAssetsDir, spec, ASSETS_STDLIB_DIR)) {
    logBuildDecision(`${spec.packageDir}/assets/${spec.bundleName}`, 'skip', 'sprites already match the current source content');
    return;
  }

  const manifest = splitSpriteBundle({
    sourcePumlPath: join(ASSETS_STDLIB_DIR, spec.bundleName, spec.sourceFile),
    outDir: join(bundleAssetsDir, 'sprites'),
    bundleName: spec.bundleName,
    license: spec.license,
  });

  writeFileSync(join(bundleAssetsDir, 'sprites.json'), JSON.stringify(manifest), 'utf8');
  logBuildDecision(`${spec.packageDir}/assets/${spec.bundleName}`, 'rebuild', 'sprites were missing, stale, or unreadable for the current source content');
}

/** Generates every `@knowvah/plantuml-stdlib*` package's `generated/` tree from
 * `assets/stdlib/`. Exported so `tests/unit/stdlib-packages.test.ts` can
 * invoke it directly rather than shelling out.
 *
 * stdlib-build-race T4: the whole build runs under
 * {@link acquireBuildLock} -- taken BEFORE any `rmSync` -- so a second,
 * concurrently-running process (a second `npm test`/`vitest` invocation's
 * `globalSetup`) never observes, and therefore never `rmSync`s, a tree this
 * process has only partially rebuilt. Because T2's up-to-date predicates
 * (`isGeneratedDirUpToDate`/`isSpriteSplitUpToDate`, called by
 * `writeOutputs`/`buildSpriteSplits` below) run INSIDE this same critical
 * section, the second holder re-checks them against the now-COMPLETE tree
 * the first holder just finished, and skips -- closing D3
 * (`plans/stdlib-build-race/decisions.md`). See
 * `scripts/build-stdlib-packages/build-lock.ts` for the lock's on-disk
 * representation, stale-holder recovery, and bounded-wait timeout. */
export function buildStdlibPackages(): void {
  if (!existsSync(ASSETS_STDLIB_DIR)) {
    throw new Error(
      `Cannot build stdlib packages: ${ASSETS_STDLIB_DIR} does not exist. ` +
        'Run `jiti scripts/vendor-stdlib.ts` first.',
    );
  }

  const release = acquireBuildLock(REPO_ROOT);
  try {
    for (const spec of PACKAGE_SPECS) {
      buildPackage(spec);
    }
    buildAllPackage();
    buildSpriteSplits();
  } finally {
    release();
  }
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  buildStdlibPackages();
  // eslint-disable-next-line no-console
  console.log('Generated packages/{stdlib,stdlib-aws,stdlib-tupadr3,stdlib-all}/generated/.');
}
