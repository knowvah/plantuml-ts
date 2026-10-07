import { describe, expect, it } from 'vitest';
import { assignCoordinates } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { dedupeAdjacentPoints } from '../../../../src/diagrams/activity/layout/edge-point-dedupe.js';
import { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
import { GtileFork } from '../../../../src/diagrams/activity/tiles/gtile-fork.js';
import { GtileSplit } from '../../../../src/diagrams/activity/tiles/gtile-split.js';
import { GtileBreak } from '../../../../src/diagrams/activity/tiles/gtile-break.js';
import { GtileGroup } from '../../../../src/diagrams/activity/tiles/gtile-group.js';
import { GtileStop } from '../../../../src/diagrams/activity/tiles/gtile-stop.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { parseActivity } from '../../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { astOrThrow } from '../../../helpers/parse-ast.js';

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 60, height: 16 }),
};

// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub. The tiles now resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements` -- a partial cast had no `colors` at all and
// threw. `fontSize` is kept at 13 so every assertion below that depends
// on the ROOT font is unchanged.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

const emptyAst: ActivityDiagramAST = { nodes: [], swimlanes: [] };
// T1a (D2): `LAYOUT_MARGIN` was deleted from production -- the canvas
// origin is now computed dynamically from the placed geometry's own ink
// extent (`assign-coordinates-full.ts#computeCanvasOrigin`,
// `canvas-origin.ts`), which makes the ABSOLUTE value of the `baseX`/
// `baseY` passed into `assignCoordinates` below unobservable (the dynamic
// shift cancels whatever base is passed). Kept as a local, arbitrary
// non-zero base purely to catch an accidental hardcoded-zero regression in
// `walkTile`. Assertions that used to read `LAYOUT_MARGIN` as an ABSOLUTE
// expected position now use the node's own shape-fudge origin instead
// (`RECT_ORIGIN`/`ELLIPSE_ORIGIN` below, `canvas-origin.ts`'s own
// `RECT_FUDGE`/`ELLIPSE_FUDGE`); assertions that only used it as a shared
// additive term between two RELATIVE node positions are unaffected (the
// uniform shift cancels in a difference) and are left exactly as they were.
const LAYOUT_MARGIN = 12;
/** `CANVAS_ORIGIN_SHIFT`(15) + `RECT_FUDGE.near`(1) -- the absolute near-
 *  corner origin of a lone `action`/`group`/`partition`/bar-kind node. */
const RECT_ORIGIN = 16;
/** `CANVAS_ORIGIN_SHIFT`(15) + `NO_FUDGE.near`(0) (same value as
 *  `ELLIPSE_FUDGE.near`(0), since neither fudges its near corner -- no
 *  fixture below happens to pin a lone ellipse-kind node's absolute
 *  position, so only this name is needed): the weld-edge and fork/split
 *  fixtures below whose own ink minimum is a `ULine`/`stub-branch`
 *  (`NO_FUDGE`), not an ellipse. */
const NO_FUDGE_ORIGIN = 15;
/** A `GtileSplit` composite has no full-width bar (unlike `GtileFork`'s
 *  `fork-bar`) -- its own `PARALLEL_X_MARGIN` gap before the first branch
 *  (`AbstractParallelFtilesBuilder.java:130`) is genuinely empty, so BEFORE
 *  T2e the ink minimum was branch0's own box (`stub-branch`, `NO_FUDGE`) at
 *  local x `LAYOUT_MARGIN + branchOffsets[0]` (giving a `-11` shift; see
 *  git history for that derivation).
 *
 *  T2e (`canvas-origin.ts#extendForEdge`, `LimitFinder.java:169-176`
 *  `HACK_X_FOR_POLYGON`): branch0's own in-edge draws a DOWN terminal
 *  arrowhead at the SAME local x branch0's box starts at (both fixtures
 *  below give every branch `hasPointOut: true` or leave branch0 with its
 *  default in-edge). A down decoration's own `minX` is `-4`
 *  (`arrows-regular.ts#arrowHeadPoints('down')`), so `LimitFinder`'s
 *  recorded near corner is `tipX - 4 - 10 = tipX - 14` -- 7px LOWER than
 *  branch0's own box (`tipX - 0`, `NO_FUDGE`), which was the previous ink
 *  minimum. The arrowhead now sets the global min instead, shifting the
 *  whole composite uniformly by `+7` (confirmed with `computeCanvasOrigin`
 *  called directly on this exact fixture's pass-1 geometry: shiftX moved
 *  `-11 -> -4`). `12 + (-11 + 7) = 8`. */
const SPLIT_BRANCH_ORIGIN = 8;

const actionNode = { kind: 'action' as const, label: 'Hello', swimlane: 'default' };
const NODE_MARGIN_Y = 20;

describe('assignCoordinates — single GtileAction', () => {
  const tile = new GtileAction(actionNode, bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

  it('produces exactly 1 node geo', () => {
    expect(geo.nodes).toHaveLength(1);
  });

  it('produces no edge geos', () => {
    expect(geo.edges).toHaveLength(0);
  });

  it('node geo kind === action', () => {
    expect(geo.nodes[0]!.kind).toBe('action');
  });

  // T1a (D2): a lone `action` node is `RECT_FUDGE`'s own kind -- its near
  // corner lands at `RECT_ORIGIN` (16), not the deleted `LAYOUT_MARGIN`.
  it('node geo x === RECT_ORIGIN (canvas-origin.ts RECT_FUDGE)', () => {
    expect(geo.nodes[0]!.x).toBe(RECT_ORIGIN);
  });

  it('node geo y === RECT_ORIGIN (canvas-origin.ts RECT_FUDGE)', () => {
    expect(geo.nodes[0]!.y).toBe(RECT_ORIGIN);
  });

  // M - m = tile.width exactly for a single rect-kind node: `RECT_FUDGE`'s
  // `near`(1) and `far`(-1) cancel (`canvas-origin.ts`'s own module doc).
  it('totalWidth === floor(tile.width + 35) + 1 (CANVAS_PADDING_TOTAL + SVG_CANVAS_CEIL)', () => {
    expect(geo.totalWidth).toBe(Math.floor(tile.width + 35) + 1);
  });

  it('totalHeight === floor(tile.height + 35) + 1 (CANVAS_PADDING_TOTAL + SVG_CANVAS_CEIL)', () => {
    expect(geo.totalHeight).toBe(Math.floor(tile.height + 35) + 1);
  });

  it('no swimlanes for empty ast', () => {
    expect(geo.swimlanes).toHaveLength(0);
  });
});

describe('assignCoordinates — GtileTopDown with 2 GtileAction children', () => {
  const action0 = new GtileAction(actionNode, bounder, theme);
  const action1 = new GtileAction({ kind: 'action' as const, label: 'World', swimlane: 'default' }, bounder, theme);
  const tile = new GtileTopDown([action0, action1], bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

  it('produces exactly 2 node geos', () => {
    expect(geo.nodes).toHaveLength(2);
  });

  it('produces exactly 1 edge geo', () => {
    expect(geo.edges).toHaveLength(1);
  });

  // T1a (D2): node[0] (the topmost `action`) still defines the ink's own Y
  // minimum, so the same `RECT_ORIGIN` origin applies.
  it('node[0].y === RECT_ORIGIN (first child at top)', () => {
    expect(geo.nodes[0]!.y).toBe(RECT_ORIGIN);
  });

  it('node[1].y === RECT_ORIGIN + action0.height + NODE_MARGIN_Y', () => {
    expect(geo.nodes[1]!.y).toBe(RECT_ORIGIN + action0.height + NODE_MARGIN_Y);
  });

  it('totalWidth === floor(tile.width + 35) + 1 (CANVAS_PADDING_TOTAL + SVG_CANVAS_CEIL)', () => {
    expect(geo.totalWidth).toBe(Math.floor(tile.width + 35) + 1);
  });

  // T3c: `tile.height` is the RAW (pre-compression) height -- it now bakes
  // in `SEQUENTIAL_ASSEMBLY_GAP` (35), not the compressed `NODE_MARGIN_Y`
  // (20) `node[1].y` above asserts. `geo.totalHeight` is POST-compression
  // (`assignCoordinatesFull`'s default `compress: true`), so it is derived
  // from the compressed ink extent (`node[1].y + action1.height`), not from
  // `tile.height` directly -- this isolated 2-action pair has no sibling
  // ink in its Y-band, so the real `CompressionXorYBuilder` pass this
  // exercises (unlike before T3c, when compression had nothing to do)
  // shrinks its 35px raw gap back down to 20, same as the jar.
  it('totalHeight === floor((node[1].y - RECT_ORIGIN + action1.height) + 35) + 1 (CANVAS_PADDING_TOTAL + SVG_CANVAS_CEIL)', () => {
    const inkHeight = geo.nodes[1]!.y - RECT_ORIGIN + action1.height;
    expect(geo.totalHeight).toBe(Math.floor(inkHeight + 35) + 1);
  });
});

// D7 / T6 (`plans/activity-if-tile-port/decisions.md` D7,
// `FtileFactoryDelegatorAssembly.java:57-79`,
// `FtileAssemblySimple.java:108-112`, `FtileWithConnection.java:69-74`): the
// sibling link around a compound child is drawn AFTER that child's own
// internals, not before. `a, X, c` with `X` a while (a stand-in for any
// if/while/repeat/fork -- `walkWhile` pushes 4 internal edges since altp-T4
// (`ConnectionIn`, `ConnectionBackSimple`, `ConnectionOut` x2; this body has
// no `break`), the same generic path every compound child's walker takes)
// must read: X's internals, then a->X, then (c is a leaf, no internals) X->c.
describe('assignCoordinates — sibling link is drawn after both endpoints (D7/T6)', () => {
  it("a, X, c: edge run is X's internals, a->X, X->c", () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    // D1 (mission `activity-loop-tile-port` T2): the while header is a
    // `GtileDiamondInside`, never a `GtileDiamond`.
    const header = new GtileDiamondInside('cond', {}, bounder, theme);
    const body = new GtileAction({ kind: 'action' as const, label: 'body' }, bounder, theme);
    const whileTile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const c = new GtileAction({ kind: 'action' as const, label: 'c' }, bounder, theme);
    const root = new GtileTopDown([a, whileTile, c], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    // node order is unaffected by D7 -- draws are node-then-its-own-edges
    // per compound; WITHIN the while's own internals, WORD (mission
    // add2-T3b, `FtileWhile.java:556-557`) draws `whileBlock` BEFORE
    // `diamond1`: a, body, header(+its own label, T3k: a `'while-header'`
    // polygon-only node plus a sibling `'if-own-label'` node, the header
    // carries a real label 'cond' so it is no longer one combined node), c.
    expect(geo.nodes).toHaveLength(5);
    expect(geo.nodes.map((n) => n.label)).toEqual(['a', 'body', 'cond', 'cond', 'c']);
    // altp-T4: In, Back, Out, Out2 (X's own internals) + a->X + X->c, SIX
    // pushes -- but T1b's `layout/snake-merge.ts` now fuses two pairs of
    // those end-to-start, down to 4 edges: `ConnectionOut`'s own two
    // snakes merge first (merge-case C), then that result's own last
    // point -- X's `SOUTH_HOOK` -- touches X->c's own first point (the
    // SAME sibling-edge-shares-a-hook mechanism the T1p-b vertical-if
    // residual test fixed, mirrored here on the EXIT side), so X->c
    // fuses into it too (`Snake#merge`, `Snake.java:303-327`).
    expect(geo.edges).toHaveLength(4);

    const aBottom = geo.nodes[0]!.y + geo.nodes[0]!.height;
    const cTop = geo.nodes[4]!.y;
    // X's own origin y === the header's y (`GtileWhile.headerOffsetY === 0`).
    // WORD (mission add2-T3b) moved the header to index 2 (body now 1).
    const xTop = geo.nodes[2]!.y;
    // Pre-compression upper bound (raw `whileTile.height`) -- compression
    // (T5, `compress-geometry.ts`) only ever REMOVES empty gaps, so a
    // compressed y can only be <= this raw estimate, never past it; used
    // below only as a `<=` ceiling, never as an exact expected value.
    const xBottomRaw = xTop + whileTile.height;

    // edges[0..1]: X's own In/Back -- every point stays strictly inside
    // X's own vertical span, never touching a leaf sibling (the exit
    // connector, formerly also in this range, now extends past it --
    // see edges[2] below).
    for (const edgeIndex of [0, 1]) {
      for (const p of geo.edges[edgeIndex]!.points) {
        expect(p.y).toBeGreaterThanOrEqual(xTop);
        expect(p.y).toBeLessThanOrEqual(xBottomRaw);
      }
    }

    // edges[2]: the fused Out+Out2+X->c -- starts inside X's own span
    // (the while-header's own exit, ABOVE the body -- the elbow routes
    // around it, not through `bodyBottom`) and ends at c's own entry.
    expect(geo.edges[2]!.points[0]!.y).toBeGreaterThanOrEqual(xTop);
    expect(geo.edges[2]!.points.some((p) => p.y === cTop)).toBe(true);
    expect(geo.edges[2]!.points[geo.edges[2]!.points.length - 1]!.y).toBe(cTop);

    // edges[3]: a -> X, pushed only AFTER X's own internals above.
    expect(geo.edges[3]!.points.some((p) => p.y === aBottom)).toBe(true);
    expect(geo.edges[3]!.points.every((p) => p.y <= xTop)).toBe(true);
  });

  it('leaves-only sequence (a, b, c) keeps identity walk order, unaffected by D7', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    const c = new GtileAction({ kind: 'action' as const, label: 'c' }, bounder, theme);
    const root = new GtileTopDown([a, b, c], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.nodes.map((n) => n.label)).toEqual(['a', 'b', 'c']);
    expect(geo.edges).toHaveLength(2);
    const aBottom = geo.nodes[0]!.y + geo.nodes[0]!.height;
    const bTop = geo.nodes[1]!.y;
    const bBottom = geo.nodes[1]!.y + geo.nodes[1]!.height;
    const cTop = geo.nodes[2]!.y;
    expect(geo.edges[0]!.points[0]).toEqual(expect.objectContaining({ y: aBottom }));
    expect(geo.edges[0]!.points[geo.edges[0]!.points.length - 1]).toEqual(expect.objectContaining({ y: bTop }));
    expect(geo.edges[1]!.points[0]).toEqual(expect.objectContaining({ y: bBottom }));
    expect(geo.edges[1]!.points[geo.edges[1]!.points.length - 1]).toEqual(expect.objectContaining({ y: cTop }));
  });
});

// T6b (`FtileAssemblySimple.java:124-141`, `FtileGeometryMerger.java:44-56`):
// siblings align on their own `left`, not the composite's centre.
describe('assignCoordinates — GtileTopDown aligns siblings on `left`, not centre (T6b)', () => {
  it("a leaf's centre x lands on a wider sibling's left; the link is one vertical segment", () => {
    // Stand-in for an `if` tile whose own `left` is 20px right of its
    // `width / 2` (`width: 100` -> centre 50, `left: 70`).
    const ifLike: Tile = {
      kind: 'stub-if',
      width: 100,
      height: 40,
      getCoord: (hook) =>
        hook === NORTH_HOOK ? { x: 70, y: 0 } : hook === SOUTH_HOOK ? { x: 70, y: 40 } : { x: 0, y: 20 },
      hasPointOut: () => true,
    };
    const start: Tile = {
      kind: 'stub-start',
      width: 30,
      height: 20,
      getCoord: (hook) =>
        hook === NORTH_HOOK ? { x: 15, y: 0 } : hook === SOUTH_HOOK ? { x: 15, y: 20 } : { x: 0, y: 10 },
      hasPointOut: () => true,
    };
    const root = new GtileTopDown([start, ifLike], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.nodes).toHaveLength(2);
    const startNode = geo.nodes[0]!;
    const ifNode = geo.nodes[1]!;
    // start's centre x (its own left, a leaf) lands on if's left.
    expect(startNode.x + startNode.width / 2).toBeCloseTo(ifNode.x + 70, 5);

    expect(geo.edges).toHaveLength(1);
    const xs = geo.edges[0]!.points.map((p) => p.x);
    // A single vertical segment: every waypoint shares one x.
    expect(new Set(xs.map((v) => Math.round(v * 1e6) / 1e6)).size).toBe(1);
  });
});

describe('assignCoordinates — GtileWhile produces back-edge', () => {
  const header = new GtileDiamondInside('loop?', {}, bounder, theme);
  const body = new GtileAction(actionNode, bounder, theme);
  const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
  const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

  it('produces at least 2 nodes (diamond + action)', () => {
    expect(geo.nodes.length).toBeGreaterThanOrEqual(2);
  });

  // altp-T4 (D7): ConnectionIn, ConnectionBackSimple, ConnectionOut (x2) --
  // this body has no `break`, so no welding edges. T1b: `ConnectionOut`'s
  // two snakes (`snake` LIMITED, `snake2` FULL) touch end-to-start at the
  // elbow and fuse into one (`Snake#merge`, `Snake.java:303-327`,
  // `connection-census.md` merge-case C) -- 3 edges now.
  it('produces exactly 3 edges (In, Back, merged Out)', () => {
    expect(geo.edges).toHaveLength(3);
  });

  it('back-edge has exactly 5 waypoints and is emphasized up (ConnectionBackSimple)', () => {
    const backEdge = geo.edges.find((e) => e.points.length === 5);
    expect(backEdge).toBeDefined();
    expect(backEdge!.emphasize).toBe('up');
  });

  it('the In edge has exactly 2 waypoints and no emphasize/arrowhead flags', () => {
    const inEdge = geo.edges.find((e) => e.points.length === 2 && e.emphasize === undefined);
    expect(inEdge).toBeDefined();
    expect(inEdge!.arrowhead).toBeUndefined();
  });

  it('exactly one edge is emphasized down (ConnectionOut, first snake)', () => {
    expect(geo.edges.filter((e) => e.emphasize === 'down')).toHaveLength(1);
  });

  // `ConnectionOut`'s BOTH snakes use the undecorated `Snake.create
  // (skinParam, color)` overload (`Snake.java:138-142`) -- neither has a
  // terminal arrowhead, and T1b's merge keeps it that way: `oneOf`
  // (`Snake.java:313`) falls back to the head's own `null` decoration
  // when the tail's is also `null`, so the fused edge still carries
  // `arrowhead: false`, just as ONE edge rather than two.
  it('exactly one edge carries arrowhead: false (the merged ConnectionOut)', () => {
    expect(geo.edges.filter((e) => e.arrowhead === false)).toHaveLength(1);
  });
});

describe('assignCoordinatesFull — GtileWhile emits a hexagon reservation', () => {
  const header = new GtileDiamondInside('loop?', {}, bounder, theme);
  const body = new GtileAction(actionNode, bounder, theme);
  const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
  const full = assignCoordinatesFull({
    root: tile,
    ast: emptyAst,
    baseX: LAYOUT_MARGIN,
    baseY: LAYOUT_MARGIN,
    bounder,
    theme,
  });

  it('emits exactly one reservation (FtileWhile.java:264,272)', () => {
    expect(full.reservations).toHaveLength(1);
  });

  it('reservation is 5 wide x 12 tall (Hexagon.hexagonHalfSize)', () => {
    expect(full.reservations[0]).toMatchObject({ width: 5, height: 12 });
  });

  it('sits at the body south exit x, y = body bottom + 12', () => {
    const bodyNode = full.geometry.nodes.find((n) => n.kind === 'action')!;
    // GtileAction's SOUTH_HOOK is { x: width / 2, y: height } -- the exit
    // point IS the box's own bottom, so `Math.max(y1, getBottom())` in
    // `FtileWhile.java:264` reduces to `getBottom()` here.
    const backFromX = bodyNode.x + bodyNode.width / 2;
    const expectedY = bodyNode.y + bodyNode.height + 12;
    expect(full.reservations[0]!.x).toBeCloseTo(backFromX, 5);
    // T5 (compress): between the body's own bottom and this reservation's
    // raw `y1bis` sits an empty 12px gap (the back-edge is a `ULine`, D1,
    // and never occupies) -- `SlotSet#smaller(5)`
    // (`CompressionXorYBuilder.java:56`) removes `12 - 2*5 = 2` from it, so
    // the reservation (a translate-only `UEmpty`, not `isRectReservation`)
    // shifts up by that 2. Verified against `t5-debug-fork.ts`'s GtileWhile
    // dump: `removed: { x: 0, y: 2 }`.
    expect(full.reservations[0]!.y).toBeCloseTo(expectedY - 2, 5);
  });
});

// altp-T4 (D7): a truly empty body (`dim.getWidth() == 0 || dim.getHeight()
// == 0`) gets ONLY `ConnectionBackEmpty` -- no `ConnectionIn` is added at
// all (`FtileWhile.java:148-168,150`).
describe('assignCoordinates — GtileWhile with an empty body draws ConnectionBackEmpty', () => {
  it('emits exactly 2 edges (BackEmpty, merged Out), no ConnectionIn', () => {
    const header = new GtileDiamondInside('loop?', {}, bounder, theme);
    const body = new GtileTopDown([], bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    // T1b: `ConnectionOut`'s two snakes fuse (merge-case C) -- 2 edges.
    expect(geo.edges).toHaveLength(2);
    const backEdge = geo.edges.find((e) => e.points.length === 5)!;
    expect(backEdge).toBeDefined();
    expect(backEdge.emphasize).toBe('up');
    // `ConnectionBackEmpty`'s own p1 is the HEADER's south exit
    // (`FtileWhile.java:418-420`), not the (nonexistent) body's.
    const headerNode = geo.nodes.find((n) => n.kind === 'while-header')!;
    expect(backEdge.points[0]).toEqual({ x: headerNode.x + headerNode.width / 2, y: headerNode.y + headerNode.height });
  });

  it('still reserves one 5x12 UEmpty beside the elbow (FtileWhile.java:459)', () => {
    const header = new GtileDiamondInside('loop?', {}, bounder, theme);
    const body = new GtileTopDown([], bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });

    expect(full.reservations).toHaveLength(1);
    expect(full.reservations[0]).toMatchObject({ width: 5, height: 12 });
  });
});

// altp-T4 fix: the `while-header` polygon is the hexagon ALONE.
// `FtileDiamondInside#drawU` draws `Hexagon.asPolygon(dimTotal)` with
// `dimTotal = calculateDimensionAlone` (`FtileDiamondInside.java:87-89`);
// the tile's `height` is `calculateDimensionFtile`'s, which adds the north
// label BELOW the hexagon (`:119-124`). Found on `cemagu-66-vazo965`: a
// 35 px polygon where the jar draws 24 px, the `yes` label overlapping it.
describe('assignCoordinates — the while-header polygon is the hexagon-alone height', () => {
  it('uses the alone height, not the tile height that includes the north label', () => {
    const header = new GtileDiamondInside('loop?', { north: 'yes', west: 'no' }, bounder, theme);
    const body = new GtileTopDown([new GtileAction({ kind: 'action', label: 'a' }, bounder, theme)], bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const headerNode = geo.nodes.find((n) => n.kind === 'while-header')!;
    const aloneHeight = header.getCoord(SOUTH_HOOK).y;
    expect(header.height).toBeGreaterThan(aloneHeight);
    expect(headerNode.height).toBe(aloneHeight);
    // The north label sits at the hexagon's own bottom edge (`:91`).
    const northLabel = geo.nodes.find((n) => n.kind === 'if-label' && n.label === 'yes')!;
    expect(northLabel.y).toBeCloseTo(headerNode.y + aloneHeight, 9);
  });
});

// `ConnectionBackSimple#drawU` returns early -- drawing nothing, not even
// the reservation -- when `whileBlock.hasPointOut() === false`
// (`FtileWhile.java:229-232`), e.g. a body ending in `stop`.
describe('assignCoordinates — GtileWhile with a body that has no point out (ends in stop)', () => {
  it('draws ConnectionIn but no back edge and no reservation', () => {
    const header = new GtileDiamondInside('loop?', {}, bounder, theme);
    // A lone `GtileStop` body (not wrapped in a `GtileTopDown` sequence) so
    // the only edges below are the while's own -- a wrapped sequence would
    // also add its own internal sibling edge, unrelated to this assertion.
    const body = new GtileStop();
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });

    // In, merged Out (T1b: Out+Out2 fuse, merge-case C) -- no Back, so no
    // 5-point edge and no reservation.
    expect(full.geometry.edges).toHaveLength(2);
    expect(full.geometry.edges.some((e) => e.points.length === 5)).toBe(false);
    expect(full.reservations).toHaveLength(0);
  });
});

// D3/D7: a `break` welds LAST, after In/Back/Out/Out2 -- a plain terminal
// arrow (`asToLeft`), no `emphasize`/`arrowhead` override.
// @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorWhile.java:101-116
describe('assignCoordinates — GtileWhile welds a break, emitted LAST (D3/D7)', () => {
  it('draw order is In, Back, Out, Out2, then one welding edge per break', () => {
    const header = new GtileDiamondInside('loop?', {}, bounder, theme);
    const action1 = new GtileAction(actionNode, bounder, theme);
    const brk = new GtileBreak();
    const action2 = new GtileAction({ kind: 'action' as const, label: 'after', swimlane: 'default' }, bounder, theme);
    const body = new GtileTopDown([action1, brk, action2], bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    // action1->brk (the body's OWN internal sibling edge, pushed while
    // walking the body, before the while's own connections). brk->action2
    // is NOT drawn: `GtileBreak.hasPointOut()` is `false`
    // (`FtileBreak.java:63`, `calculateDimensionEmpty().withoutPointOut()`)
    // -- a break has no fall-through, so the gtile-top-down sibling edge
    // gate (T3b, `FtileFactoryDelegatorAssembly.java:67-70`) skips it. Then
    // In, Back (action2 still has a point out), Out, Out2, then the weld
    // LAST -- 6 pushes. T1b's merge engine fuses TWO pairs of those,
    // both FULL by default: `ConnectionOut`'s own two snakes (merge-case
    // C), AND -- since `action1->brk`'s own target IS the weld's own
    // source (both land on the break node's entry point) -- the weld
    // fuses BACKWARD into the EARLIER-pending sibling edge
    // (`Snake#merge`, `Snake.java:303-327`; the pending slot a later
    // snake merges into never moves, `UGraphicForSnake.java:146-156`).
    // 4 edges: [action1->brk+weld fused], In, Back, merged Out.
    expect(geo.edges).toHaveLength(4);
    const breakNode = geo.nodes.find((n) => n.kind === 'break')!;
    const weld = geo.edges[0]!;
    // T1a (D2): the weld's own target x sits on the while's own exit
    // column, which was this composite's ink minimum under T1a alone --
    // `NO_FUDGE_ORIGIN` (15).
    //
    // T2e (`canvas-origin.ts#extendForEdge`): the while's OWN entry
    // connector (`arrowhead: false`, `emphasize: 'down'`) draws its
    // emphasis arrowhead at the midpoint of its first DOWN segment, which
    // sits on this SAME exit column. A down decoration's own `minX` is
    // `-4` (`arrows-regular.ts#arrowHeadPoints('down')`), so `LimitFinder`
    // records `tipX - 4 - 10 = tipX - 14` (`HACK_X_FOR_POLYGON`,
    // `LimitFinder.java:169-176`) -- 14px lower than the exit column's own
    // exact point, which was the previous ink minimum. The arrowhead now
    // sets the global min instead, shifting the whole composite by `+14`
    // (confirmed with `computeCanvasOrigin` called directly on this exact
    // fixture's compressed geometry: shiftX moved `-9 -> 5`).
    const WHILE_ENTRY_ARROWHEAD_SHIFT = 14;
    // Only the fused edge's own LAST two points are the weld's own shape
    // (`removeRedondantDirection` does not collapse the corner at the
    // break's own entry point, since the sibling edge arrives from ABOVE
    // and the weld departs to the LEFT -- a real corner, not a straight
    // run).
    expect(weld.points.slice(-2)).toEqual([
      { x: breakNode.x, y: breakNode.y },
      { x: NO_FUDGE_ORIGIN + WHILE_ENTRY_ARROWHEAD_SHIFT, y: breakNode.y },
    ]);
    // `emphasize`/`arrowhead` resolve to the sibling edge's own (head)
    // values, since the weld (tail) carries neither override --
    // unchanged from the weld's own pre-merge expectation.
    expect(weld.emphasize).toBeUndefined();
    expect(weld.arrowhead).toBeUndefined();
  });
});

// T3i (row WELD, `jupivo-67-gidi531`): `InstructionFork.createFtile`
// (`InstructionFork.java:122-130`) never calls or forwards a branch's
// `getWeldingPoints()`, and the fork's own Ftile (`FtileForkInner`/
// `FtileForkInnerOverlapped`, both `extends AbstractFtile` with no
// override) falls back to `AbstractFtile.java:100-102`'s empty-list
// default -- so a `break` inside a fork branch gets NO welding edge,
// unlike the same-body-level break the previous `describe` block covers.
describe('assignCoordinates — GtileWhile does NOT weld a break inside a fork branch', () => {
  it('each break only gets its fork branch in-edge, no weld to the elbow', () => {
    const header = new GtileDiamondInside('loop?', {}, bounder, theme);
    const brk1 = new GtileBreak();
    const brk2 = new GtileBreak();
    const body = new GtileFork([brk1, brk2], bounder);
    const tile = new GtileWhile(header, body, { bounder, theme });
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const breakNodes = geo.nodes.filter((n) => n.kind === 'break');
    expect(breakNodes).toHaveLength(2);

    // A weld departs from the break's own point horizontally toward the
    // while's exit column (`pushEdge(out, [{x: brk.x, y: brk.y}, {x:
    // elbowX, y: brk.y}], ...)`). T1b's merge engine fuses that weld
    // BACKWARD into the fork branch's own pending in-edge (same
    // mechanism the non-fork weld test above documents), so a present
    // weld would NOT show up as its own 2-point edge here -- it would
    // extend the in-edge's point list past the break's own location.
    // Checking every edge's LAST point (not just 2-point edges) catches
    // both the fused and unfused shapes.
    for (const brk of breakNodes) {
      const touching = geo.edges.filter((e) => e.points.some((p) => p.x === brk.x && p.y === brk.y));
      expect(touching.length).toBeGreaterThan(0);
      for (const e of touching) {
        expect(e.points.at(-1)).toEqual({ x: brk.x, y: brk.y });
      }
    }

    // 2 fork branch-in edges (one per break, `hasPointOut()` is `false`
    // so neither gets an out-edge) + the while's own header-entry, out,
    // and back edges -- 5 total, 0 welds (verified against a live run of
    // this exact fixture before writing this assertion).
    expect(geo.edges).toHaveLength(5);
  });
});

describe('assignCoordinatesFull — swimlane title band is an ignoreX/ignoreY reservation', () => {
  it('adds the band as a reservation matching computeSwimlaneChrome exactly', () => {
    const tile = new GtileAction(actionNode, bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['Lane A', 'Lane B'] };
    const full = assignCoordinatesFull({ root: tile, ast, baseX: LAYOUT_MARGIN, baseY: LAYOUT_MARGIN, bounder, theme });
    const band = full.geometry.swimlaneBand!;
    expect(band).toBeDefined();
    const bandReservation = full.reservations.find((r) => r.ignoreX === true && r.ignoreY === true);
    expect(bandReservation).toEqual({ ...band, ignoreX: true, ignoreY: true });
  });

  it('a single lane draws no band and reserves nothing for it', () => {
    const tile = new GtileAction(actionNode, bounder, theme);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });
    expect(full.reservations.some((r) => r.ignoreX === true && r.ignoreY === true)).toBe(false);
  });
});

describe('assignCoordinatesFull — no reservations for a plain action', () => {
  it('emits an empty reservations array', () => {
    const tile = new GtileAction(actionNode, bounder, theme);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });
    expect(full.reservations).toEqual([]);
  });
});

describe('assignCoordinates — swimlane geometry', () => {
  const tile = new GtileAction(actionNode, bounder, theme);
  const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['Lane A', 'Lane B'] };
  const geo = assignCoordinates(tile, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

  it('emits 2 swimlane geos', () => {
    expect(geo.swimlanes).toHaveLength(2);
  });

  it('first swimlane name is Lane A', () => {
    expect(geo.swimlanes[0]!.name).toBe('Lane A');
  });

  it('second swimlane name is Lane B', () => {
    expect(geo.swimlanes[1]!.name).toBe('Lane B');
  });
});

describe('assignCoordinates — nodes are placed inside their own lane', () => {
  function place(labelA: string, labelB: string) {
    const a = new GtileAction({ kind: 'action' as const, label: labelA }, bounder, theme);
    a.swimlane = 'A';
    const b = new GtileAction({ kind: 'action' as const, label: labelB }, bounder, theme);
    b.swimlane = 'BBBBBBBBBBBBBBBBBBBBBBBBB';
    const root = new GtileTopDown([a, b], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'BBBBBBBBBBBBBBBBBBBBBBBBB'] };
    return assignCoordinates(root, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);
  }

  it("node 'a' sits inside lane A's bounds", () => {
    const geo = place('a', 'b');
    const laneA = geo.swimlanes[0]!;
    const nodeA = geo.nodes.find((n) => n.label === 'a')!;
    expect(nodeA.x).toBeGreaterThanOrEqual(laneA.x);
    expect(nodeA.x + nodeA.width).toBeLessThanOrEqual(laneA.x + laneA.width);
  });

  it("node 'b' sits STRICTLY inside lane B's bounds, not on its boundary", () => {
    const geo = place('a', 'b');
    const laneB = geo.swimlanes[1]!;
    const nodeB = geo.nodes.find((n) => n.label === 'b')!;
    expect(nodeB.x).toBeGreaterThan(laneB.x);
    expect(nodeB.x + nodeB.width).toBeLessThan(laneB.x + laneB.width);
  });

  it('lane B starts exactly where lane A ends (adjacent, no gap or overlap)', () => {
    const geo = place('a', 'b');
    expect(geo.swimlanes[1]!.x).toBe(geo.swimlanes[0]!.x + geo.swimlanes[0]!.width);
  });
});

describe('assignCoordinates — a group frame draws once per touched lane (T3h)', () => {
  it('a group whose body touches two lanes produces two same-sized frame nodes', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    b.swimlane = 'B';
    const body = new GtileTopDown([a, b], bounder, theme);
    const group = new GtileGroup('G', body, bounder, theme);
    const root = new GtileTopDown([group], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
    const geo = assignCoordinates(root, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const frames = geo.nodes.filter((n) => n.kind === 'group');
    expect(frames).toHaveLength(2);
    expect(frames[0]!.width).toBe(frames[1]!.width);
    expect(frames[0]!.height).toBe(frames[1]!.height);
    expect(new Set(frames.map((f) => f.swimlane))).toEqual(new Set(['A', 'B']));
  });

  it('a group whose body stays in one lane still produces exactly one frame node', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const group = new GtileGroup('G', a, bounder, theme);
    const root = new GtileTopDown([group], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A'] };
    const geo = assignCoordinates(root, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const frames = geo.nodes.filter((n) => n.kind === 'group');
    expect(frames).toHaveLength(1);
  });

  it('a group in a diagram with no swimlanes renders one untagged frame (pre-T3h behavior)', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    const group = new GtileGroup('G', a, bounder, theme);
    const root = new GtileTopDown([group], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const frames = geo.nodes.filter((n) => n.kind === 'group');
    expect(frames).toHaveLength(1);
    expect(frames[0]!.swimlane).toBeUndefined();
  });
});

describe('assignCoordinates — cross-lane vs same-lane edge shape', () => {
  it('an edge between two nodes in DIFFERENT lanes gets a 4-point horizontal jog', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    b.swimlane = 'B';
    const root = new GtileTopDown([a, b], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
    const geo = assignCoordinates(root, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.edges).toHaveLength(1);
    const points = geo.edges[0]!.points;
    expect(points.length).toBeGreaterThanOrEqual(3);
    expect(points).toHaveLength(4);
    expect(points[1]!.y).toBe(points[2]!.y);
  });

  it('an edge between two nodes in the SAME lane keeps its pass-1 shape (shifted only)', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const a2 = new GtileAction({ kind: 'action' as const, label: 'a2' }, bounder, theme);
    a2.swimlane = 'A';
    const root = new GtileTopDown([a, a2], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
    const geo = assignCoordinates(root, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.edges).toHaveLength(1);
    expect(geo.edges[0]!.points).toHaveLength(2);
  });
});

describe('assignCoordinates — no swimlanes leaves geometry byte-identical', () => {
  it('the same tile tree produces the same node positions with and without lanes declared', () => {
    const build = () => {
      const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
      const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
      return new GtileTopDown([a, b], bounder, theme);
    };
    const withoutLanes = assignCoordinates(
      build(),
      { nodes: [], swimlanes: [] },
      { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN },
      bounder,
      theme,
    );
    const withEmptyAst = assignCoordinates(build(), emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);
    expect(withoutLanes.nodes).toEqual(withEmptyAst.nodes);
    expect(withoutLanes.edges).toEqual(withEmptyAst.edges);
    expect(withoutLanes.swimlanes).toEqual([]);
  });
});

describe('layoutActivity — pakema-21-xema183-shaped diagram through the real pipeline', () => {
  function layout(markup: string) {
    const first = buildBlockUmls(markup)[0];
    if (first === undefined) throw new Error('no diagram block');
    if (!first.ok) throw first.failure.cause;
    const ast = astOrThrow(parseActivity(first.source), 'activity');
    return layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());
  }

  it("'b' lands strictly inside lane B, not on its boundary", () => {
    const geo = layout('@startuml\n|A|\nstart\n:a;\n|BBBBBBBBBBBBBBBBBBBBBBBBB|\n:b;\n@enduml');
    const laneB = geo.swimlanes[1]!;
    const nodeB = geo.nodes.find((n) => n.label === 'b')!;
    expect(nodeB.x).toBeGreaterThan(laneB.x);
    expect(nodeB.x + nodeB.width).toBeLessThan(laneB.x + laneB.width);
  });
});

// mission `activity-loop-tile-port` T2 fix (coordinator-reported
// regression): `pushRepeatCondition`/`pushWhileHeader` push the condition/
// header node directly, bypassing `walkTile`'s own `laneAt(tile, lane)`
// resolution (`walkTile`'s own dispatch, `:117-118` in this file) that a
// tile's OWN `.swimlane` normally gets. A laned repeat whose body switches
// lane before `repeat while` sets the condition's own lane to the OUT lane
// (`tileRepeat`'s `outLane(node.swimlaneOut, node.swimlane)`,
// `FtileRepeat.java:149,152`) -- distinct from the repeat tile's own
// (entry) lane, which is what `myLane` resolves to at the 'gtile-repeat'
// case. Without re-resolving via `laneAt`, the condition (and its labels)
// silently inherited the entry lane instead, moving the hexagon into the
// wrong lane's x-range (observed on `kudedo-31-pafi082`/`kasadu-53-tuki533`).
describe('layoutActivity — a laned repeat keeps the condition hexagon in its OWN (out) lane', () => {
  function layout(markup: string) {
    const first = buildBlockUmls(markup)[0];
    if (first === undefined) throw new Error('no diagram block');
    if (!first.ok) throw first.failure.cause;
    const ast = astOrThrow(parseActivity(first.source), 'activity');
    return layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());
  }

  it("repeat-cond and its side label carry the OUT lane, not the repeat's own entry lane", () => {
    const geo = layout('@startuml\n|A|\nrepeat\n|B|\n:b;\nrepeat while (x) is (y)\n@enduml');
    // T3k: the condition's polygon node (`'repeat-cond'`, now polygon
    // only -- the own label draws through a sibling `'if-own-label'`).
    const cond = geo.nodes.find((n) => n.kind === 'repeat-cond')!;
    expect(cond.swimlane).toBe('B');
    const label = geo.nodes.find((n) => n.kind === 'if-label')!;
    expect(label.swimlane).toBe('B');
  });

  // `tile-layout.ts#tileWhile` never calls `withSwimlane` on the header
  // (only the outer `GtileWhile` gets one), so a while header has no lane
  // of its own to diverge from the parent's -- there is no while-side
  // regression to reproduce; `pushWhileHeader`'s `laneAt` call is defensive
  // parity only (see that function's own doc).
});

// D2 / `Worm#addPoint` (`Worm.java:262-266`): the one edge-construction
// seam every `pushEdge` call passes through drops a point that equals its
// immediate predecessor under exact `===` on both coordinates -- no
// tolerance, so points one ulp apart both survive.
describe('dedupeAdjacentPoints — Worm#addPoint exact-equality collapse (D2)', () => {
  it('drops a point that exactly repeats its predecessor: [p, p, q] -> [p, q]', () => {
    const p = { x: 10, y: 20 };
    const q = { x: 10, y: 40 };
    expect(dedupeAdjacentPoints([p, p, q])).toEqual([p, q]);
  });

  it('keeps two points one ulp apart', () => {
    // `Number.EPSILON` (~2.22e-16) is the gap between 1 and its next
    // representable double -- adding it to 10 rounds back to 10 (the gap
    // there is larger), so the nudge must be applied near 1, not 10.
    const p = { x: 1, y: 20 };
    const pNudged = { x: 1 + Number.EPSILON, y: 20 };
    expect(pNudged.x).not.toBe(p.x);
    expect(dedupeAdjacentPoints([p, pNudged])).toEqual([p, pNudged]);
  });

  it('keeps a non-adjacent repeat (only ADJACENT duplicates collapse)', () => {
    const p = { x: 10, y: 20 };
    const q = { x: 30, y: 40 };
    expect(dedupeAdjacentPoints([p, q, p])).toEqual([p, q, p]);
  });

  it('passes an empty array through unchanged', () => {
    expect(dedupeAdjacentPoints([])).toEqual([]);
  });
});

// D1: `ParallelBuilderSplit.ConnectionIn#drawU` (`:194-203`) and
// `ParallelBuilderFork.ConnectionIn#drawU` (`:151-163`) draw a straight
// vertical drop at the BRANCH's own x, not the bar's centre; `ConnectionOut
// #drawU` (`ParallelBuilderSplit.java:246-261`, `ParallelBuilderFork.java
// :202-216`) is gated on `geo.hasPointOut()`.
describe('assignCoordinates — fork/split branch connectors are vertical drops at the branch x (D1)', () => {
  const bounder: StringBounder = { getDimension: () => ({ width: 60, height: 16 }) };
  const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

  // North/south hooks intentionally off-centre (not width/2) so a test
  // asserting on the LITERAL branch-x, not an accidental bar-centre
  // coincidence, actually distinguishes the two.
  function branchStub(width: number, height: number, hasOut: boolean): Tile {
    return {
      kind: 'stub-branch',
      width,
      height,
      getCoord: (hook) => (hook === NORTH_HOOK ? { x: 7, y: 0 } : { x: 11, y: height }),
      hasPointOut: () => hasOut,
    };
  }

  it('a continuing branch gets a 2-point in-edge at its own north x and a 2-point out-edge to the join bar', () => {
    const branch = branchStub(80, 60, true);
    const tile = new GtileFork([branch], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.edges).toHaveLength(2);
    const [inEdge, outEdge] = geo.edges;
    // T1a (D2): `GtileFork`'s own `fork-bar` is the composite's leftmost AND
    // topmost element (a real `URectangle`, `RECT_FUDGE`) -- `RECT_ORIGIN`
    // replaces `LAYOUT_MARGIN` as the absolute base both axes share.
    const bX = RECT_ORIGIN + tile.branchOffsets[0]!;
    const bY = RECT_ORIGIN + tile.branchTopYs[0]!;
    // T5 (compress): the bar's own ignoreX end-reservation
    // (`URectangle#drawWhenCompressed`'s `UEmpty(2,h)`,
    // `klimt/shape/URectangle.java:193-199`) is a raw slot `[12,14]`; the
    // branch's own box starts at 26 pre-compression, leaving a `[14,26]`
    // 12px empty gap `SlotSet#smaller(5)` (`CompressionXorYBuilder.java
    // :56`) shrinks to 2. Every x at or past the branch box but before the
    // bar's SECOND end-reservation gap (`[106,118]`) shifts left by that 2
    // -- including this branch's own hook connectors, both below 106.
    // Verified against `t5-debug-fork.ts`'s single-branch-fork dump
    // (`removed: { x: 4, y: 0 }`, one gap each side of the branch box).
    const REMOVED_LEADING = 2;

    expect(inEdge!.points).toHaveLength(2);
    expect(inEdge!.points[0]).toEqual({ x: bX + 7 - REMOVED_LEADING, y: RECT_ORIGIN + tile.barHeight });
    expect(inEdge!.points[1]).toEqual({ x: bX + 7 - REMOVED_LEADING, y: bY });

    const joinBarY = RECT_ORIGIN + tile.height - tile.barHeight;
    expect(outEdge!.points).toHaveLength(2);
    expect(outEdge!.points[0]).toEqual({ x: bX + 11 - REMOVED_LEADING, y: bY + 60 });
    expect(outEdge!.points[1]).toEqual({ x: bX + 11 - REMOVED_LEADING, y: joinBarY });
  });

  it('a detached branch (hasPointOut() === false) gets an in-edge and NO out-edge', () => {
    const branch = branchStub(80, 60, false);
    const tile = new GtileSplit([branch], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.edges).toHaveLength(1);
    expect(geo.edges[0]!.points).toHaveLength(2);
  });

  it('two branches: the continuing one gets an out-edge, the detached one does not', () => {
    const continuing = branchStub(80, 60, true);
    const detached = branchStub(80, 80, false);
    const tile = new GtileFork([continuing, detached], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    // 2 in-edges + 1 out-edge (continuing branch only)
    expect(geo.edges).toHaveLength(3);
    const twoPointEdges = geo.edges.filter((e) => e.points.length === 2);
    expect(twoPointEdges).toHaveLength(3);
  });
});

// D4 (+ T0's clamp observation): fork draws an unconditional rect
// top/bottom; split draws a `first..last` thin LINE, clamped to the
// composite's own centre x, and the join line is entirely absent when no
// branch continues.
describe('assignCoordinates — fork/split bar and split-line geometry (D4)', () => {
  const bounder: StringBounder = { getDimension: () => ({ width: 60, height: 16 }) };
  const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

  // North hook x=7, south hook x=11 for every branch -- off-centre so a
  // span computed from the hook actually differs from a bar-centre guess.
  function branchStub(width: number, height: number, hasOut: boolean, swimlane?: string): Tile {
    return {
      kind: 'stub-branch',
      width,
      height,
      ...(swimlane !== undefined ? { swimlane } : {}),
      getCoord: (hook) => (hook === NORTH_HOOK ? { x: 7, y: 0 } : { x: 11, y: height }),
      hasPointOut: () => hasOut,
    };
  }

  it('fork emits fork-bar then every branch then join-bar, both full barWidth, even when every branch is detached', () => {
    const tile = new GtileFork([branchStub(80, 60, false), branchStub(80, 80, false)], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.nodes.map((n) => n.kind)).toEqual(['fork-bar', 'stub-branch', 'stub-branch', 'join-bar']);
    const forkBar = geo.nodes[0]!;
    const joinBar = geo.nodes[3]!;
    // T5 (compress), X: two raw gaps between the bar's ignoreX end-
    // reservations and the two branch boxes (`[12,14]`-to-26 and 106-to-
    // `[214,216]`, `URectangle#drawWhenCompressed`, `klimt/shape/
    // URectangle.java:193-199`) each shrink from 12 to 2 (`smaller(5)`,
    // `CompressionXorYBuilder.java:56`); the one inter-branch gap
    // (`[106,134]`, `AbstractParallelFtilesBuilder.java:129-131`'s
    // `xMargin=14` doubled to 28) shrinks to 18. Removed = 2+18+2 = 22.
    // T5 (compress), Y: the branch-region-to-join-bar raw gap is 20
    // (`[118,138]`), shrinking to 10; the fork-bar-to-branch-region gap is
    // exactly 10 and vanishes entirely (`10 - 2*5 = 0`). Verified against
    // `t5-debug-fork2.ts`'s dump (`removed: { x: 22, y: 10 }`).
    const REMOVED_X = 22;
    const REMOVED_Y = 10;
    expect(forkBar.width).toBe(tile.barWidth - REMOVED_X);
    expect(forkBar.height).toBe(tile.barHeight);
    expect(joinBar.width).toBe(tile.barWidth - REMOVED_X);
    // T1a (D2): the fork-bar spans the FULL composite width/height from its
    // own local (0, 0) -- it is the ink minimum on both axes (`RECT_FUDGE`),
    // same as the single-branch fork test above.
    expect(joinBar.y).toBe(RECT_ORIGIN + tile.height - tile.barHeight - REMOVED_Y);
  });

  it('split top line spans the first..last branch north-hook x over EVERY branch, unconditional', () => {
    const b0 = branchStub(80, 60, true);
    const b1 = branchStub(80, 60, true);
    const b2 = branchStub(80, 60, true);
    const tile = new GtileSplit([b0, b1, b2], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const splitBar = geo.nodes.find((n) => n.kind === 'split-bar')!;
    const first = SPLIT_BRANCH_ORIGIN + tile.branchOffsets[0]! + 7;
    const last = SPLIT_BRANCH_ORIGIN + tile.branchOffsets[2]! + 7;
    // T5 (compress): `split-bar` is a `ULine` (T3: `FtileThinSplit.java
    // :87-96`), so it never occupies (`NO_SHAPE_KINDS`, `shapes-of.ts`) --
    // but it IS transformed like any other node (`RECT_WIDTH_KINDS`). Its
    // own `x` (33) sits before both inter-branch gaps, so it is unmoved;
    // its far edge (`x + width`) sits past both. Two 28px inter-branch
    // gaps (`AbstractParallelFtilesBuilder.java:129-131`'s `xMargin=14`
    // doubled) each shrink to 18 (`smaller(5)`, `CompressionXorYBuilder
    // .java:56`) -- removed = 18+18 = 36. Verified against
    // `t5-debug-fork.ts`'s 3-branch-split dump (`removed: { x: 36, y: 0 }`).
    const REMOVED = 36;
    expect(splitBar.x).toBe(first);
    expect(splitBar.width).toBeCloseTo(last - first - REMOVED, 9);
    expect(splitBar.height).toBe(tile.barHeight);
  });

  it('split join line spans only the continuing branch, clamped to the centre x on the near side (simuti shape)', () => {
    const b0 = branchStub(80, 60, false);
    const b1 = branchStub(80, 60, false);
    const b2 = branchStub(80, 60, true);
    const tile = new GtileSplit([b0, b1, b2], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const joinLine = geo.nodes.find((n) => n.kind === 'split-join-bar')!;
    const centreX = SPLIT_BRANCH_ORIGIN + tile.width / 2;
    const b2South = SPLIT_BRANCH_ORIGIN + tile.branchOffsets[2]! + 11;
    // The only continuing branch's x is on the far side of centre, so the
    // NEAR end clamps to centreX (ParallelBuilderSplit.java:171-176) --
    // the line still reaches the composite's own centre, not just b2's x.
    //
    // T5 (compress): same two 28px inter-branch gaps as the split-bar test
    // above (`AbstractParallelFtilesBuilder.java:129-131`, each shrinking
    // to 18 under `smaller(5)`, `CompressionXorYBuilder.java:56`).
    // `centreX` (174, pre-compression) sits AFTER the first gap only
    // (`[106,134]`) and before the second (`[214,242]`), so it shifts left
    // by 18; `b2South` (253, pre-compression) sits past BOTH, shifting by
    // 36. Verified against `t5-debug-fork.ts`'s 1-continuing-of-3 split
    // dump (`removed: { x: 36, y: 0 }`, `split-join-bar` 174→156, 79→61).
    const REMOVED_NEAR = 18;
    const REMOVED_FAR = 36;
    expect(joinLine.x).toBe(centreX - REMOVED_NEAR);
    expect(joinLine.x + joinLine.width).toBeCloseTo(b2South - REMOVED_FAR, 9);
  });

  it('split with every branch detached emits no split-join-bar node and no out-edges', () => {
    const tile = new GtileSplit([branchStub(80, 60, false), branchStub(80, 60, false)], bounder);
    const geo = assignCoordinates(tile, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.nodes.some((n) => n.kind === 'split-join-bar')).toBe(false);
    expect(geo.nodes.map((n) => n.kind)).toEqual(['split-bar', 'stub-branch', 'stub-branch']);
    expect(geo.edges).toHaveLength(2); // 2 in-edges, 0 out-edges
  });

  it('split-bar sits in the FIRST branch lane; split-join-bar sits in the LAST branch lane', () => {
    const b0 = branchStub(80, 60, true, 'LaneA');
    const b1 = branchStub(80, 60, true, 'LaneB');
    const tile = new GtileSplit([b0, b1], bounder);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['LaneA', 'LaneB'] };
    const geo = assignCoordinates(tile, ast, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    const splitBar = geo.nodes.find((n) => n.kind === 'split-bar')!;
    const joinLine = geo.nodes.find((n) => n.kind === 'split-join-bar')!;
    expect(splitBar.swimlane).toBe('LaneA');
    expect(joinLine.swimlane).toBe('LaneB');
  });
});

// T3b (`FtileFactoryDelegatorAssembly.java:67-70`): the gtile-top-down
// sibling edge is skipped when the PRECEDING child has no out point --
// mirrors the fork/split/while/repeat walkers, which already gate their
// own sibling edges on `hasPointOut()` (see the `fork/split branch
// connectors` describe block above).
describe('assignCoordinates — gtile-top-down sibling edge gated on hasPointOut() (T3b)', () => {
  function deadEndStub(label: string): Tile {
    return {
      kind: 'stub-dead-end',
      width: 40,
      height: 20,
      getCoord: (hook) => (hook === NORTH_HOOK ? { x: 20, y: 0 } : { x: 20, y: 20 }),
      hasPointOut: () => false,
      swimlane: label,
    };
  }

  it('a dead-ended first child gets no out-edge into its sibling', () => {
    const dead = deadEndStub('dead');
    const next = new GtileAction({ kind: 'action' as const, label: 'after' }, bounder, theme);
    const root = new GtileTopDown([dead, next], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.nodes).toHaveLength(2);
    expect(geo.edges).toHaveLength(0);
  });

  it('a, dead, c: only a->dead is drawn (dead->c is gated out)', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    const dead = deadEndStub('dead');
    const c = new GtileAction({ kind: 'action' as const, label: 'c' }, bounder, theme);
    const root = new GtileTopDown([a, dead, c], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.nodes).toHaveLength(3);
    expect(geo.edges).toHaveLength(1);
    const aBottom = geo.nodes[0]!.y + geo.nodes[0]!.height;
    expect(geo.edges[0]!.points[0]).toEqual(expect.objectContaining({ y: aBottom }));
  });

  it('a live first child still gets its out-edge (control: gate does not over-fire)', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    const root = new GtileTopDown([a, b], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, { x: LAYOUT_MARGIN, y: LAYOUT_MARGIN }, bounder, theme);

    expect(geo.edges).toHaveLength(1);
  });
});

// T3k companion fix: `walkTile`'s `'gtile-diamond'` case (the switch
// condition diamond, `kindHint: 'if-split'`) now pushes a sibling
// `'if-own-label'` node after its polygon -- `renderNode`'s own
// `'if-split'` case started drawing the polygon ALONE for every labelled
// `'if-split'` producer (`activity-renderer-shapes.ts`'s own doc), and
// `GtileSwitch`'s condition is the one OTHER `'if-split'` producer besides
// `walk-if-down.ts`/`walk-if-with-links.ts`/`walk-if-long-horizontal.ts`
// (`tile-layout.ts:321`, `GtileDiamond`, never a `GtileDiamondInside`).
describe('layoutActivity — switch condition keeps its own label (T3k companion fix)', () => {
  it('nodes read if-split (polygon), if-own-label(test), case1, case2, if-merge, in drawU order', () => {
    const ast: ActivityDiagramAST = {
      nodes: [
        {
          kind: 'switch',
          condition: 'test',
          cases: [
            { label: 'v1', body: [{ kind: 'action', label: 'case1' }] },
            { label: 'v2', body: [{ kind: 'action', label: 'case2' }] },
          ],
        },
      ],
      swimlanes: [],
    };
    const geo = layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());

    expect(geo.nodes.map((n) => n.kind)).toEqual(['if-split', 'if-own-label', 'action', 'action', 'if-merge']);
    expect(geo.nodes[0]!.label).toBe('test');
    expect(geo.nodes[1]!.label).toBe('test');
  });
});
