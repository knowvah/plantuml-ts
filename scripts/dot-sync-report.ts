#!/usr/bin/env node
/**
 * DOT-sync report — how close our DotInputGraph is to PlantUML's svek DOT across a fixture
 * corpus, filtered per-type to the PlantUML data-diagram-type it should render as (via cached
 * canonical SVGs). PlantUML's svek DOT is cached under test-results/dot-cache/<type>/<slug>/
 * (via -DPLANTUML_DUMP_DOT) so re-runs after a parser/layout change are fast.
 *
 * Modes:
 *   [--rebuild] [--type-tag TAG] [type ...]   Aggregate report (default: component usecase).
 *     Canonical SVGs are self-built via the oracle jar (batch mode) if missing for a type.
 *   --slug <slug> <type>   Drill-down: oracle svek DOT vs. ours (toSvekDot), with the per-check
 *     StructuralDiff and underlying values for every failing check, for one fixture.
 *   --probe-json-dot   One-shot probe: does -DPLANTUML_DUMP_DOT produce svek-*.dot for json/dot?
 *     Writes findings to plans/dot-oracle-sync/phase-5-json-dot/probe.md.
 *   --equal-list   Addendum: writes slugs classified "structurally EQUAL" per type to
 *     test-results/dot-sync-equal/<type>.txt — a feed for promoting fixtures into oracle/goldens/.
 *   --markdown   Writes docs/parity-report.md (row shape/vocabulary in dot-parity-rows.ts).
 *     Reads only what is already cached — no oracle jar batch build (D1, plans/docs-site/decisions.md).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import { MapIncludeStore } from '../src/core/tim/IncludeStore.js';
import { withStdlib } from '../src/core/tim/StdlibStore.js';
import { buildStdlibAssetsStore } from './stdlib-assets-store.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
  type StructuralDiff,
} from '../tests/oracle/svek-dot.js';
import { CHECKS, drillDownGraph, stripDiagramName, stripLayoutPragma } from './dot-sync-drilldown.js';
import {
  ensureCanonical,
  enumerateFixtures,
  findFixture,
  reportSkips,
  taggedSlugs,
  type Fixture,
} from './dot-sync-fixtures.js';
import { EXPECTED_TAG, dotParityRows, dotParityMarkdown, writeDotParityJson } from './dot-parity-rows.js';
import { runProbeJsonDot } from './dot-sync-probe.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Lizard-safe (no regex literals): matches svek-<N>.dot dump files. */
const SVEK_DOT_RE = new RegExp('^svek-([0-9]+)\\.dot$');
/** Exported so dot-parity-rows.ts can check per-type cache freshness. */
export const CACHE = join(REPO, 'test-results', 'dot-cache');
const EQUAL_LIST_DIR = join(REPO, 'test-results', 'dot-sync-equal');

function resolveJar(): string {
  if (process.env.PLANTUML_JAR !== undefined) {
    console.error(`[dot-sync] oracle jar: ${process.env.PLANTUML_JAR}`);
    return process.env.PLANTUML_JAR;
  }
  const distJar = join(REPO, 'oracle', 'dist', 'plantuml-oracle.jar');
  if (existsSync(distJar)) {
    console.error(`[dot-sync] oracle jar: ${distJar}`);
    return distJar;
  }
  const libs = join(homedir(), 'git', 'plantuml', 'build', 'libs');
  const jar = existsSync(libs) ? readdirSync(libs).find((f) => /^plantuml-.*\.jar$/.test(f)) : undefined;
  if (jar === undefined) throw new Error('No PlantUML jar; set PLANTUML_JAR.');
  const resolved = join(libs, jar);
  console.error(`[dot-sync] oracle jar: ${resolved}`);
  return resolved;
}

const svekDotIndex = (f: string): number => Number(SVEK_DOT_RE.exec(f)?.[1] ?? 0);

function dotFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => SVEK_DOT_RE.test(f))
    .sort((a, b) => svekDotIndex(a) - svekDotIndex(b))
    .map((f) => readFileSync(join(dir, f), 'utf-8'));
}

/** Cached PlantUML svek DOT for a fixture; dumps once via -DPLANTUML_DUMP_DOT.
 *  Exported so `dot-sync-probe.ts` can reuse the same cache without duplicating it. */
export function plantumlDots(jar: string, type: string, f: Fixture, rebuild: boolean): string[] {
  const dir = join(CACHE, type, f.slug);
  const done = join(dir, '.done');
  if (!rebuild && existsSync(done)) return dotFiles(dir);
  mkdirSync(dir, { recursive: true });
  for (const old of readdirSync(dir)) {
    if (SVEK_DOT_RE.test(old)) writeFileSync(join(dir, old), '');
  }
  // `stripDiagramName` for the same reason `generateCanonical` needs it: the
  // jar names output after the DIAGRAM, so a named fixture's SVG lands as
  // `<name>.svg` instead of `in.svg`. Only `svek-*.dot` is read back here, so
  // this cache tolerated it — but an entry with no `in.svg` reads as
  // corrupt to anyone inspecting it.
  writeFileSync(join(dir, 'in.puml'), stripDiagramName(stripLayoutPragma(f.markup)), 'utf-8');
  try {
    execFileSync(
      'java',
      [
        '-DPLANTUML_DETERMINISTIC_TEXT=true',
        '-DPLANTUML_DUMP_DOT=' + dir,
        '-jar',
        jar,
        '-tsvg',
        '-o',
        dir,
        join(dir, 'in.puml'),
      ],
      { stdio: 'ignore', timeout: 25_000 },
    );
  } catch {
    /* partial — read what landed */
  }
  writeFileSync(done, '');
  return dotFiles(dir);
}

/** Types whose `!include <bundle/thing>` fixtures this report resolves
 *  through the assets-backed stdlib store (T9's 6 target fixtures are all
 *  component/usecase). class/object/state stay on the pre-T9 no-store
 *  behavior deliberately -- `class-dot-parity.test.ts`'s doc comment: a few
 *  pinned CLASS-tagged fixtures (`!include <tupadr3/...>` PLUS a
 *  jar-embedded `sprite NAME jar:...` our port can't resolve either way)
 *  are pinned EQUAL as a legitimate 0-vs-0 (both sides skip graphviz for a
 *  single-leaf diagram) specifically BECAUSE our side currently errors
 *  before layout; resolving the include surfaces a SEPARATE, out-of-scope
 *  single-leaf-detection divergence in the class engine
 *  (bidusa-22-jutu505, ruliki-78-biji661) that would move the FROZEN
 *  class/object/state denominators this mission must not touch. */
const STDLIB_WIRED_TYPES = new Set(['component', 'usecase']);

/** `!include <bundle/thing>` fixtures (D9 sprite-dims mechanisms, T9) need a
 *  stdlib store or they hit `StdlibNotBundledError` before layout ever
 *  runs -- an assets-backed store (`scripts/stdlib-assets-store.ts`) is
 *  wired into every render this report drives for `STDLIB_WIRED_TYPES`. */
function ourInputs(type: string, markup: string): DotInputGraph[] {
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => inputs.push(g));
  try {
    renderSync(markup, {
      measurer: new WidthTableMeasurer(),
      ...(STDLIB_WIRED_TYPES.has(type)
        ? { includeStore: withStdlib(new MapIncludeStore(), buildStdlibAssetsStore()) }
        : {}),
    });
  } catch {
    /* no candidate */
  } finally {
    setLayoutInputObserver(undefined);
  }
  return inputs;
}

interface Agg {
  total: number;
  equal: number;
  noCandidate: number;
  countMismatch: number;
  /** `!pragma layout elk` — the oracle jar dumps DOT only on the
   *  graphviz path, so these fixtures have no oracle to compare against.
   *  Excluded from the comparable total. */
  oracleBlind: number;
  fail: Record<string, number>;
  nodeOver: number;
  nodeUnder: number;
  edgeOver: number;
  edgeUnder: number;
  clusterOver: number;
  clusterUnder: number;
  examples: Record<string, string[]>;
  /** Slugs classified "structurally EQUAL", in encounter order. Populated
   *  regardless of --equal-list so callers can inspect the report result
   *  directly; only written to disk when that flag is passed. */
  equalSlugs: string[];
}

function newAgg(): Agg {
  return {
    total: 0,
    equal: 0,
    noCandidate: 0,
    countMismatch: 0,
    oracleBlind: 0,
    fail: Object.fromEntries(CHECKS.map((c) => [c, 0])),
    nodeOver: 0,
    nodeUnder: 0,
    edgeOver: 0,
    edgeUnder: 0,
    clusterOver: 0,
    clusterUnder: 0,
    examples: Object.fromEntries(CHECKS.map((c) => [c, []])),
    equalSlugs: [],
  };
}

function recordDeltas(a: Agg, d: StructuralDiff): void {
  if (d.candidate.nodes > d.oracle.nodes) a.nodeOver++;
  else if (d.candidate.nodes < d.oracle.nodes) a.nodeUnder++;
  if (d.candidate.edges > d.oracle.edges) a.edgeOver++;
  else if (d.candidate.edges < d.oracle.edges) a.edgeUnder++;
  if (d.candidate.clusters > d.oracle.clusters) a.clusterOver++;
  else if (d.candidate.clusters < d.oracle.clusters) a.clusterUnder++;
}

function recordDiff(a: Agg, slug: string, diffs: StructuralDiff[]): void {
  for (const d of diffs) {
    for (const c of CHECKS) {
      if (!d[c]) {
        a.fail[c] = (a.fail[c] ?? 0) + 1;
        if (a.examples[c]!.length < 6) a.examples[c]!.push(slug);
      }
    }
    recordDeltas(a, d);
  }
}

function analyzeFixture(a: Agg, slug: string, dots: string[], inputs: DotInputGraph[]): void {
  a.total++;
  // Both sides skip graphviz (degenerate single-leaf / empty diagrams):
  // GraphvizImageBuilder.buildImage:211-222 — that IS DOT-count agreement.
  if (dots.length === 0 && inputs.length === 0) {
    a.equal++;
    a.equalSlugs.push(slug);
    return;
  }
  if (inputs.length === 0) {
    a.noCandidate++;
    return;
  }
  if (dots.length !== inputs.length) {
    a.countMismatch++;
    return;
  }
  const diffs = dots.map((dot, i) => compareStructural(parseSvekDot(dot), dotInputToStructural(inputs[i]!)));
  if (diffs.every((d) => d.structurallyEqual)) {
    a.equal++;
    a.equalSlugs.push(slug);
    return;
  }
  recordDiff(a, slug, diffs);
}

function report(type: string, tag: string, a: Agg): void {
  const pct = (n: number): string => ((100 * n) / a.total).toFixed(0) + '%';
  console.log('\n===== ' + type + ' — ' + a.total + ' ' + tag + ' fixtures =====');
  console.log('  structurally EQUAL (DOT in sync): ' + a.equal + ' (' + pct(a.equal) + ')');
  console.log('  no-candidate (we feed nothing):   ' + a.noCandidate);
  console.log('  oracle-blind (pragma layout):     ' + a.oracleBlind);
  console.log('  graph-count mismatch:             ' + a.countMismatch);
  console.log('  diverging-check failures (per fixture, among the rest):');
  for (const c of CHECKS) {
    if (a.fail[c]! > 0)
      console.log('    ' + c.padEnd(12) + ' fails: ' + a.fail[c] + '   e.g. ' + a.examples[c]!.slice(0, 4).join(', '));
  }
  console.log(
    `  node count: over ${a.nodeOver} / under ${a.nodeUnder} | edges: over ${a.edgeOver} / under ${a.edgeUnder} | clusters: over ${a.clusterOver} / under ${a.clusterUnder}`,
  );
}

/** Writes the sorted EQUAL slug list for a type to
 *  test-results/dot-sync-equal/<type>.txt (one slug per line). */
function writeEqualList(type: string, a: Agg): void {
  mkdirSync(EQUAL_LIST_DIR, { recursive: true });
  const out = join(EQUAL_LIST_DIR, type + '.txt');
  const sorted = [...a.equalSlugs].sort();
  writeFileSync(out, sorted.join('\n') + (sorted.length > 0 ? '\n' : ''), 'utf-8');
  console.error('[dot-sync] wrote ' + sorted.length + ' EQUAL slugs to ' + out);
}

/** Core aggregation shared by the console report and dot-parity-rows.ts: classifies `fixtures`
 *  to `tag` via cached canonical SVGs, diffs each non-oracle-blind fixture's cached DOT against ours. */
export function buildAgg(jar: string, type: string, fixtures: Fixture[], tag: string, rebuild: boolean): Agg {
  const slugs = taggedSlugs(type, tag);
  const a = newAgg();
  const skipped: string[] = [];
  let done = 0;
  for (const f of fixtures) {
    if (!slugs.has(f.slug)) {
      skipped.push(f.slug);
      continue;
    }
    if (/!pragma\s+layout\s+elk/i.test(f.markup)) {
      a.oracleBlind++;
      continue;
    }
    analyzeFixture(a, f.slug, plantumlDots(jar, type, f, rebuild), ourInputs(type, f.markup));
    if (++done % 50 === 0) console.error('  ' + type + ': ' + done + '/' + slugs.size);
  }
  reportSkips(type, tag, fixtures.length, a.total + a.oracleBlind, skipped);
  return a;
}

function runType(
  jar: string,
  type: string,
  rebuild: boolean,
  tagOverride: string | undefined,
  equalList: boolean,
): void {
  const fixtures = enumerateFixtures(type);
  if (fixtures === undefined) {
    console.error(
      `No fixture manifest for "${type}" at tests/visual/data/${type}.json. Run npm run visual:classify first, then re-run this report.`,
    );
    return;
  }
  const tag = tagOverride ?? EXPECTED_TAG[type];
  if (tag === undefined) {
    console.error('No known expected data-diagram-type for "' + type + '"; pass --type-tag <TAG>.');
    return;
  }
  ensureCanonical(jar, type, fixtures);
  const a = buildAgg(jar, type, fixtures, tag, rebuild);
  report(type, tag, a);
  if (equalList) writeEqualList(type, a);
}

// --markdown -------------------------------------------------------------------

const PARITY_REPORT_OUT = join(REPO, 'docs', 'parity-report.md');

/** Row computation and rendering live in dot-parity-rows.ts; this just resolves the jar and writes the file. */
function runMarkdown(jar: string): void {
  const rows = dotParityRows(jar);
  const markdown = dotParityMarkdown(rows, new Date().toISOString().slice(0, 10));
  mkdirSync(dirname(PARITY_REPORT_OUT), { recursive: true });
  writeFileSync(PARITY_REPORT_OUT, markdown, 'utf-8');
  console.log('Wrote ' + PARITY_REPORT_OUT);
}

// --slug drill-down ----------------------------------------------------------

function drillDownSlug(jar: string, type: string, slug: string, rebuild: boolean): void {
  const f = findFixture(type, slug);
  const oracleDots = plantumlDots(jar, type, f, rebuild);
  const inputs = ourInputs(type, f.markup);
  console.log('=== slug: ' + slug + ' (' + type + ') ===');
  console.log('oracle graphs: ' + oracleDots.length + '  candidate graphs: ' + inputs.length);
  const n = Math.max(oracleDots.length, inputs.length);
  for (let i = 0; i < n; i++) drillDownGraph(i, oracleDots[i], inputs[i]);
}

// CLI -------------------------------------------------------------------------

interface Options {
  rebuild: boolean;
  slug: string | undefined;
  typeTag: string | undefined;
  probeJsonDot: boolean;
  equalList: boolean;
  markdown: boolean;
  jsonOut: string | undefined;
  types: string[];
}

function parseArgs(argv: string[]): Options {
  let slug: string | undefined;
  let typeTag: string | undefined;
  let jsonOut: string | undefined;
  let rebuild = false;
  let probeJsonDot = false;
  let equalList = false;
  let markdown = false;
  const types: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--rebuild') rebuild = true;
    else if (a === '--slug') slug = argv[++i];
    else if (a === '--type-tag') typeTag = argv[++i];
    else if (a === '--probe-json-dot') probeJsonDot = true;
    else if (a === '--equal-list') equalList = true;
    else if (a === '--markdown') markdown = true;
    else if (a === '--json') jsonOut = argv[++i];
    else types.push(a);
  }
  return { rebuild, slug, typeTag, probeJsonDot, equalList, markdown, jsonOut, types };
}

/** The three one-shot modes that write a single artifact and exit. Extracted
 *  so `main` stays under the complexity hook's CCN cap. Returns true when one
 *  fired, so `main` knows not to fall through to the aggregate report. */
function runSingleShotMode(jar: string, opts: Options): boolean {
  if (opts.probeJsonDot) {
    runProbeJsonDot(jar);
    return true;
  }
  if (opts.markdown) {
    runMarkdown(jar);
    return true;
  }
  if (opts.jsonOut !== undefined) {
    writeDotParityJson(opts.jsonOut, jar);
    console.log('Wrote ' + opts.jsonOut);
    return true;
  }
  return false;
}

function main(): void {
  const jar = resolveJar();
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(CACHE, { recursive: true });

  if (runSingleShotMode(jar, opts)) return;
  if (opts.slug !== undefined) {
    const type = opts.types[0];
    if (type === undefined) throw new Error('--slug requires a type argument, e.g. --slug <slug> <type>');
    drillDownSlug(jar, type, opts.slug, opts.rebuild);
    return;
  }
  const types = opts.types.length > 0 ? opts.types : ['component', 'usecase'];
  for (const t of types) runType(jar, t, opts.rebuild, opts.typeTag, opts.equalList);
}

/* v8 ignore start -- CLI entry point; the report is exercised by real runs, not
 * the unit-test suite (matches scripts/svg-parity-survey.ts's CLI block). The
 * guard exists so tests can import this module without launching a jar run. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
