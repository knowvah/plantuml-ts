/**
 * Activity element census (mission `activity-divergence-drive-2`, T0a).
 *
 * Per `status: "baseline"` fixture of
 * `oracle/goldens/svg-activity/diff-baseline.json`, counts the drawn
 * elements of each census tag on both sides and reports `ours - jar` per tag.
 * The planning-time census (`plans/activity-divergence-drive-2/measurements/
 * plan-elements.json`) is what named the connector-merge mechanism (99 rows
 * drawing an extra line + arrowhead where the jar fuses touching snakes,
 * `activitydiagram3/ftile/Snake.java:303-327`); this tool makes that census
 * reproducible at every batch close (D7/D10).
 *
 * Renders through the SAME seams as the ratchet gate and `activity-probe.ts`
 * -- `renderFixtureActivity` with `DeterministicMeasurer` and
 * `fixtureIncludeStore()`, `compareSvg(ours, golden, 'deterministic')`,
 * `weightedScore(diffs)` -- never re-deriving the comparator.
 *
 * Tooling: not collected by `npm test` and guarded so importing this module
 * never runs the CLI (see the `import.meta.url` check at the bottom).
 *
 * Usage:
 *   npx tsx scripts/activity-probe-elements.ts [--slugs a,b] [--json <out>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureActivity } from '../tests/oracle/svg-conformance/render-fixture-activity.js';
import { normalizeSvg } from '../tests/oracle/svg-conformance/normalize.js';
import { extractSlugs, flattenElements } from './activity-probe.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const FIXTURE_ROOT = join(REPO, 'test-results/dot-cache/activity');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');

// ---------------------------------------------------------------------------
// Pure functions -- unit-tested on inline SVG pairs.
// ---------------------------------------------------------------------------

/** The tags the census counts (T0a spec). */
export const CENSUS_TAGS: readonly string[] = ['rect', 'polygon', 'line', 'path', 'ellipse', 'text'];

export type ShapeClass =
  'extra line+arrow' | 'extra arrow only' | 'extra line only' | 'missing line+arrow' | 'text-only' | 'mixed' | 'exact';

export interface ElementRow {
  readonly slug: string;
  readonly ws: number;
  readonly delta: Readonly<Record<string, number>>;
}

export interface ElementSummary {
  readonly rows: number;
  readonly ws: number;
  readonly classes: Record<ShapeClass, { count: number; ws: number }>;
}

/** Element count per census tag in one SVG (document order irrelevant). */
export function tagCounts(svg: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tag of CENSUS_TAGS) out[tag] = 0;
  for (const n of flattenElements(normalizeSvg(svg))) {
    if (n.tag !== undefined && n.tag in out) out[n.tag] = out[n.tag]! + 1;
  }
  return out;
}

/** `ours - jar` per census tag, zero entries omitted (so `{}` = exact). */
export function elementDelta(oursSvg: string, jarSvg: string): Record<string, number> {
  const ours = tagCounts(oursSvg);
  const jar = tagCounts(jarSvg);
  const out: Record<string, number> = {};
  for (const tag of CENSUS_TAGS) {
    const d = ours[tag]! - jar[tag]!;
    if (d !== 0) out[tag] = d;
  }
  return out;
}

/** Connector classes keyed by `sign(line delta),sign(polygon delta)` -- a
 * lookup table instead of a branching chain (complexity cap). */
const CONNECTOR_CLASSES: Readonly<Record<string, ShapeClass>> = {
  '1,1': 'extra line+arrow',
  '0,1': 'extra arrow only',
  '1,0': 'extra line only',
  '-1,-1': 'missing line+arrow',
};

/** Shape class of a delta. Line/arrowhead (`<polygon>`) signs decide first --
 * a connector the jar fuses shows as +line +polygon whatever else moved --
 * then a pure-text delta, then everything else is `mixed`. This ordering is
 * the one that reproduces `plan-elements.json`'s planning census
 * (99 / 22 / 12 / 5 / 19 text+mixed / 88). */
export function shapeClassOf(delta: Readonly<Record<string, number>>): ShapeClass {
  const keys = Object.keys(delta);
  if (keys.length === 0) return 'exact';
  const bySign = CONNECTOR_CLASSES[`${Math.sign(delta['line'] ?? 0)},${Math.sign(delta['polygon'] ?? 0)}`];
  if (bySign !== undefined) return bySign;
  return keys.length === 1 && keys[0] === 'text' ? 'text-only' : 'mixed';
}

const SHAPE_CLASSES: readonly ShapeClass[] = [
  'extra line+arrow',
  'extra arrow only',
  'extra line only',
  'missing line+arrow',
  'text-only',
  'mixed',
  'exact',
];

/** Count + summed `ws` per shape class, over every row. */
export function summarize(rows: readonly ElementRow[]): ElementSummary {
  const classes = Object.fromEntries(SHAPE_CLASSES.map((c) => [c, { count: 0, ws: 0 }])) as ElementSummary['classes'];
  let ws = 0;
  for (const r of rows) {
    const c = classes[shapeClassOf(r.delta)];
    c.count += 1;
    c.ws += r.ws;
    ws += r.ws;
  }
  return { rows: rows.length, ws, classes };
}

// ---------------------------------------------------------------------------
// I/O -- fixture loading and rendering.
// ---------------------------------------------------------------------------

/* v8 ignore start -- fixture I/O + CLI; the pure functions above are
 * exercised by tests/unit/scripts/activity-probe-elements.test.ts. */
interface BaselineManifest {
  readonly fixtures: readonly { readonly slug: string; readonly status: string }[];
}

function baselineSlugs(): string[] {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;
  return manifest.fixtures.filter((f) => f.status === 'baseline').map((f) => f.slug);
}

function measureRow(slug: string): ElementRow {
  const dir = join(FIXTURE_ROOT, slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
  const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  const ws = weightedScore(compareSvg(ours, golden, 'deterministic').diffs);
  return { slug, ws, delta: elementDelta(ours, golden) };
}

function parseArgs(argv: readonly string[]): { slugs: string[] | undefined; jsonOut: string | undefined } {
  let slugs: string[] | undefined;
  let jsonOut: string | undefined;
  for (let i = 0; i < argv.length - 1; i += 1) {
    if (argv[i] === '--slugs') slugs = extractSlugs(argv[i + 1]!);
    if (argv[i] === '--json') jsonOut = argv[i + 1];
  }
  return { slugs, jsonOut };
}

function main(): void {
  const { slugs, jsonOut } = parseArgs(process.argv.slice(2));
  const wanted = slugs === undefined ? undefined : new Set(slugs);
  const rows = baselineSlugs()
    .filter((s) => wanted === undefined || wanted.has(s))
    .map(measureRow);
  const summary = summarize(rows);
  console.log(`rows=${summary.rows} ws=${summary.ws}`);
  for (const [name, c] of Object.entries(summary.classes)) console.log(`  ${name}: ${c.count} (ws ${c.ws})`);
  if (jsonOut !== undefined) {
    writeFileSync(jsonOut, JSON.stringify({ summary, rows }, null, 2) + '\n');
    console.log(`wrote ${jsonOut}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
