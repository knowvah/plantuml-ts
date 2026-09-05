/**
 * SVG parity survey — differential comparison of plantuml-ts's rendered SVG
 * against the cached PlantUML jar SVG (`in.svg`) over the component/usecase
 * corpus (`test-results/dot-cache/`, populated by scripts/dot-sync-report.ts).
 *
 * A report, not a gate: divergences are expected data, especially pre-cutover
 * (the description renderer is still legacy as of this baseline — verdicts
 * are overwhelmingly `diverged`, which proves the instrument rather than
 * signaling a regression). The survey never crashes on a bad fixture: renders
 * run in PERSISTENT `jiti` worker subprocesses under a per-fixture wall-clock
 * timeout (`svg-parity-workers.ts`), mirroring ~/git/knowvah/dot-engine's
 * test/corpus/survey.ts (a hang becomes `timeout`, a throw becomes
 * `errored`); the parent kills and respawns the worker that was holding a
 * bad fixture. Verdict comparison logic
 * (`diffVerdict`, `isWellFormedSvg`) is ported near-verbatim from that
 * project's survey.ts.
 *
 * Each fixture's DOT-EQUAL status is also recorded (`dotEqual`), reusing the
 * same oracle DOT-parity helpers scripts/dot-sync-report.ts uses
 * (tests/oracle/svek-dot.ts), so later tasks can filter ratchet eligibility
 * without re-deriving it.
 *
 *   npx jiti scripts/svg-parity-survey.ts            survey the full corpus
 *   npx jiti scripts/svg-parity-survey.ts --render-one <dir>
 *     renders ONE cached fixture dir and prints `{ svg, dotEqual,
 *     oracleBlind }` as JSON on stdout. Kept as a one-shot debugging entry
 *     point; the survey itself no longer uses it.
 *   npx jiti scripts/svg-parity-survey.ts --render-many
 *     persistent-worker mode: one fixture dir per stdin line, one JSON frame
 *     per stdout line. Internal use only (spawned by the survey itself).
 *
 * Node-only dev/test infra — never imported by src/index.ts.
 */
import { spawn } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import type { DotInputGraph } from '../src/core/graph-layout.types.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
} from '../tests/oracle/svek-dot.js';
import { buildSpriteAssetsStore } from './sprite-assets-store.js';
import { runPersistentPool, type WorkerOutcome } from './svg-parity-workers.js';
import { compareSvg, type Diff } from '../tests/oracle/svg-conformance/compare.js';
import { normalizeSvg } from '../tests/oracle/svg-conformance/normalize.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
const PARITY_OUT = join(REPO, 'tests', 'oracle', 'svg-conformance', 'parity.json');
const THIS_FILE = fileURLToPath(import.meta.url);
const DEFAULT_TYPES = ['component', 'usecase'];
/**
 * Wall-clock budget per fixture. **60s, not the 10s this started at** — SI19,
 * 2026-08-12.
 *
 * Historically the budget had to cover process START, which dominated the
 * render by two orders of magnitude: a worker spends **~8.9s importing
 * `src/index.js`** through jiti against **~7ms rendering** (measured;
 * `JITI_FS_CACHE=true` changes nothing). `src` outgrew the original 10s
 * budget, so a full run returned almost entirely `timeout` — it wrote 270
 * timeouts of 271 over a good `parity-state.json` before being caught and
 * reverted. Discriminating experiment on the 3-fixture `hcl` type: 2 timeouts
 * of 3 at 10s, 0 of 3 at 60s.
 *
 * Workers are persistent now, so that import is paid once per WORKER rather
 * than once per fixture and the budget covers the render alone — 60s is
 * enormously generous against 7ms, and deliberately so (see below). The
 * speed-up is the point: state 271 went ~5min -> **18.7s**, class 723
 * ~13min -> **21s**, with 0 rows differing from the per-spawn results on
 * either. It also removes the failure mode that motivated this: the old
 * model logged 48 spurious `timeout`s at load average 4.9, where the pooled
 * one logs 0 at load average 52, because the contention window is seconds
 * instead of half an hour.
 *
 * That failure mode is the reason this is generous rather than snug. A survey
 * that times out does not fail loudly — it writes a `timeout` verdict, which
 * looks like data, over a file that held real measurements. Budget for the
 * slowest machine that will ever run this, and treat ANY `timeout` in a
 * committed run as a defect to investigate rather than a fixture to accept.
 */
const RENDER_TIMEOUT_MS = Number(process.env.SVG_PARITY_TIMEOUT_MS ?? 60_000);
const CONCURRENCY = Number(process.env.SVG_PARITY_CONCURRENCY ?? 6);
/** Lizard-safe (no regex literals in flagged positions): svek-<N>.dot dumps. */
const SVEK_DOT_RE = new RegExp('^svek-([0-9]+)\\.dot$');
/** Oracle-blind fixtures (`!pragma layout smetana|elk`): the jar only dumps
 *  svek DOT on the graphviz path, so DOT-parity has no oracle to compare
 *  against — mirrors scripts/dot-sync-report.ts's oracleBlind bucket. */
const PRAGMA_LAYOUT_RE = /!pragma\s+layout\s+/i;

// ---------------------------------------------------------------------------
// Public types — the interface contract consumed by the dashboard + T18/T19.
// ---------------------------------------------------------------------------

export type Verdict =
  | 'conformant'
  | 'structural-match'
  | 'diverged'
  | 'oracle-error'
  | 'errored'
  | 'timeout';

export interface FixtureRow {
  slug: string;
  type: string;
  verdict: Verdict;
  dotEqual: boolean;
  firstDiff?: string;
  maxDelta?: number;
  maxDeltaPath?: string;
  errMsg?: string;
  /** `!pragma layout smetana|elk` — DOT-parity has no oracle; dotEqual is a
   *  safe `false` rather than a real judgment. See PRAGMA_LAYOUT_RE. */
  oracleBlind?: boolean;
}

export interface ParityReport {
  generatedAt: string;
  fixtures: FixtureRow[];
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ---------------------------------------------------------------------------
// Pure verdict logic (ported near-verbatim from @knowvah/dot-engine's survey.ts,
// adapted to this project's field names).
// ---------------------------------------------------------------------------

/** True iff `svg` is well-formed enough for `normalizeSvg`/`compareSvg` to
 *  parse without throwing. Used to gate the ORACLE side: a malformed cached
 *  `in.svg` is a harness/oracle-cache fault, not a port divergence. */
export function isWellFormedSvg(svg: string): boolean {
  try {
    normalizeSvg(svg);
    return true;
  } catch {
    return false;
  }
}

/** Worst numeric diff (largest delta) and its path; first-encountered wins on
 *  ties (strict `>`) — a stable, document-order tie-break over the compareSvg
 *  walk order. `maxDeltaPath` is undefined only when there are no numeric diffs. */
function worstNumericDiff(diffs: Diff[]): { maxDelta: number; maxDeltaPath: string | undefined } {
  let maxDelta = 0;
  let maxDeltaPath: string | undefined;
  for (const d of diffs) {
    if (d.delta !== undefined && d.delta > maxDelta) {
      maxDelta = d.delta;
      maxDeltaPath = d.path;
    }
  }
  return { maxDelta, maxDeltaPath };
}

/** Classify a rendered pair: conformant / structural-match / diverged. */
export function diffVerdict(
  port: string,
  oracle: string,
): Pick<FixtureRow, 'verdict' | 'maxDelta' | 'firstDiff' | 'maxDeltaPath' | 'errMsg'> {
  let diffs: Diff[];
  try {
    const cmp = compareSvg(port, oracle, 'deterministic');
    if (cmp.pass) return { verdict: 'conformant' };
    diffs = cmp.diffs;
  } catch (e) {
    return { verdict: 'diverged', firstDiff: '<compare-threw>', errMsg: errText(e) };
  }
  const structural = diffs.find((d) => d.delta === undefined);
  const { maxDelta, maxDeltaPath } = worstNumericDiff(diffs);
  const pathField = maxDeltaPath !== undefined ? { maxDeltaPath } : {};
  if (structural) {
    return { verdict: 'diverged', maxDelta, firstDiff: structural.path, ...pathField };
  }
  return { verdict: 'structural-match', maxDelta, ...pathField };
}

/** DOT-level parity: mirrors scripts/dot-sync-report.ts's analyzeFixture. Both
 *  sides skipping graphviz (degenerate single-leaf/empty diagrams) IS
 *  agreement; a count mismatch or a structural check failure is not. */
export function computeDotEqual(
  dots: string[],
  inputs: DotInputGraph[],
  oracleBlind: boolean,
): boolean {
  if (oracleBlind) return false;
  if (dots.length === 0 && inputs.length === 0) return true;
  if (inputs.length === 0) return false;
  if (dots.length !== inputs.length) return false;
  return dots.every((dot, i) => {
    const diff = compareStructural(parseSvekDot(dot), dotInputToStructural(inputs[i]!));
    return diff.structurallyEqual;
  });
}

// ---------------------------------------------------------------------------
// Fixture discovery
// ---------------------------------------------------------------------------

interface FixtureDir {
  slug: string;
  dir: string;
}

/** Cached fixture dirs for one type: `.done` + `in.puml` + `in.svg` present
 *  (a partial/interrupted dot-sync-report.ts run is skipped, not crashed on). */
function listFixtureDirs(type: string): FixtureDir[] {
  const typeDir = join(CACHE_DIR, type);
  if (!existsSync(typeDir)) return [];
  const out: FixtureDir[] = [];
  for (const slug of readdirSync(typeDir)) {
    const dir = join(typeDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, '.done'))) continue;
    if (!existsSync(join(dir, 'in.puml')) || !existsSync(join(dir, 'in.svg'))) continue;
    out.push({ slug, dir });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

const svekIndex = (f: string): number => Number(SVEK_DOT_RE.exec(f)?.[1] ?? 0);

function readSvekDots(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => SVEK_DOT_RE.test(f))
    .sort((a, b) => svekIndex(a) - svekIndex(b))
    .map((f) => readFileSync(join(dir, f), 'utf-8'));
}

// ---------------------------------------------------------------------------
// Isolation worker (`--render-one <dir>`)
// ---------------------------------------------------------------------------

/** Renders ONE cached fixture and prints `{ svg, dotEqual, oracleBlind }` as
 *  JSON to stdout. Runs as a spawned subprocess (see surveyOneFixture) so a
 *  synchronous render that never returns cannot hang the survey — the parent
 *  kills this process on its wall-clock budget instead. A throw prints a
 *  `__RENDER_ERROR__` sentinel to stderr and exits nonzero. */
function renderOneMode(dir: string): void {
  const markup = readFileSync(join(dir, 'in.puml'), 'utf-8');
  const oracleBlind = PRAGMA_LAYOUT_RE.test(markup);
  const svekDots = readSvekDots(dir);
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => inputs.push(g));
  let svg: string;
  try {
    // The jar always has its internal sprites available, so a survey that
    // renders without them measures a diagram PlantUML never produces. A
    // `jar:` sprite (`CommandSpriteFile.java:108-112`) resolves only through
    // `RenderOptions.assetStore`; starved of it, `<$name>` contributes ZERO
    // width and every label reserving it under-measures. Cost is one 608 KB
    // eager walk per subprocess, measured at 5.5 ms -- ~7 s across the whole
    // corpus, against a survey that runs for tens of minutes.
    svg = renderSync(markup, {
      measurer: new WidthTableMeasurer(),
      assetStore: buildSpriteAssetsStore(),
    });
  } catch (err) {
    setLayoutInputObserver(undefined);
    process.stderr.write(`__RENDER_ERROR__${errText(err).split('\n')[0]}\n`);
    process.exit(1);
  }
  setLayoutInputObserver(undefined);
  const dotEqual = computeDotEqual(svekDots, inputs, oracleBlind);
  process.stdout.write(JSON.stringify({ svg, dotEqual, oracleBlind }));
}

/** Renders ONE fixture and returns the protocol frame, without exiting — the
 *  reusable half of {@link renderOneMode}. */
function renderFrame(dir: string): string {
  const markup = readFileSync(join(dir, 'in.puml'), 'utf-8');
  const oracleBlind = PRAGMA_LAYOUT_RE.test(markup);
  const svekDots = readSvekDots(dir);
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => inputs.push(g));
  try {
    const svg = renderSync(markup, {
      measurer: new WidthTableMeasurer(),
      assetStore: buildSpriteAssetsStore(),
    });
    return JSON.stringify({ svg, dotEqual: computeDotEqual(svekDots, inputs, oracleBlind), oracleBlind });
  } catch (err) {
    return JSON.stringify({ error: errText(err).split('\n')[0] });
  } finally {
    setLayoutInputObserver(undefined);
  }
}

/**
 * Persistent worker (`--render-many`): imports `src/index.js` ONCE, then
 * services one fixture dir per stdin line, one JSON frame per stdout line.
 * See `svg-parity-workers.ts` for the protocol and the isolation trade.
 */
function renderManyMode(): void {
  let buf = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk: string) => {
    buf += chunk;
    for (let nl = buf.indexOf('\n'); nl !== -1; nl = buf.indexOf('\n')) {
      const dir = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (dir.length > 0) process.stdout.write(`${renderFrame(dir)}\n`);
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

// ---------------------------------------------------------------------------
// Survey
// ---------------------------------------------------------------------------

/** Locate a runnable `jiti`: local node_modules/.bin, else `npx jiti`. */
function resolveJiti(): { cmd: string; pre: string[] } {
  const local = join(REPO, 'node_modules', '.bin', 'jiti');
  if (existsSync(local)) return { cmd: local, pre: [] };
  return { cmd: 'npx', pre: ['--no-install', 'jiti'] };
}

/** The oracle-side precheck, which needs no worker: a cached `in.svg` that
 *  is not well-formed XML can never be compared against. */
function oracleErrorRow(type: string, f: FixtureDir, oracleSvg: string): FixtureRow | undefined {
  if (isWellFormedSvg(oracleSvg)) return undefined;
  return {
    slug: f.slug, type, verdict: 'oracle-error', dotEqual: false,
    errMsg: `cached in.svg not well-formed XML: ${oracleSvg.length}B`,
  };
}

/** Folds one worker outcome plus its oracle SVG into the output row. */
function rowFor(type: string, f: FixtureDir, oracleSvg: string, o: WorkerOutcome): FixtureRow {
  if (o.kind === 'timeout') return { slug: f.slug, type, verdict: 'timeout', dotEqual: false };
  if (o.kind === 'errored') {
    return { slug: f.slug, type, verdict: 'errored', dotEqual: false, errMsg: o.message };
  }
  const verdict = diffVerdict(o.rendered.svg, oracleSvg);
  const blindField = o.rendered.oracleBlind ? { oracleBlind: true } : {};
  return { slug: f.slug, type, dotEqual: o.rendered.dotEqual, ...verdict, ...blindField };
}

/** Surveys one type through the persistent pool, preserving input order. */
async function surveyType(
  type: string,
  fixtures: FixtureDir[],
  jiti: { cmd: string; pre: string[] },
): Promise<FixtureRow[]> {
  const svgs = fixtures.map((f) => readFileSync(join(f.dir, 'in.svg'), 'utf-8'));
  const pre = fixtures.map((f, i) => oracleErrorRow(type, f, svgs[i]!));
  const todo = fixtures.map((f, i) => ({ f, i })).filter(({ i }) => pre[i] === undefined);
  const outcomes = await runPersistentPool({
    dirs: todo.map(({ f }) => f.dir),
    spawn: () => spawn(jiti.cmd, [...jiti.pre, THIS_FILE, '--render-many'], {
      env: process.env, stdio: ['pipe', 'pipe', 'pipe'],
    }),
    timeoutMs: RENDER_TIMEOUT_MS,
    concurrency: CONCURRENCY,
    onProgress: (done, total) => {
      if (done % 25 === 0) process.stderr.write(`  ${done}/${total}\n`);
    },
  });
  const rows = [...pre] as (FixtureRow | undefined)[];
  todo.forEach(({ f, i }, k) => {
    rows[i] = rowFor(type, f, svgs[i]!, outcomes[k]!);
  });
  return rows as FixtureRow[];
}

function tally(rows: FixtureRow[]): Record<Verdict, number> {
  const counts: Record<Verdict, number> = {
    conformant: 0, 'structural-match': 0, diverged: 0, errored: 0, timeout: 0, 'oracle-error': 0,
  };
  for (const r of rows) counts[r.verdict]++;
  return counts;
}

/**
 * N0 (G2): `--out <path>` and bare positional type args, both additive and
 * both defaulting to the pre-existing behavior (`DEFAULT_TYPES` ->
 * `PARITY_OUT`) -- a plain `npm run svg:survey` invocation is byte-identical
 * to before this change. Lets a future class-scoped survey run write its
 * own `parity-class.json` (`--out tests/oracle/svg-conformance/parity-
 * class.json class`) without ever touching the shared component/usecase
 * `parity.json` this mission's write-set must not regenerate.
 */
function parseSurveyArgs(argv: string[]): { types: string[]; out: string } {
  const outIdx = argv.indexOf('--out');
  const out = outIdx !== -1 ? argv[outIdx + 1] : undefined;
  const positional = argv.filter((a, i) => a !== '--out' && i !== outIdx + 1 && !a.startsWith('--'));
  return { types: positional.length > 0 ? positional : DEFAULT_TYPES, out: out ?? PARITY_OUT };
}

async function main(): Promise<void> {
  const { types, out } = parseSurveyArgs(process.argv.slice(2));
  const jiti = resolveJiti();
  const rows: FixtureRow[] = [];
  for (const type of types) {
    const fixtures = listFixtureDirs(type);
    process.stderr.write(`surveying ${fixtures.length} ${type} fixtures (concurrency ${CONCURRENCY})\n`);
    rows.push(...(await surveyType(type, fixtures, jiti)));
  }
  const report: ParityReport = { generatedAt: new Date().toISOString(), fixtures: rows };
  writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  process.stderr.write(`wrote ${out} — ${JSON.stringify(tally(rows))}\n`);
}

// ---------------------------------------------------------------------------
// CLI dispatch
// ---------------------------------------------------------------------------

function runRenderOneCli(argv: string[]): void {
  const idx = argv.indexOf('--render-one');
  const dir = argv[idx + 1];
  if (dir === undefined) {
    process.stderr.write('usage: --render-one <dir>\n');
    process.exit(2);
  }
  try {
    renderOneMode(dir);
  } catch (e) {
    process.stderr.write(`__RENDER_ERROR__${errText(e)}\n`);
    process.exit(1);
  }
}

/* v8 ignore start -- CLI entry point; exercised via the real survey run, not
 * the unit-test suite (matches the profile of this project's other script
 * CLI blocks, e.g. tests/oracle/svg-conformance/compare.ts). */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (process.argv.includes('--render-many')) {
    renderManyMode();
  } else if (process.argv.includes('--render-one')) {
    runRenderOneCli(process.argv);
  } else {
    main().catch((e) => {
      process.stderr.write(`harness fault: ${errText(e)}\n`);
      process.exit(2);
    });
  }
}
/* v8 ignore stop */
