/**
 * T0a's cohort classifier (sdd1). Renders every renderable row of
 * `oracle/goldens/svg-sequence/diff-baseline.json` through the RATCHET path
 * (`renderFixtureSequence` + `DeterministicMeasurer`, D6), compares against
 * the cached jar SVG, and writes one row per fixture with its cohort and the
 * `[n]`-stripped diff keys (so a close can name mechanisms).
 *
 *   npx tsx plans/sequence-divergence-drive-3/tools/classify.mts <out.json>
 *
 * Run from the repo root.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, weightedScore, type Diff } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSequence, sequenceFixtureOptions } from '../../../tests/oracle/svg-conformance/render-fixture-sequence.js';

export type Cohort = 'zero' | 'paint-only' | 'geometry' | 'structural';

export interface ClassifyRow {
  slug: string;
  cohort: Cohort | 'error';
  ws?: number;
  n?: number;
  nonPaint?: number;
  keys?: Record<string, number>;
  error?: string;
}

export interface BaselineFixture {
  slug: string;
  status: string;
}

/** Message length kept on an `error` row. */
export const ERROR_MESSAGE_MAX = 200;

/** Diff-baseline statuses that are rendered and classified. */
export const RENDERED_STATUSES: ReadonlySet<string> = new Set(['baseline', 'pinned']);

export const PAINT_SUFFIXES: readonly string[] = [
  '@stroke-width', '@rx', '@ry', '@stroke-dasharray', '@fill', '@stroke', '@font-weight',
  '@font-size', '@font-style', '@font-family', '@fill-opacity', '@filter',
];

export const shape = (p: string): string => p.replace(/\[\d+\]/g, '');
export const isPaint = (d: Diff): boolean => PAINT_SUFFIXES.some((s) => shape(d.path).endsWith(s));
export const isStructural = (d: Diff): boolean => d.path.includes('childCount') || /\/[a-z]+$/.test(shape(d.path));

export function cohortOf(diffs: readonly Diff[]): Cohort {
  if (diffs.length === 0) return 'zero';
  const rest = diffs.filter((d) => !isPaint(d));
  if (rest.some(isStructural)) return 'structural';
  return rest.length === 0 ? 'paint-only' : 'geometry';
}

/** Each diff path with `[n]` stripped, with its occurrence count. */
export function keysOf(diffs: readonly Diff[]): Record<string, number> {
  const keys: Record<string, number> = {};
  for (const d of diffs) {
    const k = shape(d.path);
    keys[k] = (keys[k] ?? 0) + 1;
  }
  return keys;
}

/**
 * One output row. `render` produces `{ svg, golden }`; a throw becomes an
 * `error` row carrying the message.
 */
export function buildRow(
  fixture: BaselineFixture,
  render: () => { svg: string; golden: string },
): ClassifyRow {
  if (!RENDERED_STATUSES.has(fixture.status)) return { slug: fixture.slug, cohort: 'error' };
  let rendered: { svg: string; golden: string };
  try {
    rendered = render();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { slug: fixture.slug, cohort: 'error', error: message.slice(0, ERROR_MESSAGE_MAX) };
  }
  const { diffs } = compareSvg(rendered.svg, rendered.golden, 'deterministic');
  return {
    slug: fixture.slug,
    ws: weightedScore(diffs),
    n: diffs.length,
    cohort: cohortOf(diffs),
    nonPaint: diffs.filter((d) => !isPaint(d)).length,
    keys: keysOf(diffs),
  };
}

function main(): void {
  const base = JSON.parse(readFileSync('oracle/goldens/svg-sequence/diff-baseline.json', 'utf8')) as {
    fixtures: BaselineFixture[];
  };
  const out = base.fixtures.map((f) =>
    buildRow(f, () => {
      const dir = `test-results/dot-cache/sequence/${f.slug}`;
      return {
        svg: renderFixtureSequence(readFileSync(`${dir}/in.puml`, 'utf8'), new DeterministicMeasurer(), sequenceFixtureOptions()),
        golden: readFileSync(`${dir}/in.svg`, 'utf8'),
      };
    }),
  );
  writeFileSync(process.argv[2] ?? 'classify.json', JSON.stringify(out, null, 1));
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) main();
