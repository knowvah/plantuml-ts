/**
 * Activity diff classifier (mission `activity-divergence-drive`, T0a / D7).
 *
 * Planning measured "which rows are position-only" with an uncommitted
 * scratch (`plans/activity-divergence-drive/tools/classify-scratch.mts`);
 * D7 wants that answer reproducible at every batch close, so this is the
 * scratch committed once with the repo's tool conventions.
 *
 * Renders every `status: "baseline"` fixture of
 * `oracle/goldens/svg-activity/diff-baseline.json` through the SAME seams
 * the ratchet gate and `activity-probe.ts` use -- `renderFixtureActivity`
 * with `DeterministicMeasurer` and `fixtureIncludeStore()`,
 * `compareSvg(ours, golden, 'deterministic')`, `weightedScore(diffs)` --
 * then sorts each diff into a family (`familyOf`) and, for positional
 * attributes, the shift the golden is ahead of ours by.
 *
 * A row is "position-only" when `nonPos === 0`: every diff outside the root
 * `svg/@width|height|viewBox` is a positional attribute, a missing
 * `textLength`, or a polygon `points` list (counted under the pseudo-family
 * `POLY`). A row whose `shifts.x`/`shifts.y` each hold at most one value is a
 * uniform translation of the jar's drawing.
 *
 * Tooling: not collected by `npm test` (outside `tests/**\/*.test.ts`) and
 * guarded so importing this module never runs the CLI.
 *
 * Usage:
 *   npx tsx scripts/activity-probe-classify.ts [--slugs a,b] [--json <out>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../tests/oracle/svg-conformance/compare.js';
import type { Diff } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureActivity } from '../tests/oracle/svg-conformance/render-fixture-activity.js';
import { familyOf } from './activity-probe.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache/activity');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');

/** Positional attributes; the axis is decided by `X_ATTR`. */
const POS_ATTR = /@(x|y|cx|cy|x1|x2|y1|y2)$/;
const X_ATTR = /^(x|cx|x1|x2)$/;
const ROOT_SIZE = /^svg\/@(width|height|viewBox)/;
const POLY_FAMILY = 'POLY';
/** Shifts are rounded to 1/1000 px so float noise does not split a value. */
const SHIFT_SCALE = 1000;

export interface Classification {
  families: Record<string, number>;
  nonPos: number;
  shifts: { x: number[]; y: number[] };
}

export interface ClassifiedRow extends Classification {
  slug: string;
  ws: number;
  n: number;
}

export interface ErrorRow {
  slug: string;
  error: string;
}

export interface ClassifySummary {
  rows: number;
  errors: number;
  positionOnly: number;
  uniformShift: number;
  /** Family -> number of fixtures with at least one diff in it. */
  familyFixtures: Record<string, number>;
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

/** Sorts one non-root diff: positional (records a shift), tolerated
 * (missing textLength, polygon points), or non-positional. Returns whether
 * it counts toward `nonPos`. */
function classifyOne(d: Diff, families: Record<string, number>, shifts: { x: Set<number>; y: Set<number> }): boolean {
  const m = POS_ATTR.exec(d.path);
  if (m && d.delta !== undefined) {
    const axis = X_ATTR.test(m[1] ?? '') ? shifts.x : shifts.y;
    const shift = Number(d.expected) - Number(d.actual);
    axis.add(Math.round(shift * SHIFT_SCALE) / SHIFT_SCALE);
    return false;
  }
  if (/@textLength$/.test(d.path) && d.actual === '') return false;
  if (/@points$/.test(d.path)) {
    bump(families, POLY_FAMILY);
    return false;
  }
  return true;
}

/** Pure: families, non-positional count and shift sets of one diff list. */
export function classifyDiffs(diffs: readonly Diff[]): Classification {
  const families: Record<string, number> = {};
  const shifts = { x: new Set<number>(), y: new Set<number>() };
  let nonPos = 0;
  for (const d of diffs) {
    bump(families, familyOf(d.path));
    if (ROOT_SIZE.test(d.path)) continue;
    if (classifyOne(d, families, shifts)) nonPos += 1;
  }
  return { families, nonPos, shifts: { x: [...shifts.x], y: [...shifts.y] } };
}

/** Pure given its inputs: compares our render against the golden. */
export function classifyPair(slug: string, ours: string, golden: string): ClassifiedRow {
  const { diffs } = compareSvg(ours, golden, 'deterministic');
  return { slug, ws: weightedScore(diffs), n: diffs.length, ...classifyDiffs(diffs) };
}

function isError(row: ClassifiedRow | ErrorRow): row is ErrorRow {
  return 'error' in row;
}

/** Pure: corpus-level counts over classified rows. */
export function summarize(rows: readonly (ClassifiedRow | ErrorRow)[]): ClassifySummary {
  const ok = rows.filter((r): r is ClassifiedRow => !isError(r));
  const familyFixtures: Record<string, number> = {};
  for (const r of ok) for (const f of Object.keys(r.families)) bump(familyFixtures, f);
  return {
    rows: rows.length,
    errors: rows.length - ok.length,
    positionOnly: ok.filter((r) => r.nonPos === 0).length,
    uniformShift: ok.filter((r) => r.shifts.x.length <= 1 && r.shifts.y.length <= 1).length,
    familyFixtures,
  };
}

/* v8 ignore start -- filesystem + render driver and CLI; the pure functions
 * above are exercised by tests/unit/scripts/activity-probe-classify.test.ts. */
function baselineSlugs(): string[] {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as {
    fixtures: { slug: string; status: string }[];
  };
  return manifest.fixtures.filter((f) => f.status === 'baseline').map((f) => f.slug);
}

function classifySlug(slug: string): ClassifiedRow | ErrorRow {
  const puml = readFileSync(join(CACHE_ROOT, slug, 'in.puml'), 'utf8');
  const golden = readFileSync(join(CACHE_ROOT, slug, 'in.svg'), 'utf8');
  try {
    return classifyPair(
      slug,
      renderFixtureActivity(puml, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() }),
      golden,
    );
  } catch (e) {
    return { slug, error: String(e).slice(0, 200) };
  }
}

function argValue(argv: readonly string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i < 0 ? undefined : argv[i + 1];
}

function main(): void {
  const argv = process.argv.slice(2);
  const only = argValue(argv, '--slugs');
  const out = argValue(argv, '--json');
  const slugs = only === undefined ? baselineSlugs() : only.split(',').filter((s) => s !== '');
  const rows = slugs.map(classifySlug);
  const summary = summarize(rows);
  console.log(JSON.stringify({ ...summary, familyFixtures: undefined }));
  if (out !== undefined) {
    writeFileSync(out, JSON.stringify({ summary, rows }, null, 1) + '\n');
    console.log(`wrote ${out}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
