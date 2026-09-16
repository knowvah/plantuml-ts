/**
 * Activity oracle probe (mission `activity-lane-capture`, T0a / D4).
 *
 * Two prior missions (`activity-parallel-connectors`, `activity-klimt-
 * compress`) measured with a scratch `probe.ts` that was never committed;
 * both copies are gone. This is that tool, committed once so measurement
 * survives compaction and future missions (D4,
 * `plans/activity-lane-capture/decisions.md`).
 *
 * Renders every `status: "baseline"` fixture of
 * `oracle/goldens/svg-activity/diff-baseline.json` through the SAME seams
 * the ratchet gate uses -- `renderFixtureActivity` with `DeterministicMeasurer`
 * and `fixtureIncludeStore()`, `compareSvg(ours, golden, 'deterministic')`,
 * `weightedScore(diffs)` -- never re-deriving the comparator. Lane
 * quantities reuse `swimlane-census.ts#censusOf`/`lanesFromDividers`, the
 * same module the swimlane gate and its re-pin sibling share.
 *
 * Tooling: not collected by `npm test` (outside `tests/**\/*.test.ts`,
 * `vitest.config.ts`'s `include`) and guarded so importing this module never
 * runs the CLI -- see the `import.meta.url` check at the bottom.
 *
 * Usage:
 *   npx tsx scripts/activity-probe.ts [--slugs a,b | --slugs-file <path>]
 *     [--json <out>] [--dump <slug>] [--lanes <slug>] [--align <slug>]
 *
 * --slugs-file extracts every match of `/[a-z]+-\d{2}-[a-z]+\d{3}/g` from the
 * file, so `plans/activity-lane-capture/fixtures.md` works as-is.
 *
 * --align <slug> (mission `activity-if-tile-port`, T1/Q6) prints per-tag
 * `polygon`/`line`/`text`/`rect` counts (ours vs jar) and the (tag, lane)
 * positional alignment `n/N` -- delegated to the sibling
 * `activity-probe-align.ts` (kept out of this file to stay under its
 * 500-line cap; see that module's doc comment).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../tests/oracle/svg-conformance/compare.js';
import type { Diff } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureActivity } from '../tests/oracle/svg-conformance/render-fixture-activity.js';
import { normalizeSvg } from '../tests/oracle/svg-conformance/normalize.js';
import type { NormalizedNode } from '../tests/oracle/svg-conformance/normalize.js';
import { censusOf } from '../tests/oracle/svg-conformance/swimlane-census.js';
import type { LaneExtent } from '../tests/oracle/svg-conformance/swimlane-census.js';
import { alignReport } from './activity-probe-align.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const CACHE_ROOT = join(REPO, 'test-results/dot-cache');
const MANIFEST_PATH = join(REPO, 'oracle/goldens/svg-activity/diff-baseline.json');
const ACTIVITY_TYPE = 'activity';

// ---------------------------------------------------------------------------
// Pure functions -- the interface contract T1-T8 consume, unit-tested
// without a filesystem or a render.
// ---------------------------------------------------------------------------

export interface ProbeReport {
  commit: string;
  aggregate: number;
  subsetSum: number | null;
  fixtures: { slug: string; score: number; pinned: number; delta: number }[];
  families: Record<string, number>;
}

/** Replaces every positional index with `[]` so `svg/g[2]/rect[3]/@x` and
 * `svg/g[1]/rect[7]/@x` count as one family -- mirrors `diff-census.json`'s
 * own path normalisation (`oracle/goldens/svg-activity/diff-census.json`'s
 * `$comment`). Pure string transform, no tree-walk needed. */
export function familyOf(diffPath: string): string {
  return diffPath.replace(/\[\d+\]/g, '[]');
}

/** Total weight per family across a diff list, keyed by `familyOf(path)`. */
export function familyWeights(diffs: readonly Diff[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of diffs) {
    const fam = familyOf(d.path);
    out[fam] = (out[fam] ?? 0) + (d.weight ?? 1);
  }
  return out;
}

/** Slugs whose live score rose or fell against the pinned `weightedScore`.
 * Iterates `pins`' own key order so the result is deterministic; a slug
 * present in only one side is skipped rather than treated as a 0-baseline
 * move. */
export function risersAndFallers(
  pins: Record<string, number>,
  measured: Record<string, number>,
): { risers: string[]; fallers: string[] } {
  const risers: string[] = [];
  const fallers: string[] = [];
  for (const slug of Object.keys(pins)) {
    const pinned = pins[slug];
    const live = measured[slug];
    if (pinned === undefined || live === undefined) continue;
    if (live > pinned) risers.push(slug);
    else if (live < pinned) fallers.push(slug);
  }
  return { risers, fallers };
}

/** The lane a coordinate falls in, over ascending `{x, width}` extents
 * (`swimlane-census.ts#lanesFromDividers`'s own shape). `null` when `x` is
 * outside every lane (before the first divider or past the last). */
export function laneIndexOf(x: number, lanes: readonly LaneExtent[]): number | null {
  for (let i = 0; i < lanes.length; i += 1) {
    const lane = lanes[i]!;
    if (x >= lane.x && x < lane.x + lane.width) return i;
  }
  return null;
}

/** Every match of `/[a-z]+-\d{2}-[a-z]+\d{3}/g`, de-duplicated, order kept --
 * so `--slugs-file plans/activity-lane-capture/fixtures.md` works as-is. */
export function extractSlugs(text: string): string[] {
  return [...new Set(text.match(/[a-z]+-\d{2}-[a-z]+\d{3}/g) ?? [])];
}

function numOrUndef(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Centroid `x` of a `points="x,y x,y ..."` attribute (rounds `d`/`points`
 * are already 6-figure normalised numbers; every even-indexed token is an
 * `x`). `undefined` when there is nothing to average. */
function centroidXOfPoints(points: string | undefined): number | undefined {
  const nums = points?.match(/-?\d+\.?\d*/g)?.map(Number);
  if (nums === undefined || nums.length < 2) return undefined;
  const xs = nums.filter((_, i) => i % 2 === 0);
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function centerXOfRect(a: Record<string, string>): number | undefined {
  const x = numOrUndef(a['x']);
  const w = numOrUndef(a['width']);
  return x !== undefined && w !== undefined ? x + w / 2 : x;
}

function centerXOfLine(a: Record<string, string>): number | undefined {
  const x1 = numOrUndef(a['x1']);
  const x2 = numOrUndef(a['x2']);
  return x1 !== undefined && x2 !== undefined ? (x1 + x2) / 2 : undefined;
}

/** Per-tag centre-x readers, keyed by the normalized tag name -- a lookup
 * table instead of a branching dispatch, so adding a shape never raises this
 * function's own cyclomatic complexity. */
const CENTER_X_READERS: Record<string, (a: Record<string, string>) => number | undefined> = {
  rect: centerXOfRect,
  text: (a) => numOrUndef(a['x']),
  ellipse: (a) => numOrUndef(a['cx']),
  line: centerXOfLine,
  polygon: (a) => centroidXOfPoints(a['points']),
};

/** The horizontal centre of one normalized element, by tag -- what a
 * compound shape's lane is read from. `undefined` for tags this probe does
 * not position (e.g. bare `<g>`). */
export function centerXOf(n: NormalizedNode): number | undefined {
  const reader = n.tag === undefined ? undefined : CENTER_X_READERS[n.tag];
  return reader?.(n.attrs ?? {});
}

/** One of the four compound-shape families the README's mechanism section
 * names. `if/while diamond or hexagon` and `repeat condition` render through
 * the identical `renderHexagon`/`renderDiamond` `<polygon>` shape on both
 * sides (`activity-renderer-shapes.ts`'s `renderNode` dispatch) and are
 * therefore visually indistinguishable from the SVG alone -- this probe
 * reports them as one combined `diamond/hexagon` category rather than
 * guessing a semantic split neither side's markup carries. */
export type CompoundCategory = 'fork/join bar' | 'split/join line' | 'diamond/hexagon';

/** Detects a compound shape from tag + the SAME literal constants both
 * renderers use, verified against the jar golden (`activity-renderer-
 * bars.ts`'s `FORK_BAR_CORNER_RADIUS`/`SPLIT_LINE_THICKNESS` doc comments
 * cite `FtileBlackBlock.java:101-102` / `FtileThinSplit.java:61,95`).
 *
 * Two exclusions, both found by running `--lanes` against a fixture with
 * NO if/while/split/repeat (`bixefi-77-moki051`, pure fork) and seeing
 * false-positive rows:
 *   - A `stroke-width="1.5"` line is a split/join line only when it is
 *     HORIZONTAL (`y1 === y2`, `FtileThinSplit.java:87-96`'s `ULine.hline`):
 *     a swimlane divider is a VERTICAL line at the SAME 1.5 thickness
 *     (`LaneDivider.java:97`), so thickness alone collides with it.
 *   - A `<polygon>` is a diamond/hexagon only when its fill differs from
 *     its stroke: `renderDiamond`/`renderHexagon` fill with `diamondFill`
 *     (the node background, `#F1F1F1` by default) and stroke with
 *     `diamondBorder`, while an arrowhead polygon fills AND strokes with
 *     the same ink colour (`#181818` in the verified golden) -- confirmed
 *     against both `bixefi-77-moki051` (arrowheads only) and
 *     `bideta-97-cezo697` (both kinds present) golden SVGs. */
function isForkJoinBar(tag: string | undefined, a: Record<string, string>): boolean {
  return tag === 'rect' && a['rx'] === '2.5';
}

function isSplitJoinLine(tag: string | undefined, a: Record<string, string>): boolean {
  return tag === 'line' && a['stroke-width'] === '1.5' && a['y1'] === a['y2'];
}

function isDiamondOrHexagon(tag: string | undefined, a: Record<string, string>): boolean {
  return tag === 'polygon' && a['fill'] !== undefined && a['fill'] !== a['stroke'];
}

export function categoryOf(n: NormalizedNode): CompoundCategory | undefined {
  const a = n.attrs ?? {};
  if (isForkJoinBar(n.tag, a)) return 'fork/join bar';
  if (isSplitJoinLine(n.tag, a)) return 'split/join line';
  if (isDiamondOrHexagon(n.tag, a)) return 'diamond/hexagon';
  return undefined;
}

/** Depth-first element list in document order -- the same walk
 * `swimlane-census.ts#flatten` performs, duplicated here (it is not
 * exported) rather than widening that module's exports for a generic tree
 * utility outside this task's write-set. */
export function flattenElements(root: NormalizedNode): NormalizedNode[] {
  const out: NormalizedNode[] = [];
  const walk = (n: NormalizedNode): void => {
    if (n.type === 'element') out.push(n);
    for (const child of n.children ?? []) walk(child);
  };
  walk(root);
  return out;
}

// ---------------------------------------------------------------------------
// I/O -- fixture loading, rendering, measurement.
// ---------------------------------------------------------------------------

interface BaselineFixture {
  readonly slug: string;
  readonly status: string;
  readonly weightedScore?: number;
}
interface BaselineManifest {
  readonly fixtures: readonly BaselineFixture[];
}

function loadBaselineFixtures(): BaselineFixture[] {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as BaselineManifest;
  return manifest.fixtures.filter((f) => f.status === 'baseline');
}

function fixtureDir(slug: string): string {
  return join(CACHE_ROOT, ACTIVITY_TYPE, slug);
}

function readFixture(slug: string): { markup: string; golden: string } {
  const dir = fixtureDir(slug);
  return {
    markup: readFileSync(join(dir, 'in.puml'), 'utf8'),
    golden: readFileSync(join(dir, 'in.svg'), 'utf8'),
  };
}

function renderOurs(markup: string): string {
  return renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
}

function measureFixture(slug: string): { score: number; diffs: readonly Diff[] } {
  const { markup, golden } = readFixture(slug);
  const { diffs } = compareSvg(renderOurs(markup), golden, 'deterministic');
  return { score: weightedScore(diffs), diffs };
}

function getCommit(): string {
  return execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
}

/** Renders + scores every baseline fixture once, building the full report
 * plus the risers/fallers CLI prints (kept out of `ProbeReport` -- not part
 * of the T1-T8 interface contract). */
function buildReport(selected: readonly string[] | undefined): {
  report: ProbeReport;
  risers: string[];
  fallers: string[];
} {
  const baseline = loadBaselineFixtures();
  const pins: Record<string, number> = {};
  const measured: Record<string, number> = {};
  const fixtures: ProbeReport['fixtures'] = [];
  const allDiffs: Diff[] = [];

  for (const f of baseline) {
    const pinned = f.weightedScore ?? 0;
    const { score, diffs } = measureFixture(f.slug);
    pins[f.slug] = pinned;
    measured[f.slug] = score;
    fixtures.push({ slug: f.slug, score, pinned, delta: score - pinned });
    allDiffs.push(...diffs);
  }

  const aggregate = fixtures.reduce((sum, f) => sum + f.score, 0);
  const subsetSum =
    selected === undefined
      ? null
      : fixtures.filter((f) => selected.includes(f.slug)).reduce((sum, f) => sum + f.score, 0);
  const { risers, fallers } = risersAndFallers(pins, measured);

  return {
    report: { commit: getCommit(), aggregate, subsetSum, fixtures, families: familyWeights(allDiffs) },
    risers,
    fallers,
  };
}

// ---------------------------------------------------------------------------
// --dump / --lanes reporting (no strict output-format contract; formatting
// is this task's own call per the mission's "Push forward" list).
// ---------------------------------------------------------------------------

const DUMP_TAGS = new Set(['line', 'rect', 'polygon', 'ellipse', 'text']);

function formatLane(lane: number | null | undefined): string {
  return lane === null || lane === undefined ? '?' : String(lane);
}

function dumpSide(label: string, svg: string): void {
  const lanes = censusOf(svg).lanes;
  const elements = flattenElements(normalizeSvg(svg)).filter((n) => n.tag !== undefined && DUMP_TAGS.has(n.tag));
  console.log(`${label}:`);
  elements.forEach((n, i) => {
    const x = centerXOf(n);
    const lane = x === undefined ? null : laneIndexOf(x, lanes);
    console.log(`  [${i}] <${n.tag}> x=${x ?? '?'} lane=${formatLane(lane)}`);
  });
}

function dumpSlug(slug: string): void {
  const { markup, golden } = readFixture(slug);
  dumpSide('OURS', renderOurs(markup));
  dumpSide('JAR', golden);
}

function compoundLanesOf(svg: string): Map<CompoundCategory, (number | null)[]> {
  const lanes = censusOf(svg).lanes;
  const rows = new Map<CompoundCategory, (number | null)[]>();
  for (const n of flattenElements(normalizeSvg(svg))) {
    const category = categoryOf(n);
    if (category === undefined) continue;
    const x = centerXOf(n);
    const lane = x === undefined ? null : laneIndexOf(x, lanes);
    const arr = rows.get(category) ?? [];
    arr.push(lane);
    rows.set(category, arr);
  }
  return rows;
}

const COMPOUND_CATEGORIES: readonly CompoundCategory[] = ['fork/join bar', 'split/join line', 'diamond/hexagon'];

function lanesForSlug(slug: string): void {
  const { markup, golden } = readFixture(slug);
  const oursRows = compoundLanesOf(renderOurs(markup));
  const jarRows = compoundLanesOf(golden);
  for (const category of COMPOUND_CATEGORIES) {
    const ours = oursRows.get(category) ?? [];
    const jar = jarRows.get(category) ?? [];
    const rowCount = Math.max(ours.length, jar.length);
    for (let i = 0; i < rowCount; i += 1) {
      console.log(`${category}[${i}]: ours=${formatLane(ours[i])} jar=${formatLane(jar[i])}`);
    }
  }
}

/** T1/Q6: per-tag `polygon`/`line`/`text`/`rect` counts (ours vs jar) plus
 * the `--dump`-ordered (tag, lane) positional alignment `n/N` -- the same
 * figures Q1's templates record by hand for each representative slug. */
function alignForSlug(slug: string): void {
  const { markup, golden } = readFixture(slug);
  const { perTag, alignment } = alignReport(renderOurs(markup), golden);
  console.log(`${slug}:`);
  for (const [tag, counts] of Object.entries(perTag)) {
    console.log(`  ${tag}: ours=${counts.ours} jar=${counts.jar}`);
  }
  console.log(`  alignment: ${alignment.matched}/${alignment.total}`);
}

// ---------------------------------------------------------------------------
// CLI entry point.
// ---------------------------------------------------------------------------

interface CliArgs {
  slugs: string[] | undefined;
  jsonOut: string | undefined;
  dumpSlug: string | undefined;
  lanesSlug: string | undefined;
  alignSlug: string | undefined;
}

/** One setter per flag, keyed by flag name -- a lookup table instead of a
 * branching if/else chain, so adding a flag never raises this function's own
 * cyclomatic complexity. */
const FLAG_SETTERS: Record<string, (args: CliArgs, value: string) => void> = {
  '--slugs': (args, value) => (args.slugs = extractSlugs(value)),
  '--slugs-file': (args, value) => (args.slugs = extractSlugs(readFileSync(value, 'utf8'))),
  '--json': (args, value) => (args.jsonOut = value),
  '--dump': (args, value) => (args.dumpSlug = value),
  '--lanes': (args, value) => (args.lanesSlug = value),
  '--align': (args, value) => (args.alignSlug = value),
};

function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {
    slugs: undefined,
    jsonOut: undefined,
    dumpSlug: undefined,
    lanesSlug: undefined,
    alignSlug: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    const setter = flag === undefined ? undefined : FLAG_SETTERS[flag];
    if (setter === undefined || value === undefined) continue;
    setter(args, value);
    i += 1;
  }
  return args;
}

function printSummary(result: ReturnType<typeof buildReport>, selected: readonly string[] | undefined): void {
  const { report, risers, fallers } = result;
  console.log(`commit=${report.commit}`);
  console.log(`aggregate=${report.aggregate}`);
  if (selected !== undefined) {
    const count = report.fixtures.filter((f) => selected.includes(f.slug)).length;
    console.log(`subsetSum=${String(report.subsetSum)} over ${count} slugs`);
  }
  console.log(`risers (${risers.length}): ${risers.join(', ')}`);
  console.log(`fallers (${fallers.length}): ${fallers.join(', ')}`);
  const families = Object.entries(report.families).sort(([, a], [, b]) => b - a);
  console.log(`families (${families.length}), top 10 by weight:`);
  for (const [family, weight] of families.slice(0, 10)) console.log(`  ${weight}\t${family}`);
}

/* v8 ignore start -- CLI entry point; pure functions above are exercised
 * directly by tests/unit/scripts/activity-probe.test.ts. */
function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.dumpSlug !== undefined) {
    dumpSlug(args.dumpSlug);
    return;
  }
  if (args.lanesSlug !== undefined) {
    lanesForSlug(args.lanesSlug);
    return;
  }
  if (args.alignSlug !== undefined) {
    alignForSlug(args.alignSlug);
    return;
  }

  const result = buildReport(args.slugs);
  printSummary(result, args.slugs);
  if (args.jsonOut !== undefined) {
    writeFileSync(args.jsonOut, JSON.stringify(result.report, null, 2) + '\n');
    console.log(`wrote ${args.jsonOut}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
