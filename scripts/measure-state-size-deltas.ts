/**
 * State-diagram size-delta measurement harness (mission G8/T1).
 *
 * Promotes G7 T20's throwaway 92-fixture delta probe to a committed,
 * reusable script. Measures TWO independent, pre-existing ratchets in one
 * pass so a future label-placement/box-sizing change (G8/T2) can be gated
 * on "zero widened" before it lands:
 *
 *   - BACKLOG fixtures (`oracle/goldens/state/size-backlog.json`, 92
 *     entries): DOT-level node-size drift, `maxSizeDeltaIn` (inches, max
 *     across a fixture's `svek-N.dot` graphs) — the SAME comparison
 *     `tests/oracle/state-dot-parity.test.ts` asserts, reused verbatim via
 *     `tests/oracle/svek-dot.js` (not reimplemented).
 *   - PIN fixtures (`oracle/goldens/svg-state/ratchet.json`, 57 entries):
 *     byte-exact full-SVG conformance, via `renderFixtureState` +
 *     `compareSvg` (the SAME mechanism `state.golden.ratchet.test.ts`
 *     asserts). `delta` here is the SVG diff count (0 = byte-exact).
 *
 * A slug MAY appear in both sets (4 currently do) — each measurement is
 * reported as its own JSON line, tagged by `kind`, never merged.
 *
 * Usage: `npx tsx scripts/measure-state-size-deltas.ts`
 * Output: one JSON line per measurement, then a summary line, then exits
 * 0 iff zero measurements are `widened` (2 otherwise) — a genuine gate, not
 * just a report.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../src/index.js';
import { setLayoutInputObserver } from '../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../src/core/measurer.js';
import type { DotInputGraph } from '../src/core/graph-layout.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
} from '../tests/oracle/svek-dot.js';
import { renderFixtureState } from '../tests/oracle/svg-conformance/render-fixture-state.js';
import { compareSvg } from '../tests/oracle/svg-conformance/compare.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_GOLDENS = join(REPO, 'oracle', 'goldens', 'state');
const SVG_STATE_GOLDENS = join(REPO, 'oracle', 'goldens', 'svg-state');

// ---------------------------------------------------------------------------
// Pure comparator arithmetic (unit-tested in isolation — see
// tests/unit/scripts/measure-state-size-deltas.test.ts).
// ---------------------------------------------------------------------------

/** Matches the ±1e-6 tolerance `state-dot-parity.test.ts` already asserts
 *  with (`toBeLessThanOrEqual(allowed + 1e-6)`) — a fixture within that
 *  epsilon of its pinned allowance is `unchanged`, not `widened`/`improved`
 *  noise from float rounding. */
export const DELTA_EPSILON = 1e-6;

export type DeltaStatus = 'widened' | 'improved' | 'unchanged';

/** Classifies a measured delta against its allowed (pinned) value. Pure,
 *  no I/O — the one piece of arithmetic this harness must never get wrong
 *  (a `widened` false-negative would silently let a regression land). */
export function classifyDelta(delta: number, allowed: number): DeltaStatus {
  if (delta > allowed + DELTA_EPSILON) return 'widened';
  if (delta < allowed - DELTA_EPSILON) return 'improved';
  return 'unchanged';
}

// ---------------------------------------------------------------------------
// Fixture measurement
// ---------------------------------------------------------------------------

export interface DeltaResult {
  slug: string;
  kind: 'backlog' | 'pin';
  delta: number;
  allowed: number;
  status: DeltaStatus;
  /** Present only when status !== 'unchanged' or the measurement itself
   *  failed structurally (e.g. a pin's captured-graph-count mismatch) —
   *  keeps the common-case JSON line short. */
  detail?: string;
}

function svekFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

/** Renders one backlog fixture's `input.puml` and captures every
 *  `layoutGraph()` input it produces, in pass order (mirrors
 *  `state-dot-parity.test.ts`'s `beforeAll`/`afterAll` observer pattern). */
function captureBacklogGraphs(dir: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(readFileSync(join(dir, 'input.puml'), 'utf8'), {
      measurer: new WidthTableMeasurer(),
    });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

/** Compares every captured pass against its `svek-N.dot` oracle; returns the
 *  max `maxSizeDeltaIn` across passes, or `undefined` + a reason string if
 *  any pass is no longer structurally EQUAL (a harder failure than a size
 *  drift — reported as an infinite/`widened` delta by the caller). */
function compareBacklogPasses(
  dir: string,
  files: readonly string[],
  captured: readonly DotInputGraph[],
): { maxDelta: number } | { failure: string } {
  let maxDelta = 0;
  for (let i = 0; i < files.length; i++) {
    const oracle = parseSvekDot(readFileSync(join(dir, files[i]!), 'utf8'));
    const candidate = dotInputToStructural(captured[i]!);
    const diff = compareStructural(oracle, candidate);
    if (!diff.structurallyEqual) return { failure: `${files[i]}: structurally unequal` };
    maxDelta = Math.max(maxDelta, diff.maxSizeDeltaIn);
  }
  return { maxDelta };
}

/** Builds the (always-`widened`) result for a structural/capture-count
 *  failure — kept separate so `measureBacklogFixture` reads as one
 *  straight-line sequence (capture -> compare -> classify). */
function backlogFailure(slug: string, allowed: number, detail: string): DeltaResult {
  return { slug, kind: 'backlog', delta: Number.POSITIVE_INFINITY, allowed, status: 'widened', detail };
}

/** DOT-level node-size delta for one `oracle/goldens/state/<slug>/` fixture
 *  — max `maxSizeDeltaIn` across its `svek-N.dot` graphs, mirroring
 *  `state-dot-parity.test.ts`'s own per-fixture loop. */
function measureBacklogFixture(slug: string, allowed: number): DeltaResult {
  const dir = join(STATE_GOLDENS, slug);
  const files = svekFiles(dir);
  const captured = captureBacklogGraphs(dir);
  if (captured.length !== files.length) {
    return backlogFailure(slug, allowed, `captured ${captured.length} layout graph(s), expected ${files.length}`);
  }

  const outcome = compareBacklogPasses(dir, files, captured);
  if ('failure' in outcome) return backlogFailure(slug, allowed, outcome.failure);

  const status = classifyDelta(outcome.maxDelta, allowed);
  return {
    slug,
    kind: 'backlog',
    delta: outcome.maxDelta,
    allowed,
    status,
    ...(status !== 'unchanged' ? { detail: `maxSizeDeltaIn=${outcome.maxDelta}` } : {}),
  };
}

/** Byte-exact SVG conformance delta for one `oracle/goldens/svg-state/<slug>/`
 *  pin — `delta` is the diff count (0 = byte-exact), mirroring
 *  `state.golden.ratchet.test.ts`'s AC1. Pins can only regress (`widened`)
 *  or hold (`unchanged`) — a byte-exact fixture cannot "improve" further. */
function measurePinFixture(slug: string): DeltaResult {
  const dir = join(SVG_STATE_GOLDENS, slug);
  const golden = readFileSync(join(dir, 'golden.svg'), 'utf8');
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const ours = renderFixtureState(markup, new WidthTableMeasurer());
  const { diffs } = compareSvg(ours, golden, 'deterministic');
  const delta = diffs.length;
  const status = classifyDelta(delta, 0);
  return {
    slug,
    kind: 'pin',
    delta,
    allowed: 0,
    status,
    ...(status !== 'unchanged' ? { detail: `first diff: ${diffs[0]?.path ?? '(none)'}` } : {}),
  };
}

// ---------------------------------------------------------------------------
// Fixture discovery
// ---------------------------------------------------------------------------

interface RatchetManifest {
  fixtures: { slug: string }[];
}

function loadBacklog(): Record<string, number> {
  const path = join(STATE_GOLDENS, 'size-backlog.json');
  if (!existsSync(path)) return {};
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === '_doc') continue;
    out[k] = v as number;
  }
  return out;
}

function loadPinSlugs(): string[] {
  const path = join(SVG_STATE_GOLDENS, 'ratchet.json');
  if (!existsSync(path)) return [];
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as RatchetManifest;
  return manifest.fixtures.map((f) => f.slug);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface Summary {
  total: number;
  widened: number;
  improved: number;
  unchanged: number;
}

export function summarize(results: readonly DeltaResult[]): Summary {
  const summary: Summary = { total: results.length, widened: 0, improved: 0, unchanged: 0 };
  for (const r of results) summary[r.status] += 1;
  return summary;
}

function runMeasurement(): DeltaResult[] {
  const backlog = loadBacklog();
  const pinSlugs = loadPinSlugs();

  const results: DeltaResult[] = [];
  for (const [slug, allowed] of Object.entries(backlog).sort(([a], [b]) => a.localeCompare(b))) {
    results.push(measureBacklogFixture(slug, allowed));
  }
  for (const slug of [...pinSlugs].sort()) {
    results.push(measurePinFixture(slug));
  }
  return results;
}

/* v8 ignore start -- CLI entry point; the pure comparator/summary functions
 * above are exercised directly by
 * tests/unit/scripts/measure-state-size-deltas.test.ts. */
function main(): void {
  const results = runMeasurement();
  for (const r of results) {
    process.stdout.write(`${JSON.stringify(r)}\n`);
  }
  const summary = summarize(results);
  process.stdout.write(`${JSON.stringify({ summary })}\n`);
  process.exitCode = summary.widened > 0 ? 2 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
