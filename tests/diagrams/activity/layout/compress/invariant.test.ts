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
  // Mission `activity-lane-capture` T6 (2026-09-15): fixing the fork's own
  // bar/join lanes moves branch out-drop x-coordinates, which shifts WHICH
  // pairs of already-pinned-class shapes collide post-compression -- not a
  // new class. `bixefi-77-moki051` was predicted to leave this list
  // entirely (planning-time guess); measured instead, its one pair
  // persists at new coordinates, and `tobajo-64-mipi810`/`misiji-27-
  // buje656` gain more instances of the SAME two pinned classes already
  // named above (`polygon×polygon`, both `polygonSkipMode: 'x'` cross-lane
  // arrowheads, `Worm.java:159-168`; `empty×centeredText`, the swimlane
  // title never occupying x, `UGraphicCompressOnXorY.java:100-112`). See
  // decision-journal.md's T6 row for the per-fixture shape dump that
  // confirms this before committing (stop 8).
  //
  // T7 (2026-09-15): giving split its own opener/out lanes moves every
  // split fixture's branch out-drop x-coordinates the same way T6's fork
  // fix did. `maketa-43-juja264`'s two `empty×centeredText` pairs are
  // GONE (confirmed via the scratch `dump-overlap.mts` -- zero NEW
  // overlaps reported for this fixture at all, not merely reindexed
  // elsewhere): its split-branch geometry no longer places a swimlane
  // title's ignored-x rect over a lane-content box post-compression.
  // `bugaja-31-jaso630 [7,9]` and `racana-82-zece676 [7,9]`/`[13,15]`
  // persist at new coordinates -- confirmed by the same scratch dump: all
  // three pairs are still `polygon×polygon`, both sides still carrying
  // `polygonSkipMode: 'x'` (the pinned cross-lane-arrowhead class,
  // `Worm.java:159-168` -- the Worm skips the x-axis on a polygon in this
  // mode, so it never occupies x and a flip there is not a violation).
  //
  // Mission `activity-edge-draw-order` T2 (2026-09-15): rule (b) draws the
  // edge run in swimlane pass order (`edge-draw-order.ts`,
  // `Swimlanes.java:328-352`), which permutes `geometry.edges` and
  // `edgeMeta` together and therefore renumbers every EDGE-derived shape in
  // `shapesOf`'s flat list (nodes first, then edges, then reservations and
  // titles -- `shapes-of.ts:370-382`). Same fixtures, same pair KINDS, same
  // count (9 -> 9): only the indices move. Verified pair by pair against a
  // HEAD (`d33799dc`) worktree running this same harness -- each pair below
  // has byte-identical coordinates and `polygonSkipMode` on both sides of
  // the change, and each fixture's total shape count is unchanged
  // (`bixefi` 19, `bugaja` 21, `misiji` 20, `racana` 26, `tobajo` 61), so
  // no pair is NEW and no shape was added or dropped. Per-entry cites below.
  //
  // Mission `activity-edge-draw-order` T3 (2026-09-15): rule (a) emits a
  // parallel's connectors as upstream builds them -- every branch's
  // internals, then every `ConnectionIn` (`doStep1`), then every
  // `ConnectionOut` (`doStep2`), since `build` is `doStep2(inner,
  // doStep1(inner))` (`AbstractParallelFtilesBuilder.java:166-169`) and
  // `FtileWithConnection.drawU` draws its delegate before its own
  // connections (`FtileWithConnection.java:69-74`). That permutes the edge
  // run inside every fork/split and so renumbers the EDGE-derived shapes
  // again. Seven of the nine entries below move index; `misiji`'s two do
  // not. Same fixtures, same pair KINDS, same count (9 -> 9). Verified
  // pair by pair against a worktree at `2b8120a2` running this same
  // harness: every pair has byte-identical coordinates and
  // `polygonSkipMode` on both sides of the change, and each fixture's
  // total shape count is unchanged (`bixefi` 19, `bugaja` 21, `misiji` 20,
  // `racana` 26, `tobajo` 61), so no pair is new. Independently, the edge
  // MULTISET (points + both lanes + shape tag + label + colour) is equal
  // across all 268 baseline fixtures between that worktree and this tree,
  // so only array position changed. `hardViolations` is empty in BOTH
  // trees. Per-entry cites below.
  const ALLOWED_NEW_OVERLAPS = [
    // Cross-lane arrowheads, both `polygonSkipMode: 'x'` -- the Worm skips
    // the x-axis on such a polygon, so it never occupies x and a flip there
    // is not a violation (`ftile/Worm.java:159-168`). Was `[7,9]` before T3.
    'bixefi-77-moki051 [9,10] polygon×polygon',
    // Same class (`Worm.java:159-168`). Was `[9,11]` before T3.
    'bugaja-31-jaso630 [11,12] polygon×polygon',
    // The swimlane title's rect never occupies x
    // (`klimt/UGraphicCompressOnXorY.java:100-112`, the
    // `ignoreForCompressionOnX` band of `Swimlanes.java:358-367`).
    // Unmoved: both shapes follow the whole edge run in `shapesOf`'s list.
    'misiji-27-buje656 [14,18] empty×centeredText',
    'misiji-27-buje656 [15,18] empty×centeredText',
    // Same class (`Worm.java:159-168`). Were `[10,12]` and `[14,16]`
    // before T3.
    'racana-82-zece676 [14,15] polygon×polygon',
    'racana-82-zece676 [16,17] polygon×polygon',
    // Same class (`Worm.java:159-168`). Were `[47,49]`, `[47,51]`,
    // `[49,51]` before T3, `[50,51]`/`[50,52]`/`[51,52]` before T4 --
    // mission `activity-if-tile-port` T4 (2026-09-16): `tobajo-64-mipi810`
    // is a `down` fixture (`fixtures.md`); `GtileIfDown` now emits its
    // `if-split`/`if-label`/`if-merge` nodes (previously the legacy
    // single-diamond tile, retired at T5, drew no merge diamond and no
    // branch labels), inserting 16 new shapes ahead of this triple in
    // `shapesOf`'s flat list. Same fixture, same coincident triple, same
    // coordinates (436.62187499999993, 479.5), only the index shifted.
    // altp T2: indices +2 (the repeat's two `ja` east labels now precede
    // these three shapes); coordinates unchanged. altp-T5: indices +3 more
    // (68->71 etc.) -- `tileRepeat` now builds a real entry tile as
    // `GtileRepeat`'s first child (D2), inserting new shapes ahead of this
    // triple; AND the coordinates themselves moved this time (dumped
    // directly: `(437.51249999999998, 507)` before T5 -> `(437.5124999999
    // 998, 591)` after), an expected consequence of D4's jar-verbatim
    // height formula (`entry.h + body.h + condition.h + 96`) growing the
    // repeat's own height and shifting everything below it down -- same
    // coincident triple, same `polygonSkipMode: 'x'` cross-lane-arrowhead
    // class (`Worm.java:159-168`), not a new mechanism. altp-T6: indices +6
    // (71->77) -- each of this fixture's three repeats gains a real
    // `ConnectionIn` edge (entry->body, absent before T6: the interim drew
    // only a body->condition edge and a left-side back edge, D5) and its
    // back edge now carries `emphasize: 'up'` (a second, mid-segment
    // arrowhead polygon, `Snake#emphasizeDirection(UP)`, `FtileRepeat.java:
    // 558,630,381,393` -- the interim's `GConnectionDownThenUp` back edge
    // set no such flag), so 2 new shapes per repeat x 3 repeats = 6 new
    // shapes ahead of this triple in `shapesOf`'s flat list. Coordinates
    // dumped directly and confirmed byte-identical to the numbers above
    // (`(467.8749999999999, 591)`, `polygonSkipMode: 'x'` on both sides).
    'tobajo-64-mipi810 [77,78] polygon×polygon',
    'tobajo-64-mipi810 [77,79] polygon×polygon',
    'tobajo-64-mipi810 [78,79] polygon×polygon',
    // Same class as `misiji-27-buje656` above (`UGraphicCompressOnXorY.
    // java:100-112`): the swimlane title's rect never occupies x. Mission
    // `activity-if-tile-port` T6b: `lukoxa-16-cecu095` is a single-branch
    // `if` that switches swimlane in its `else`
    // (`Web Service|if..stop / else |Fournisseur|:foo2;`); `GtileTopDown`
    // aligning its two top-level children (`start`-chain, `if`) on `left`
    // instead of centring shifts both branch-out-drop x-coordinates
    // (12->12 unmoved, 126->118 by -8, matching the if's own left shift)
    // enough that the post-compression `empty` ignoreX rects now project
    // onto the swimlane title's y-span. Dumped directly (not assumed):
    // both pairs are `hard=false` (`occupiesOn(a, 'x')` is false on the
    // `empty` shape in both), so this is the pinned non-hard class, not a
    // hard violation.
    'lukoxa-16-cecu095 [10,14] empty×centeredText',
    'lukoxa-16-cecu095 [11,14] empty×centeredText',
  ].sort();

  /**
   * A hard overlap (both shapes DO occupy both axes -- `isHard` below is
   * `true`) that is NOT a geometry defect: a proven floating-point
   * rounding artifact at an EXACT-touch boundary, not a real intersection.
   * Kept separate from `ALLOWED_NEW_OVERLAPS` because that list's own
   * class (a shape not occupying one axis, `Worm.java:159-168` /
   * `UGraphicCompressOnXorY.java:100-112`) does not apply here -- this
   * pair fails `isHard`'s test in the "should be forbidden" direction, so
   * the attribution has to justify the exception on its own terms.
   *
   * `kitupi-32-jexo155 [0,1] polygon×text` (mission `activity-if-tile-port`
   * T3): shape 0 is the `if-split` hexagon, shape 1 its own west
   * `if-label` (the `then`-branch's `(yes)` label; `if-label` nodes did not
   * exist before T3, so this pair is new by construction, not a
   * regression in existing geometry).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:98-99
   *   -- `west.drawU(ug.apply(new UTranslate(-dimWest.getWidth(), ...)))`:
   *   the west label's OWN right edge is placed at the hexagon's local
   *   x=0 -- EXACTLY zero gap by design, not merely close.
   *
   * Confirmed (not assumed) with a direct dump of `shapesOf`'s shape[0]/
   * shape[1] on this fixture, before and after compression:
   * - `before` (pre-compression): hexagon.x === label.x + label.width ===
   *   `173.2156249999999` on BOTH sides -- the IDENTICAL float, not merely
   *   close. `overlaps()`'s strict `<` requires one bound to be less than
   *   the other; two equal floats never satisfy that, so `before` has no
   *   overlap here (confirmed: `beforePairs` does not contain `[0,1]`).
   * - `after` (post-compression): hexagon.x = `163.21562499999993`,
   *   label.x + label.width = `163.21562499999995` -- the SAME nominal
   *   10px leftward shift applied to both shapes, but through two
   *   independent `compress-geometry.ts` transform calls that round
   *   ~2e-14 apart. That sub-epsilon gap is what flips the pair from
   *   touching to `overlaps()`-true.
   *
   * Not fixed at the source (`compress-geometry.ts`/`slot-finder.ts`'s
   * `overlaps()`, both outside every task's write-set in this mission): an
   * epsilon tolerance there would also silently absorb a genuine
   * sub-epsilon overlap elsewhere in the 268-fixture corpus, which is a
   * strictly worse trade than pinning this one proven-benign pair by its
   * exact fixture + index + kind.
   *
   * `boxoto-53-sifo232 [27,29]` and `[38,40] polygon×text` (mission
   * `activity-if-tile-port` T6b): the SAME class, mirrored to the EAST
   * label. Shape 27/38 is each an `if-split` hexagon (`if-split-28`,
   * `if-split-39`); shape 29/40 its own east `if-label`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:101-102
   *   -- `east.drawU(ug.apply(new UTranslate(dimTotal.getWidth(), ...)))`:
   *   the east label's OWN left edge is placed at the hexagon's local
   *   x=width -- EXACTLY zero gap by design, the mirror of the west case
   *   above.
   *
   * T6b (`GtileTopDown` aligning children on `left` instead of centring on
   * width) changes the ABSOLUTE x-translate applied to these two if-tiles
   * within their containing top-down, which is what exposes this pair:
   * the local hexagon/label offset is unconditionally zero by construction
   * regardless of translate, but `compress-geometry.ts`'s two independent
   * transform calls (one per shape) round the shifted absolute x
   * ~1.1e-13 apart. Confirmed with a direct dump (not assumed):
   * - `before` (pre-compression): `hexagon.x + hexagon.width ===
   *   label.x` bit-identical on both pairs (`568.27812500000004547` and
   *   `646.58750000000009095` respectively) -- no overlap
   *   (`beforePairs` does not contain either key).
   * - `after` (post-compression): `560.67812500000013642` vs
   *   `560.67812500000002274`, and `638.98750000000018190` vs
   *   `638.98750000000006821` -- sub-epsilon gaps, same mechanism as
   *   `kitupi-32-jexo155` above, not a geometry defect.
   *
   * `lopone-15-xiki477 [7,20] polygon×polygon` (mission `activity-if-tile-
   * port` T6c): the SAME class again, mirrored to an edge's own arrowhead
   * instead of an `if-label`. Shape 7 is node 7, `if-split-8` -- a nested
   * `if`'s own diamond1 hexagon, itself the branch content of an outer
   * `elseif`-row (`FtileIfLongHorizontal`). Shape 20 is edge 6's terminal
   * arrowhead (`shapesOf`'s node-shapes-then-edge-shapes ordering: 14
   * nodes, so edge 0's arrowhead starts at index 14); edge 6 carries the
   * `'if-vertical-in'` tag, i.e. `ConnectionVerticalIn`:
   * `diamond_i.pointOut -> tile_i.pointIn`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:389-436
   *   -- `ConnectionVerticalIn`'s own inner class, `tile_i.pointIn` is
   *   `tile_i`'s own `FtileGeometry` `getPointIn()`, unmodified.
   *
   * `tile_i` here is a bare `FtileIfDown` (no further wrapping): its own
   * reported `left` ALWAYS lands exactly on its own `diamond1`'s centre,
   * by construction -- `getTranslateDiamond1`'s `x1 = dimTotal.getLeft() -
   * dimDiamond1.getLeft()` places `diamond1` so that `diamond1.left +
   * dimDiamond1.getLeft() === dimTotal.getLeft()` always, independent of
   * any branch asymmetry (T6c only changes `dimTotal.getLeft()`'s VALUE,
   * never this identity).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:624-637
   *   -- `getTranslateForThen`/`getTranslateDiamond1`, the identity above.
   *
   * So `ConnectionVerticalIn`'s arrowhead landing exactly on the nested
   * `if`'s own hexagon top-centre is by design, not a defect -- T6c's fix
   * is what makes `tile_i.pointIn` correctly resolve to that exact point
   * (previously off by the `outer/2` bug), which is what newly exposes the
   * pre-existing rounding artifact here. Confirmed with a direct dump:
   * - `before`: hexagon top `y === 132` and arrowhead-box `y(122) +
   *   height(10) === 132` -- bit-identical integers, no overlap
   *   (`beforePairs` does not contain `[7,20]`).
   * - `after`: hexagon `y === 126.05555555555554`, arrowhead `y(
   *   116.05555555555556) + height(10) === 126.05555555555556` -- a
   *   ~1.8e-14 gap, same two-independent-transform-calls mechanism as
   *   `kitupi-32-jexo155` above, not a geometry defect.
   */
  const ALLOWED_HARD_OVERLAPS = [
    // `tobajo-64-mipi810 [16,17]` (mission `activity-loop-tile-port`, T2):
    // a repeat's condition hexagon and its OWN east label `ja`. The jar
    // draws the east label AT the hexagon's right edge, zero gap
    // (`FtileDiamondInside.java:102`: `east.drawU(ug.apply(new
    // UTranslate(dimTotal.getWidth(), …)))`; the golden's `ja` sits at
    // x=330.838 = its hexagon's right edge). `before`: hexagon
    // `x(566.225) + width(73.3625) === 639.5875 === text.x` -- touching,
    // no overlap. `after`: `264.65625 + 73.3625 === 338.01875` vs text
    // `338.01874999999995` -- a 5e-14 overlap from the label's x being
    // re-derived through a second transform after lane compression, the
    // same mechanism as `kitupi-32-jexo155` below. Not a geometry defect.
    // altp-T5: index +1 (was `[16,17]`) -- `tileRepeat` now builds a real
    // entry tile as `GtileRepeat`'s first child (D2), which inserts one new
    // shape ahead of this pair in `shapesOf`'s flat list. Coordinates
    // dumped directly and confirmed byte-identical to the numbers above
    // (`264.65625 + 73.3625 === 338.01875` vs `338.01874999999995`).
    'tobajo-64-mipi810 [17,18] polygon×text',
    'kitupi-32-jexo155 [0,1] polygon×text',
    // altp-T5: indices +1 each (were `[27,29]`/`[38,40]`), same mechanism
    // and same reason as `tobajo-64-mipi810` above -- confirmed by direct
    // dump: both hexagons' right edge exactly equals their own `ja`/east
    // label's `x` (`283.37187500000005 + 267.30625000000003 ===
    // 550.678125`; `500.1250000000001 + 131.1125 === 631.2375`).
    'boxoto-53-sifo232 [28,30] polygon×text',
    'boxoto-53-sifo232 [39,41] polygon×text',
    'lopone-15-xiki477 [7,20] polygon×polygon',
    // `nerete-42-save418 [22,25]` (mission `unknown-bucket-routing-repair`,
    // T10b, 2026-09-20): UNLIKE every entry above, this is a REAL 3.47 px
    // collision, recorded here as an honest, diagnosed defect with a filed
    // follow-on -- not a rounding artefact. The fixture parses only since
    // T10 ported `CommandWhileEnd3`. Shape 22 is the while-loop's "no"-exit
    // gutter (`walk-while-branch.ts#pushWhileOut`) EMPHASIZE arrowhead;
    // shape 25 is the third `break`'s terminal arrowhead landing on the
    // same gutter. Mechanism: `shapes-of.ts#emphasizeArrowhead` (and the
    // renderer's twin `renderer.ts#findEmphasisSegment`) anchor the
    // emphasize head at the midpoint of a segment whose two endpoints were
    // ALREADY Y-compressed independently, so `mid(ct(p1), ct(p2))` folds
    // the slot space removed between the raw midpoint and the far endpoint
    // into the anchor: `(24 + 235.0556) / 2 = 129.5278 = shape22.y + 10`
    // exactly, 43.47 px above its raw position, while the terminal head
    // (a genuine edge vertex) moves the faithful 9.94 px. Upstream evaluates
    // the compression ONCE at the raw midpoint: `Worm.java:174-184` composes
    // two `UTranslate`s on the compressing `UGraphic`
    // (`UGraphicCompressOnXorY.java:55-63,87-120`), i.e. `ct(mid_raw)`.
    // `midArrowAt` already gets that atomic treatment
    // (`compress-geometry.ts:148-153`); `emphasize` does not. Corpus-wide
    // (every while/repeat/empty-branch if), fix threads an atomic anchor
    // through four producers, `transformEdge`, `shapes-of.ts` AND
    // `renderer.ts` -- filed as the follow-on mission
    // `activity-emphasize-arrow-atomic-anchor` (planning/next-missions.md).
    'nerete-42-save418 [22,25] polygon×polygon',
  ].sort();

  it('never introduces a HARD shape-pair overlap (both shapes occupying both axes) that was not already present before compression', () => {
    const measurer = new DeterministicMeasurer();
    const hardViolations: string[] = [];
    const allowed: string[] = [];
    const allowedHard: string[] = [];
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
        if (!isHard) {
          allowed.push(entry);
        } else if (ALLOWED_HARD_OVERLAPS.includes(entry)) {
          allowedHard.push(entry);
        } else {
          hardViolations.push(entry);
        }
      }
    }
    expect(hardViolations).toEqual([]);
    expect(allowed.sort()).toEqual(ALLOWED_NEW_OVERLAPS);
    expect(allowedHard.sort()).toEqual(ALLOWED_HARD_OVERLAPS);
  });
});
