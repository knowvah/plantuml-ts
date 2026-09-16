/**
 * Activity diagonal-segment scan (mission `activity-loop-tile-port`, T0).
 *
 * Built in `activity-while-repeat-left-alignment` as a session scratch tool
 * and never committed (the `activity-if-tile-port` copy before it was lost
 * the same way); committed here so the exit bar "diagonal scan stays 0"
 * survives compaction and future missions.
 *
 * Renders every `status: "baseline"` fixture of
 * `oracle/goldens/svg-activity/diff-baseline.json` through the SAME seam
 * the probe uses (`renderFixtureActivity` with `DeterministicMeasurer` and
 * `fixtureIncludeStore()`) and counts `<line>` elements whose dx and dy are
 * both non-zero. Edges render as ONE `<line>` PER SEGMENT
 * (`src/diagrams/activity/renderer.ts`), so an edge segment with both dx
 * and dy non-zero is exactly a diagonal line.
 *
 * Calibration (`.agent-notes/awrl-T3.md`): at a 1e-6 tolerance the corpus
 * at `6f1c04f7` showed 20 fixtures, not the brief's 19 -- `firibi-00-
 * puki721` has a 0.001 px dx from rounding -- and the `kill`/`end` cross is
 * two 45-degree `<line>`s sharing one bounding box. At 0.01 px with the
 * cross pair filter the set equals the brief's 19 exactly.
 *
 * Tooling: not collected by `npm test` (outside `tests/**\/*.test.ts`) and
 * guarded so importing this module never runs the CLI.
 *
 * Usage:
 *   npx tsx scripts/activity-diag-scan.ts [--json <out>] [--slugs a,b]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { renderFixtureActivity } from '../tests/oracle/svg-conformance/render-fixture-activity.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache/activity');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');

/** Below this, a dx or dy is rounding noise, not a slope (awrl-T3 calibration). */
export const DIAGONAL_TOLERANCE_PX = 0.01;

// ---------------------------------------------------------------------------
// Pure functions -- unit-tested in tests/unit/scripts/activity-diag-scan.test.ts.
// ---------------------------------------------------------------------------

const LINE_RE = /<line\b([^>]*)>/g;

function attr(attrs: string, name: string): number {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(attrs);
  return m ? Number(m[1]) : NaN;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Bounding-box key: two lines sharing it are the two arms of one cross. */
  box: string;
}

function slopedLines(svg: string): Segment[] {
  const out: Segment[] = [];
  for (const m of svg.matchAll(LINE_RE)) {
    const a = m[1]!;
    const x1 = attr(a, 'x1');
    const y1 = attr(a, 'y1');
    const x2 = attr(a, 'x2');
    const y2 = attr(a, 'y2');
    if (Math.abs(x1 - x2) > DIAGONAL_TOLERANCE_PX && Math.abs(y1 - y2) > DIAGONAL_TOLERANCE_PX) {
      const box = `${Math.min(x1, x2)},${Math.max(x1, x2)},${Math.min(y1, y2)},${Math.max(y1, y2)}`;
      out.push({ x1, y1, x2, y2, box });
    }
  }
  return out;
}

/**
 * Every `<line>` of `svg` whose dx and dy both exceed
 * {@link DIAGONAL_TOLERANCE_PX}, formatted `(x1,y1)->(x2,y2)` in document
 * order, EXCEPT the arms of a `kill`/`end` cross: two 45-degree lines that
 * share one bounding box (`FtileCircleStop`'s X glyph) are glyph strokes,
 * not edge segments, and are paired out. Three or more lines in one box are
 * kept -- only an exact pair is a cross.
 */
export function diagonalSegments(svg: string): string[] {
  const raw = slopedLines(svg);
  const perBox = new Map<string, number>();
  for (const s of raw) perBox.set(s.box, (perBox.get(s.box) ?? 0) + 1);
  return raw.filter((s) => perBox.get(s.box) !== 2).map((s) => `(${s.x1},${s.y1})->(${s.x2},${s.y2})`);
}

// ---------------------------------------------------------------------------
// I/O and CLI.
// ---------------------------------------------------------------------------

interface BaselineFixture {
  readonly slug: string;
  readonly status: string;
}

/* v8 ignore start -- CLI entry point; `diagonalSegments` is exercised by
 * tests/unit/scripts/activity-diag-scan.test.ts. */
function loadBaselineSlugs(only: ReadonlySet<string> | undefined): string[] {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as { fixtures: BaselineFixture[] };
  return manifest.fixtures
    .filter((f) => f.status === 'baseline')
    .map((f) => f.slug)
    .filter((slug) => only === undefined || only.has(slug));
}

function renderSlug(slug: string): string {
  const markup = readFileSync(join(CACHE_ROOT, slug, 'in.puml'), 'utf8');
  return renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

function argAfter(argv: readonly string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
}

function main(): void {
  const argv = process.argv.slice(2);
  const jsonOut = argAfter(argv, '--json');
  const slugsArg = argAfter(argv, '--slugs');
  const only = slugsArg === undefined ? undefined : new Set(slugsArg.split(','));
  const slugs = loadBaselineSlugs(only);

  const result: Record<string, { count: number; segments: string[] }> = {};
  let totalSegments = 0;
  for (const slug of slugs) {
    const segments = diagonalSegments(renderSlug(slug));
    if (segments.length === 0) continue;
    totalSegments += segments.length;
    result[slug] = { count: segments.length, segments };
    console.log(`${slug}\t${segments.length}\t${segments.join(' ')}`);
  }
  const withDiagonal = Object.keys(result).length;
  console.log(`fixtures scanned: ${slugs.length}; with diagonal: ${withDiagonal}; segments: ${totalSegments}`);
  if (jsonOut !== undefined) writeFileSync(jsonOut, JSON.stringify(result, null, 2) + '\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
