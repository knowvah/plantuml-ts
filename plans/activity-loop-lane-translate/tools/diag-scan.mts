/**
 * Diagonal-segment scan (mission activity-while-repeat-left-alignment).
 * Renders every baseline activity fixture through the same seam the probe
 * uses and counts `<line>` elements whose dx and dy are both non-zero.
 * Edges render as ONE `<line>` PER SEGMENT (`renderer.ts:107-108`), so an
 * edge segment with both dx and dy non-zero is exactly a diagonal line.
 * Usage: npx tsx diag-scan.ts [--json out] [--slugs a,b]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DeterministicMeasurer } from '/Users/scottseely/git/knowvah/plantuml-ts/src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/helpers/fixture-include-store.js';
import { renderFixtureActivity } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/oracle/svg-conformance/render-fixture-activity.js';

const REPO = '/Users/scottseely/git/knowvah/plantuml-ts';
const CACHE_ROOT = join(REPO, 'test-results/dot-cache/activity');
const MANIFEST = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');

const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : undefined;
const only = args.includes('--slugs') ? new Set(args[args.indexOf('--slugs') + 1]!.split(',')) : undefined;

interface Fx { slug: string; status: string }
const fixtures = (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { fixtures: Fx[] }).fixtures
  .filter((f) => f.status === 'baseline')
  .filter((f) => only === undefined || only.has(f.slug));

const LINE_RE = /<line\b([^>]*)>/g;
function attr(s: string, name: string): number {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(s);
  return m ? Number(m[1]) : NaN;
}

const result: Record<string, { count: number; segments: string[] }> = {};
let fixturesWithDiag = 0;
let totalDiag = 0;
for (const f of fixtures) {
  const markup = readFileSync(join(CACHE_ROOT, f.slug, 'in.puml'), 'utf8');
  const svg = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  // A `kill`/`end` marker is an X: two 45-degree lines sharing one bounding
  // box with swapped y's. Pair them by box and drop both -- they are glyphs,
  // not edge segments.
  const raw: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  for (const m of svg.matchAll(LINE_RE)) {
    const a = m[1]!;
    const x1 = attr(a, 'x1'), y1 = attr(a, 'y1'), x2 = attr(a, 'x2'), y2 = attr(a, 'y2');
    if (Math.abs(x1 - x2) > 0.01 && Math.abs(y1 - y2) > 0.01) {
      const key = `${Math.min(x1, x2)},${Math.max(x1, x2)},${Math.min(y1, y2)},${Math.max(y1, y2)}`;
      raw.push({ x1, y1, x2, y2, key });
    }
  }
  const boxCount = new Map<string, number>();
  for (const r of raw) boxCount.set(r.key, (boxCount.get(r.key) ?? 0) + 1);
  const segs = raw.filter((r) => boxCount.get(r.key) !== 2).map((r) => `(${r.x1},${r.y1})->(${r.x2},${r.y2})`);
  if (segs.length > 0) {
    fixturesWithDiag++;
    totalDiag += segs.length;
    result[f.slug] = { count: segs.length, segments: segs };
    console.log(`${f.slug}\t${segs.length}\t${segs.join(' ')}`);
  }
}
console.log(`fixtures scanned: ${fixtures.length}; with diagonal: ${fixturesWithDiag}; segments: ${totalDiag}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(result, null, 2));
