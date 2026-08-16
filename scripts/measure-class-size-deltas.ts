/**
 * Class-diagram size-conformance measurement harness (mission A2 conformant
 * flip). Mirrors `measure-description-size-deltas.ts`, over the RATCHET subset
 * of `oracle/goldens/class/<slug>/` (fixtures WITHOUT an `input.svg` — the
 * pinned-EQUAL set `class-dot-parity.test.ts` asserts; the 6 hand-authored
 * `input.svg` harness-health goldens are not faithful and are excluded).
 *
 * Class nodes are `rect` with an emptied HTML label and explicit width/height
 * in the svek DOT, so node-size conformance IS measurable (≤0.01in bar). The
 * non-conformant remainder is pinned shrink-only in
 * `oracle/goldens/class/size-backlog.json`; absent slug ⇒ conformant required.
 *
 * Usage: `npx tsx scripts/measure-class-size-deltas.ts`
 * Output: one JSON line per fixture, then a summary (with % + cause buckets),
 * then exits 0 iff zero fixtures are `widened` (2 otherwise) — a genuine gate.
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
  SIZE_CONFORMANCE_TOLERANCE_IN,
} from '../tests/oracle/svek-dot.js';
import {
  expectedBacklogFailures,
  loadStructuralBacklogs,
  unexcusedFailures,
} from '../tests/oracle/dot-parity-backlog-data.js';
import {
  classifyDelta,
  detectCause,
  summarize,
  DELTA_EPSILON,
  type DeltaResult,
} from './measure-description-size-deltas.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDENS = join(REPO, 'oracle', 'goldens', 'class');

function svekFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

/** Renders one golden's `input.puml`, capturing every `layoutGraph()` input.
 *  No `includeStore` — matches `class-dot-parity.test.ts`'s RATCHET suite
 *  (a few stdlib-`!include` fixtures capture zero graphs, a legitimate
 *  zero-vs-zero EQUAL). */
function captureGraphs(markup: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(markup, { measurer: new WidthTableMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

/** Max `maxSizeDeltaIn` across a fixture's passes, or a failure reason if any
 *  pass is no longer structurally EQUAL. */
function comparePasses(
  dir: string,
  files: readonly string[],
  captured: readonly DotInputGraph[],
  excused: readonly string[],
): { maxDelta: number } | { failure: string } {
  let maxDelta = 0;
  for (let i = 0; i < files.length; i++) {
    const oracle = parseSvekDot(readFileSync(join(dir, files[i]!), 'utf8'));
    const candidate = dotInputToStructural(captured[i]!);
    const diff = compareStructural(oracle, candidate);
    // Same contract as the parity ratchets (`dot-parity-backlogs.ts`): a
    // graph may fail ONLY the checks its backlogs name (label-size /
    // direction) and is then still measurable for size; anything else is a
    // structural regression, harder than a size drift.
    const failing = unexcusedFailures(diff, excused);
    if (failing.length > 0) return { failure: `${files[i]}: structurally unequal (${failing.join(', ')})` };
    maxDelta = Math.max(maxDelta, diff.maxSizeDeltaIn);
  }
  return { maxDelta };
}

function measureFixture(slug: string, allowed: number, inBacklog: boolean, excused: readonly string[]): DeltaResult {
  const dir = join(GOLDENS, slug);
  const markup = readFileSync(join(dir, 'input.puml'), 'utf8');
  const files = svekFiles(dir);
  const captured = captureGraphs(markup);
  if (captured.length !== files.length) {
    return {
      slug, delta: Number.POSITIVE_INFINITY, allowed, status: 'widened',
      conformant: false, cause: detectCause(markup),
      detail: `captured ${captured.length} layout graph(s), expected ${files.length}`,
    };
  }
  const outcome = comparePasses(dir, files, captured, excused);
  if ('failure' in outcome) {
    return {
      slug, delta: Number.POSITIVE_INFINITY, allowed, status: 'widened',
      conformant: false, cause: detectCause(markup), detail: outcome.failure,
    };
  }
  const delta = outcome.maxDelta;
  const conformant = delta <= SIZE_CONFORMANCE_TOLERANCE_IN + DELTA_EPSILON;
  const status = classifyDelta(delta, allowed, inBacklog);
  return {
    slug, delta, allowed, status, conformant,
    ...(conformant ? {} : { cause: detectCause(markup) }),
    ...(status !== 'unchanged' ? { detail: `maxSizeDeltaIn=${delta}` } : {}),
  };
}

function loadBacklog(): Record<string, number> {
  const path = join(GOLDENS, 'size-backlog.json');
  if (!existsSync(path)) return {};
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === '_doc') continue;
    out[k] = v as number;
  }
  return out;
}

/** RATCHET subset: golden dirs with an `input.puml` but no `input.svg`. */
function ratchetSlugs(): string[] {
  if (!existsSync(GOLDENS)) return [];
  return readdirSync(GOLDENS, { withFileTypes: true })
    .filter((d) => d.isDirectory()
      && existsSync(join(GOLDENS, d.name, 'input.puml'))
      && !existsSync(join(GOLDENS, d.name, 'input.svg')))
    .map((d) => d.name)
    .sort();
}

function runMeasurement(): DeltaResult[] {
  const backlog = loadBacklog();
  const structural = loadStructuralBacklogs(GOLDENS);
  const results: DeltaResult[] = [];
  for (const slug of ratchetSlugs()) {
    const inBacklog = Object.prototype.hasOwnProperty.call(backlog, slug);
    const allowed = inBacklog ? backlog[slug]! : SIZE_CONFORMANCE_TOLERANCE_IN;
    results.push(measureFixture(slug, allowed, inBacklog, expectedBacklogFailures(slug, structural)));
  }
  return results;
}

/* v8 ignore start -- CLI entry point; the reused pure functions are covered by
 * tests/unit/scripts/measure-description-size-deltas.test.ts. */
function main(): void {
  const results = runMeasurement();
  for (const r of results) process.stdout.write(`${JSON.stringify(r)}\n`);
  process.stdout.write(`${JSON.stringify({ summary: summarize(results) })}\n`);
  process.exitCode = summarize(results).widened > 0 ? 2 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
