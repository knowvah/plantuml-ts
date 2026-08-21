#!/usr/bin/env node
/**
 * Render manifest — full-corpus render fingerprint for the shared-seam-
 * extraction mission's move-safety gate (T0, `plans/shared-seam-extraction/
 * decisions.md#d6`).
 *
 * Renders every `in.puml` under `test-results/dot-cache/*\/` (~1,530) and
 * `oracle/goldens/**` (484) with the deterministic measurer + stdlib store
 * (same wiring as `scripts/shape-match-report.ts`), and records a SHA-256 of
 * the resulting SVG per fixture — plus, for fixtures whose render goes
 * through graph layout (class/object/state/component/usecase; json/yaml/hcl/
 * dot/etc. never call `setLayoutInputObserver`), a SHA-256 of the emitted
 * svek DOT (`core/svek-dot-emit.ts#toSvekDot`, the same emitter `scripts/
 * dot-sync-report.ts` drills into). A fixture that throws records `{ error:
 * message }` — byte-identity of an error is still identity (decisions.md#d6).
 *
 * A PURE MOVE is proved when this manifest is unchanged across a task:
 * `--diff` between the T0 baseline (`test-results/shared-seam-baseline-
 * manifest.json`) and a post-task run must report `0 fixtures differ`.
 *
 * Usage:
 *   npx jiti scripts/render-manifest.ts --out <file> [--only type[,type]]
 *   npx jiti scripts/render-manifest.ts --diff <baseline> <current>
 *
 * `--only <type>[,<type>]` restricts the walk to those `test-results/dot-
 * cache/<type>/` directories ONLY — `oracle/goldens/**` is always walked in
 * full, since it has no per-`dot-cache`-type layout (README push-forward 6:
 * per-task runs may scope to the touched engines' dot-cache dirs; the
 * batch-end run is always the full set).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import { toSvekDot } from '../src/core/svek-dot-emit.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOT_CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
const GOLDENS_DIR = join(REPO, 'oracle', 'goldens');
const IN_PUML = 'in.puml';

export type ManifestEntry = { svg: string; dot?: string } | { error: string };
export type Manifest = Record<string, ManifestEntry>;

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

// ---------------------------------------------------------------------------
// Fixture discovery
// ---------------------------------------------------------------------------

/** Every `in.puml` under `dir`, at any depth, absolute-path unsorted. */
export function findInPumlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...findInPumlFiles(p));
    else if (name === IN_PUML) out.push(p);
  }
  return out;
}

function dotCacheTypeDirs(only: readonly string[] | undefined): string[] {
  if (!existsSync(DOT_CACHE_DIR)) return [];
  const types = readdirSync(DOT_CACHE_DIR).filter((t) => statSync(join(DOT_CACHE_DIR, t)).isDirectory());
  const selected = only === undefined ? types : types.filter((t) => only.includes(t));
  return selected.map((t) => join(DOT_CACHE_DIR, t));
}

/** Absolute fixture paths for the manifest walk, sorted. */
export function discoverFixtures(only: readonly string[] | undefined): string[] {
  const dotCache = dotCacheTypeDirs(only).flatMap(findInPumlFiles);
  const goldens = findInPumlFiles(GOLDENS_DIR);
  return [...dotCache, ...goldens].sort();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------


/** Renders one fixture, capturing an SVG hash and — when the render drove
 *  graph layout — a DOT hash from the same input graphs the layout engine
 *  consumed, in a single render pass (no second `renderSync` call).
 *
 *  `renderSync` itself never throws — it wraps its whole body in a
 *  try/catch and returns `errorSvg(...)` (a normal SVG string) for every
 *  failure reachable from source text. The catch here guards the seam
 *  BELOW that boundary (`toSvekDot` on an edge-case `DotInputGraph`, or the
 *  hashing itself) so one malformed fixture in a ~2,000-fixture batch run
 *  can't abort the whole manifest; decisions.md#d6: byte-identity of an
 *  error message is still identity. */
export function renderFixture(markup: string): ManifestEntry {
  const graphs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => graphs.push(g));
  try {
    const svg = renderSync(markup, { measurer: new DeterministicMeasurer(), includeStore: fixtureIncludeStore() });
    const entry: { svg: string; dot?: string } = { svg: sha256(svg) };
    if (graphs.length > 0) entry.dot = sha256(graphs.map(toSvekDot).join('\n'));
    return entry;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  } finally {
    setLayoutInputObserver(undefined);
  }
}

function sortManifest(manifest: Manifest): Manifest {
  const out: Manifest = {};
  for (const key of Object.keys(manifest).sort()) out[key] = manifest[key]!;
  return out;
}

export function buildManifest(only: readonly string[] | undefined): Manifest {
  const manifest: Manifest = {};
  for (const path of discoverFixtures(only)) {
    manifest[relative(REPO, path)] = renderFixture(readFileSync(path, 'utf-8'));
  }
  return sortManifest(manifest);
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export interface DiffResult {
  readonly added: string[];
  readonly removed: string[];
  readonly changed: string[];
}

/** Pure comparison of two manifests — no filesystem access, so this is the
 *  fixture-free unit under `tests/unit/scripts/render-manifest.test.ts`. */
export function diffManifests(baseline: Manifest, current: Manifest): DiffResult {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();
  for (const key of keys) {
    const b = baseline[key];
    const c = current[key];
    if (b === undefined) added.push(key);
    else if (c === undefined) removed.push(key);
    else if (JSON.stringify(b) !== JSON.stringify(c)) changed.push(key);
  }
  return { added, removed, changed };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export type Options =
  | { readonly mode: 'out'; readonly out: string; readonly only: string[] | undefined }
  | { readonly mode: 'diff'; readonly baselinePath: string; readonly currentPath: string };

export function parseArgs(argv: readonly string[]): Options {
  let out: string | undefined;
  let baselinePath: string | undefined;
  let currentPath: string | undefined;
  let only: string[] | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--out') out = argv[++i];
    else if (a === '--diff') {
      baselinePath = argv[++i];
      currentPath = argv[++i];
    } else if (a === '--only') only = argv[++i]!.split(',');
  }
  if (baselinePath !== undefined && currentPath !== undefined) {
    return { mode: 'diff', baselinePath, currentPath };
  }
  if (out !== undefined) return { mode: 'out', out, only };
  throw new Error('render-manifest: pass --out <file> or --diff <baseline> <current>');
}

function readManifest(path: string): Manifest {
  return JSON.parse(readFileSync(path, 'utf-8')) as Manifest;
}

function runOut(opts: { readonly out: string; readonly only: string[] | undefined }): void {
  const manifest = buildManifest(opts.only);
  writeFileSync(opts.out, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`[render-manifest] wrote ${Object.keys(manifest).length} fixture(s) to ${opts.out}`);
}

function runDiff(opts: { readonly baselinePath: string; readonly currentPath: string }): void {
  const { added, removed, changed } = diffManifests(readManifest(opts.baselinePath), readManifest(opts.currentPath));
  const n = added.length + removed.length + changed.length;
  console.log(`${n} fixtures differ`);
  for (const k of added) console.log(`  + ${k}`);
  for (const k of removed) console.log(`  - ${k}`);
  for (const k of changed) console.log(`  ~ ${k}`);
  if (n > 0) process.exitCode = 1;
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.mode === 'diff') runDiff(opts);
  else runOut(opts);
}

/* v8 ignore start -- CLI entry point; exercised by real runs, not the unit
 * suite (matches scripts/dot-sync-report.ts's own guard). */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
