#!/usr/bin/env node
/**
 * Capture oracle SVGs for one diagram type into the committed cache
 * (`test-results/dot-cache/<type>/<slug>/{in.puml,in.svg,.done}`), the shape
 * `scripts/dot-sync-report.ts#plantumlDots` and
 * `scripts/svg-parity-survey.ts#listFixtureDirs` both already read.
 *
 * Encodes two findings from `.agent-notes/aoh-T0.md`:
 *   1. `net.sourceforge.plantuml.Run`'s exit code is not a success signal —
 *      it exits non-zero whenever ANY per-diagram error occurred, even when
 *      it wrote a complete, valid SVG. Success here is judged from the files
 *      present in the output directory, never from `execFileSync`'s throw.
 *   2. A block that names its own diagram (`@startuml <name>`) makes the jar
 *      write `<name>.svg` instead of `in.svg`. When exactly one `.svg` (of
 *      any name) is produced, it is adopted as the block-0 capture and
 *      renamed to `in.svg`.
 *
 * Usage:
 *   npx jiti scripts/capture-oracle-cache.ts <type> [--rebuild] [--only <slug>[,<slug>]]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ORACLE_JAR_TIMEOUT_MS } from './lib/oracle-jar-timeout.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(REPO, 'tests', 'visual', 'data');
const CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
const ORACLE_RENDER = join(REPO, 'scripts', 'oracle-render.sh');

export interface Fixture {
  slug: string;
  markup: string;
}

export interface ClassifyResult {
  kind: 'in-svg' | 'renamed' | 'none' | 'ambiguous';
  file?: string;
}

export interface PlanOptions {
  rebuild: boolean;
  only?: string[];
}

export interface CaptureResult {
  type: string;
  captured: string[];
  jarFailed: string[];
  renamed: string[];
}

/** Judges render success from the output directory's contents, never from
 *  the jar's exit code (aoh-T0.md Finding 1). Adopts a lone differently-
 *  named `.svg` as the block-0 capture (aoh-T0.md Finding 2). */
export function classifyOutput(dir: string): ClassifyResult {
  if (existsSync(join(dir, 'in.svg'))) return { kind: 'in-svg', file: 'in.svg' };
  const svgs = readdirSync(dir).filter((f) => f.endsWith('.svg'));
  if (svgs.length === 0) return { kind: 'none' };
  if (svgs.length > 1) return { kind: 'ambiguous' };
  const file = svgs[0]!;
  renameSync(join(dir, file), join(dir, 'in.svg'));
  return { kind: 'renamed', file };
}

/** Which manifest entries still need rendering. Pure — no filesystem access.
 *  Mirrors scripts/dot-sync-report.ts#plantumlDots's `if (!rebuild &&
 *  existsSync(done)) return` skip check, generalised to a batch. */
export function planEntries(manifest: Fixture[], existingDone: Set<string>, opts: PlanOptions): Fixture[] {
  const only = opts.only ? new Set(opts.only) : undefined;
  return manifest.filter((f) => {
    if (only && !only.has(f.slug)) return false;
    if (!opts.rebuild && existingDone.has(f.slug)) return false;
    return true;
  });
}

function doneSlugs(typeDir: string, manifest: Fixture[]): Set<string> {
  const done = new Set<string>();
  for (const f of manifest) {
    if (existsSync(join(typeDir, f.slug, '.done'))) done.add(f.slug);
  }
  return done;
}

/** Writes `in.puml` and renders through the pinned oracle jar. The jar's exit
 *  code is ignored on purpose (aoh-T0.md Finding 1) — the catch is not an
 *  error swallow, it is the documented success signal. */
function renderFixture(dir: string, markup: string): ClassifyResult {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'in.puml'), markup, 'utf-8');
  try {
    execFileSync(ORACLE_RENDER, [dir, join(dir, 'in.puml')], { stdio: 'ignore', timeout: ORACLE_JAR_TIMEOUT_MS });
  } catch {
    /* non-zero exit does not mean render failure; classifyOutput decides */
  }
  return classifyOutput(dir);
}

interface ResultBuckets {
  captured: string[];
  jarFailed: string[];
  renamed: string[];
}

/** `.done` is written only on success, per this task's success definition. */
function recordResult(slug: string, result: ClassifyResult, dir: string, buckets: ResultBuckets): void {
  if (result.kind === 'in-svg' || result.kind === 'renamed') {
    writeFileSync(join(dir, '.done'), '');
    buckets.captured.push(slug);
    if (result.kind === 'renamed') buckets.renamed.push(slug);
  } else {
    console.error(`[capture-oracle-cache] ${slug}: jarFailed (${result.kind})`);
    buckets.jarFailed.push(slug);
  }
}

export function captureOracleCache(
  type: string,
  manifest: Fixture[],
  opts: PlanOptions,
  cacheRoot: string = CACHE_DIR,
): CaptureResult {
  const typeDir = join(cacheRoot, type);
  const toRender = planEntries(manifest, doneSlugs(typeDir, manifest), opts);
  const buckets: ResultBuckets = { captured: [], jarFailed: [], renamed: [] };

  for (const f of toRender) {
    console.error(`[capture-oracle-cache] rendering ${type}/${f.slug}`);
    const dir = join(typeDir, f.slug);
    recordResult(f.slug, renderFixture(dir, f.markup), dir, buckets);
  }

  return { type, ...buckets };
}

function readManifest(type: string): Fixture[] {
  return JSON.parse(readFileSync(join(DATA_DIR, `${type}.json`), 'utf-8')) as Fixture[];
}

function parseArgs(argv: string[]): { type: string; opts: PlanOptions } {
  const [type, ...rest] = argv;
  if (!type) throw new Error('usage: capture-oracle-cache.ts <type> [--rebuild] [--only <slug>[,<slug>]]');
  let rebuild = false;
  let only: string[] | undefined;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--rebuild') rebuild = true;
    else if (rest[i] === '--only') only = (rest[++i] ?? '').split(',').filter((s) => s.length > 0);
  }
  return { type, opts: only ? { rebuild, only } : { rebuild } };
}

function main(): void {
  const { type, opts } = parseArgs(process.argv.slice(2));
  const result = captureOracleCache(type, readManifest(type), opts);
  console.log(JSON.stringify(result));
}

/* v8 ignore start -- CLI entry point; exercised by real runs, not the unit
 * suite (matches scripts/dot-sync-report.ts's guard). */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
