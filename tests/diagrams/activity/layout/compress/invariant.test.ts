/**
 * T5's own invariant, over all 268 `status: "baseline"` fixtures of
 * `oracle/goldens/svg-activity/diff-baseline.json`: compression
 * (`compress-geometry.ts#compressGeometry`, wired at `assign-coordinates-
 * full.ts#assignCoordinatesFull`) must never THROW (stop 10) and must never
 * introduce a NEW HARD shape overlap (stop 11, amended 2026-09-10 after the
 * T5 halt) -- `overlaps(shapesOf(after))` must be a subset of
 * `overlaps(shapesOf(before))`, as index pairs, EXCEPT for a pair where one
 * shape does not `occupiesOn` the flipped axis (a cross-lane
 * `polygonSkipMode` head, a `centeredText` title on X, an ignored rect's
 * own middle) -- that class is what the jar itself moves by design, and is
 * pinned (`ALLOWED_NEW_OVERLAPS` below) rather than forbidden.
 *
 * "before"/"after" are the pass-1 and post-compression geometries from the
 * SAME `assignCoordinatesFull` call site, via its own `compress: false`
 * knob (mission task instructions: "a `compress: false` option ... not on
 * the public type" -- `AssignCoordinatesInput.compress`, internal-only).
 * `shapesOf`'s shape list must also carry the same COUNT and ORDER on both
 * sides (asserted explicitly): compression only transforms `x`/`y`/`width`/
 * `height` in place (`compress-geometry.ts#transformNode`/`transformEdge`/
 * `transformReservation`), it never adds, removes, or reorders a node,
 * edge, or reservation -- so the two shape lists are index-comparable
 * without any re-matching step.
 *
 * The parse/theme/tile-building prefix mirrors `render-fixture-activity.ts`
 * up to `layoutActivity`'s own tile-building (`tile-layout.ts:154-163`) --
 * not imported from there for the same reason `swimlane-census.ts`'s own
 * copy is not (see that file's doc comment): this harness needs BOTH the
 * pre- and post-compression geometry from one parse, which `layoutActivity`
 * (always compressed) and `renderFixtureActivity` (SVG string only) do not
 * expose.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildBlockUmls } from '../../../../../src/core/BlockUmlBuilder.js';
import type { PreprocessorResult } from '../../../../../src/core/preprocessor.js';
import { resolveTheme } from '../../../../../src/core/theme.js';
import type { Theme } from '../../../../../src/core/theme.js';
import { resolveSkinparam, parseStyleBlock } from '../../../../../src/core/skinparam.js';
import type { StyleMap } from '../../../../../src/core/skinparam.js';
import { applyStyleMap } from '../../../../../src/core/style-map-theme.js';
import { applySkinLayer } from '../../../../../src/core/skin-loader.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../../helpers/fixture-include-store.js';
import { parseActivity } from '../../../../../src/diagrams/activity/parser.js';
import { astOrThrow } from '../../../../helpers/parse-ast.js';
import { tileNodes } from '../../../../../src/diagrams/activity/layout/tile-layout.js';
import { GtileTopDown } from '../../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import type { StringBounder } from '../../../../../src/diagrams/activity/tiles/tile.js';
import {
  assignCoordinatesFull,
  type AssignCoordinatesResult,
} from '../../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { LAYOUT_MARGIN } from '../../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { shapesOf, type CompressShape } from '../../../../../src/diagrams/activity/layout/compress/shapes-of.js';
import { occupiesOn, overlaps } from '../../../../../src/diagrams/activity/layout/compress/slot-finder.js';
import type { Reservation } from '../../../../../src/diagrams/activity/layout/hexagon-reservations.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, '../../../../../oracle/goldens/svg-activity/diff-baseline.json');
const CACHE_ROOT = join(HERE, '../../../../../test-results/dot-cache');

interface BaselineFixture {
  readonly type: string;
  readonly slug: string;
  readonly status: 'baseline' | 'error' | 'jar-error';
}

interface DiffBaselineManifest {
  readonly fixtures: readonly BaselineFixture[];
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as DiffBaselineManifest;
const baselineFixtures = manifest.fixtures.filter((f) => f.status === 'baseline');

// Same theme-resolution prefix as `render-fixture-activity.ts` /
// `swimlane-census.ts` -- each conformance surface keeps its own copy
// rather than importing another surface's private helper (precedent: both
// of those files already duplicate this, neither exports it).
function buildThemeForFixture(preprocessed: PreprocessorResult, rawSourceLines: readonly string[]): Theme {
  const base = resolveTheme(preprocessed.theme ?? 'default');
  const withSkin = applySkinLayer(preprocessed, base, rawSourceLines);
  const withSkinparam = resolveSkinparam(preprocessed.skinparam, withSkin).theme;
  const styleMap = preprocessed.styles.map(parseStyleBlock).reduce<StyleMap>((acc, m) => {
    m.forEach((props, selector) => {
      const existing = acc.get(selector) ?? new Map<string, string>();
      props.forEach((v, k) => existing.set(k, v));
      acc.set(selector, existing);
    });
    return acc;
  }, new Map());
  const flatRoot = styleMap.get('') ?? new Map<string, string>();
  const withStyles = resolveSkinparam(flatRoot, withSkinparam).theme;
  return applyStyleMap(styleMap, withStyles);
}

function makeBounder(measurer: DeterministicMeasurer, theme: Theme): StringBounder {
  return {
    getDimension: (text: string, fontSizePt: number) =>
      measurer.measure(text, { family: theme.fontFamily, size: fontSizePt }),
  };
}

interface BeforeAfter {
  before: AssignCoordinatesResult;
  after: AssignCoordinatesResult;
  bounder: StringBounder;
  theme: Theme;
}

/** Parses and tile-builds one fixture, then runs `assignCoordinatesFull`
 *  twice over the SAME root tile (`compress: false`, then the default
 *  `true`) -- safe because layout never mutates the `Tile` tree itself
 *  (only reads `width`/`height`/`getCoord`/`hasPointOut`), confirmed by
 *  inspection of `walkTile` and its `walk-*-branch.ts` helpers. `null` for
 *  the empty-AST case `layoutActivity` special-cases (`tile-layout.ts
 *  :155-157`) -- nothing to compress. */
function layoutBeforeAfter(markup: string, measurer: DeterministicMeasurer): BeforeAfter | null {
  const blocks = buildBlockUmls(markup, { includeStore: fixtureIncludeStore() });
  const first = blocks[0];
  if (first === undefined) throw new Error('no diagram block found');
  if (!first.ok) throw first.failure.cause;
  const preprocessed = first.preprocessed;
  const rawSourceLines = first.rawSource.map((s) => s.getString());
  const theme = buildThemeForFixture(preprocessed, rawSourceLines);
  const block = { ...first.source, rawStyles: preprocessed.styles, stylePositions: preprocessed.stylePositions };
  const ast = astOrThrow(parseActivity(block), 'activity');
  if (ast.nodes.length === 0) return null;

  const bounder = makeBounder(measurer, theme);
  const tiles = tileNodes(ast.nodes, bounder, theme);
  const root = new GtileTopDown(tiles, bounder, theme);
  const before = assignCoordinatesFull({
    root,
    ast,
    baseX: LAYOUT_MARGIN,
    baseY: LAYOUT_MARGIN,
    bounder,
    theme,
    compress: false,
  });
  const after = assignCoordinatesFull({ root, ast, baseX: LAYOUT_MARGIN, baseY: LAYOUT_MARGIN, bounder, theme });
  return { before, after, bounder, theme };
}

/** The one `Reservation` with both ignore flags is the swimlane title band
 *  (`compress-geometry.ts#findSwimlaneBand`'s own discriminator, re-derived
 *  here rather than imported since that function is module-private). */
function findBand(reservations: readonly Reservation[]) {
  const band = reservations.find((r) => r.ignoreX === true && r.ignoreY === true);
  if (band === undefined) return undefined;
  return { x: band.x, y: band.y, width: band.width, height: band.height };
}

function shapesFor(result: AssignCoordinatesResult, bounder: StringBounder, theme: Theme): CompressShape[] {
  return shapesOf({
    nodes: result.geometry.nodes,
    edges: result.geometry.edges,
    edgeMeta: result.edgeMeta,
    swimlanes: result.geometry.swimlanes,
    reservations: result.reservations,
    swimlaneBand: findBand(result.reservations),
    bounder,
    theme,
  });
}

function readMarkup(fixture: BaselineFixture): string {
  return readFileSync(join(CACHE_ROOT, fixture.type, fixture.slug, 'in.puml'), 'utf8');
}

describe('compress invariant -- no baseline fixture throws (stop 10)', () => {
  it('lays out before and after on all 268 baseline fixtures without throwing', () => {
    const measurer = new DeterministicMeasurer();
    const failures: string[] = [];
    for (const fixture of baselineFixtures) {
      try {
        layoutBeforeAfter(readMarkup(fixture), measurer);
      } catch (err) {
        failures.push(`${fixture.slug}: ${(err as Error).message}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('compress invariant -- no new shape overlap (stop 11)', () => {
  it('keeps the same shape count and order before and after compression', () => {
    const measurer = new DeterministicMeasurer();
    const mismatches: string[] = [];
    for (const fixture of baselineFixtures) {
      const both = layoutBeforeAfter(readMarkup(fixture), measurer);
      if (both === null) continue;
      const before = shapesFor(both.before, both.bounder, both.theme);
      const after = shapesFor(both.after, both.bounder, both.theme);
      if (before.length !== after.length) {
        mismatches.push(`${fixture.slug}: before=${before.length} after=${after.length}`);
        continue;
      }
      for (let i = 0; i < before.length; i++) {
        if (before[i]!.kind !== after[i]!.kind) {
          mismatches.push(`${fixture.slug}[${i}]: before=${before[i]!.kind} after=${after[i]!.kind}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  /**
   * README stop 11 (amended 2026-09-10, after the T5 halt): a new pair is a
   * HARD violation only when BOTH shapes {@link occupiesOn} BOTH axes --
   * `overlaps()` reports a real-geometry 2-D box intersection, but a shape
   * that does not occupy an axis (a cross-lane `polygonSkipMode` head, a
   * `centeredText` title on X, an ignored rect's own middle) is exactly the
   * class the jar itself is free to move on that axis by design
   * (`Worm.java:159-168`, `UGraphicCompressOnXorY.java:100-112`,
   * `URectangle.java:193-206`) -- on such an axis the jar may cross the
   * pair into contact too, so a flip there is not evidence of a defect. A
   * NEW 2-D overlap needs at least one axis's projection to flip from
   * disjoint to intersecting; if that axis is one where a shape does not
   * occupy, the flip is exactly this pinned class, not a violation.
   *
   * The allowed pairs are pinned by fixture + index + kind (not merely
   * counted) so a CHANGE to the list is examined, not silently absorbed by
   * a bigger/smaller count.
   */
  const ALLOWED_NEW_OVERLAPS = [
    'bixefi-77-moki051 [6,8] polygon×polygon',
    'bugaja-31-jaso630 [7,9] polygon×polygon',
    'maketa-43-juja264 [22,26] empty×centeredText',
    'maketa-43-juja264 [23,26] empty×centeredText',
    'racana-82-zece676 [7,9] polygon×polygon',
    'racana-82-zece676 [13,15] polygon×polygon',
    'tobajo-64-mipi810 [31,38] polygon×polygon',
  ].sort();

  it('never introduces a HARD shape-pair overlap (both shapes occupying both axes) that was not already present before compression', () => {
    const measurer = new DeterministicMeasurer();
    const hardViolations: string[] = [];
    const allowed: string[] = [];
    for (const fixture of baselineFixtures) {
      const both = layoutBeforeAfter(readMarkup(fixture), measurer);
      if (both === null) continue;
      const before = shapesFor(both.before, both.bounder, both.theme);
      const after = shapesFor(both.after, both.bounder, both.theme);
      if (before.length !== after.length) continue; // reported by the sibling test above
      const beforePairs = new Set(overlaps(before).map(([i, j]) => `${i},${j}`));
      for (const [i, j] of overlaps(after)) {
        const key = `${i},${j}`;
        if (beforePairs.has(key)) continue;
        const a = after[i]!;
        const b = after[j]!;
        const isHard = occupiesOn(a, 'x') && occupiesOn(b, 'x') && occupiesOn(a, 'y') && occupiesOn(b, 'y');
        const entry = `${fixture.slug} [${i},${j}] ${a.kind}×${b.kind}`;
        if (isHard) hardViolations.push(entry);
        else allowed.push(entry);
      }
    }
    expect(hardViolations).toEqual([]);
    expect(allowed.sort()).toEqual(ALLOWED_NEW_OVERLAPS);
  });
});
