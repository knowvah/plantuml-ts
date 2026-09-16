import { describe, expect, it } from 'vitest';
import { assignCoordinates, LAYOUT_MARGIN } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { dedupeAdjacentPoints } from '../../../../src/diagrams/activity/layout/edge-point-dedupe.js';
import { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
import { GtileFork } from '../../../../src/diagrams/activity/tiles/gtile-fork.js';
import { GtileSplit } from '../../../../src/diagrams/activity/tiles/gtile-split.js';
import { GtileBreak } from '../../../../src/diagrams/activity/tiles/gtile-break.js';
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

const actionNode = { kind: 'action' as const, label: 'Hello', swimlane: 'default' };
const NODE_MARGIN_Y = 20;

describe('assignCoordinates — single GtileAction', () => {
  const tile = new GtileAction(actionNode, bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces exactly 1 node geo', () => {
    expect(geo.nodes).toHaveLength(1);
  });

  it('produces no edge geos', () => {
    expect(geo.edges).toHaveLength(0);
  });

  it('node geo kind === action', () => {
    expect(geo.nodes[0]!.kind).toBe('action');
  });

  it('node geo x === LAYOUT_MARGIN', () => {
    expect(geo.nodes[0]!.x).toBe(LAYOUT_MARGIN);
  });

  it('node geo y === LAYOUT_MARGIN', () => {
    expect(geo.nodes[0]!.y).toBe(LAYOUT_MARGIN);
  });

  it('totalWidth >= tile.width + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalWidth).toBeGreaterThanOrEqual(tile.width + 2 * LAYOUT_MARGIN);
  });

  it('totalHeight >= tile.height + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalHeight).toBeGreaterThanOrEqual(tile.height + 2 * LAYOUT_MARGIN);
  });

  it('no swimlanes for empty ast', () => {
    expect(geo.swimlanes).toHaveLength(0);
  });
});

describe('assignCoordinates — GtileTopDown with 2 GtileAction children', () => {
  const action0 = new GtileAction(actionNode, bounder, theme);
  const action1 = new GtileAction({ kind: 'action' as const, label: 'World', swimlane: 'default' }, bounder, theme);
  const tile = new GtileTopDown([action0, action1], bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces exactly 2 node geos', () => {
    expect(geo.nodes).toHaveLength(2);
  });

  it('produces exactly 1 edge geo', () => {
    expect(geo.edges).toHaveLength(1);
  });

  it('node[0].y === LAYOUT_MARGIN (first child at top)', () => {
    expect(geo.nodes[0]!.y).toBe(LAYOUT_MARGIN);
  });

  it('node[1].y === LAYOUT_MARGIN + action0.height + NODE_MARGIN_Y', () => {
    expect(geo.nodes[1]!.y).toBe(LAYOUT_MARGIN + action0.height + NODE_MARGIN_Y);
  });

  it('totalWidth >= tile.width + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalWidth).toBeGreaterThanOrEqual(tile.width + 2 * LAYOUT_MARGIN);
  });

  it('totalHeight >= tile.height + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalHeight).toBeGreaterThanOrEqual(tile.height + 2 * LAYOUT_MARGIN);
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
    const whileTile = new GtileWhile(header, body, bounder, theme);
    const c = new GtileAction({ kind: 'action' as const, label: 'c' }, bounder, theme);
    const root = new GtileTopDown([a, whileTile, c], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    // node order is unaffected by D7 -- draws are node-then-its-own-edges
    // per compound, walk order is unchanged: a, header, body, c.
    expect(geo.nodes).toHaveLength(4);
    expect(geo.nodes.map((n) => n.label)).toEqual(['a', 'cond', 'body', 'c']);
    // altp-T4: In, Back, Out, Out2 (X's own internals) + a->X + X->c.
    expect(geo.edges).toHaveLength(6);

    const aBottom = geo.nodes[0]!.y + geo.nodes[0]!.height;
    const cTop = geo.nodes[3]!.y;
    // X's own origin y === the header's y (`GtileWhile.headerOffsetY === 0`).
    const xTop = geo.nodes[1]!.y;
    // Pre-compression upper bound (raw `whileTile.height`) -- compression
    // (T5, `compress-geometry.ts`) only ever REMOVES empty gaps, so a
    // compressed y can only be <= this raw estimate, never past it; used
    // below only as a `<=` ceiling, never as an exact expected value.
    const xBottomRaw = xTop + whileTile.height;
    // Body's own (post-compression) bottom -- a safe floor for X's true
    // south-hook y, which sits at or below it (`GtileWhile`'s south hook is
    // the whole tile's exit, past the body by `NODE_MARGIN_Y`).
    const bodyBottom = geo.nodes[2]!.y + geo.nodes[2]!.height;

    // edges[0..3]: X's own internals (In, Back, Out, Out2) -- every point
    // stays strictly inside X's own vertical span, never touching a leaf
    // sibling.
    for (const edgeIndex of [0, 1, 2, 3]) {
      for (const p of geo.edges[edgeIndex]!.points) {
        expect(p.y).toBeGreaterThanOrEqual(xTop);
        expect(p.y).toBeLessThanOrEqual(xBottomRaw);
      }
    }

    // edges[4]: a -> X, pushed only AFTER X's own internals above.
    expect(geo.edges[4]!.points.some((p) => p.y === aBottom)).toBe(true);
    expect(geo.edges[4]!.points.every((p) => p.y <= xTop)).toBe(true);

    // edges[5]: X -> c (c has no internals of its own to precede it).
    expect(geo.edges[5]!.points.some((p) => p.y === cTop)).toBe(true);
    expect(geo.edges[5]!.points.every((p) => p.y >= bodyBottom)).toBe(true);
  });

  it('leaves-only sequence (a, b, c) keeps identity walk order, unaffected by D7', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    const c = new GtileAction({ kind: 'action' as const, label: 'c' }, bounder, theme);
    const root = new GtileTopDown([a, b, c], bounder, theme);
    const geo = assignCoordinates(root, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
    const geo = assignCoordinates(root, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
  const tile = new GtileWhile(header, body, bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces at least 2 nodes (diamond + action)', () => {
    expect(geo.nodes.length).toBeGreaterThanOrEqual(2);
  });

  // altp-T4 (D7): ConnectionIn, ConnectionBackSimple, ConnectionOut (x2) --
  // this body has no `break`, so no welding edges.
  it('produces exactly 4 edges (In, Back, Out, Out2)', () => {
    expect(geo.edges).toHaveLength(4);
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
  // terminal arrowhead.
  it('exactly two edges carry arrowhead: false (both ConnectionOut snakes)', () => {
    expect(geo.edges.filter((e) => e.arrowhead === false)).toHaveLength(2);
  });
});

describe('assignCoordinatesFull — GtileWhile emits a hexagon reservation', () => {
  const header = new GtileDiamondInside('loop?', {}, bounder, theme);
  const body = new GtileAction(actionNode, bounder, theme);
  const tile = new GtileWhile(header, body, bounder, theme);
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
  it('emits exactly 3 edges (BackEmpty, Out, Out2), no ConnectionIn', () => {
    const header = new GtileDiamondInside('loop?', {}, bounder, theme);
    const body = new GtileTopDown([], bounder, theme);
    const tile = new GtileWhile(header, body, bounder, theme);
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    expect(geo.edges).toHaveLength(3);
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
    const tile = new GtileWhile(header, body, bounder, theme);
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
    const tile = new GtileWhile(header, body, bounder, theme);
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
    const tile = new GtileWhile(header, body, bounder, theme);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });

    // In, Out, Out2 -- no Back, so no 5-point edge and no reservation.
    expect(full.geometry.edges).toHaveLength(3);
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
    const tile = new GtileWhile(header, body, bounder, theme);
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    // action1->brk, brk->action2 (the body's OWN internal sibling edges,
    // pushed while walking the body, before the while's own connections),
    // then In, Back (action2 still has a point out), Out, Out2, then the
    // weld LAST -- 7 edges total.
    expect(geo.edges).toHaveLength(7);
    const breakNode = geo.nodes.find((n) => n.kind === 'break')!;
    const weld = geo.edges[geo.edges.length - 1]!;
    expect(weld.points).toEqual([
      { x: breakNode.x, y: breakNode.y },
      { x: LAYOUT_MARGIN + 12, y: breakNode.y },
    ]);
    expect(weld.emphasize).toBeUndefined();
    expect(weld.arrowhead).toBeUndefined();
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
  const geo = assignCoordinates(tile, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
    return assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);
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

describe('assignCoordinates — cross-lane vs same-lane edge shape', () => {
  it('an edge between two nodes in DIFFERENT lanes gets a 4-point horizontal jog', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    b.swimlane = 'B';
    const root = new GtileTopDown([a, b], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
    const geo = assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
    const geo = assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
      LAYOUT_MARGIN,
      LAYOUT_MARGIN,
      bounder,
      theme,
    );
    const withEmptyAst = assignCoordinates(build(), emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);
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
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    expect(geo.edges).toHaveLength(2);
    const [inEdge, outEdge] = geo.edges;
    const bX = LAYOUT_MARGIN + tile.branchOffsets[0]!;
    const bY = LAYOUT_MARGIN + tile.branchTopYs[0]!;
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
    expect(inEdge!.points[0]).toEqual({ x: bX + 7 - REMOVED_LEADING, y: LAYOUT_MARGIN + tile.barHeight });
    expect(inEdge!.points[1]).toEqual({ x: bX + 7 - REMOVED_LEADING, y: bY });

    const joinBarY = LAYOUT_MARGIN + tile.height - tile.barHeight;
    expect(outEdge!.points).toHaveLength(2);
    expect(outEdge!.points[0]).toEqual({ x: bX + 11 - REMOVED_LEADING, y: bY + 60 });
    expect(outEdge!.points[1]).toEqual({ x: bX + 11 - REMOVED_LEADING, y: joinBarY });
  });

  it('a detached branch (hasPointOut() === false) gets an in-edge and NO out-edge', () => {
    const branch = branchStub(80, 60, false);
    const tile = new GtileSplit([branch], bounder);
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    expect(geo.edges).toHaveLength(1);
    expect(geo.edges[0]!.points).toHaveLength(2);
  });

  it('two branches: the continuing one gets an out-edge, the detached one does not', () => {
    const continuing = branchStub(80, 60, true);
    const detached = branchStub(80, 80, false);
    const tile = new GtileFork([continuing, detached], bounder);
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

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
    expect(joinBar.y).toBe(LAYOUT_MARGIN + tile.height - tile.barHeight - REMOVED_Y);
  });

  it('split top line spans the first..last branch north-hook x over EVERY branch, unconditional', () => {
    const b0 = branchStub(80, 60, true);
    const b1 = branchStub(80, 60, true);
    const b2 = branchStub(80, 60, true);
    const tile = new GtileSplit([b0, b1, b2], bounder);
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    const splitBar = geo.nodes.find((n) => n.kind === 'split-bar')!;
    const first = LAYOUT_MARGIN + tile.branchOffsets[0]! + 7;
    const last = LAYOUT_MARGIN + tile.branchOffsets[2]! + 7;
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
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    const joinLine = geo.nodes.find((n) => n.kind === 'split-join-bar')!;
    const centreX = LAYOUT_MARGIN + tile.width / 2;
    const b2South = LAYOUT_MARGIN + tile.branchOffsets[2]! + 11;
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
    const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    expect(geo.nodes.some((n) => n.kind === 'split-join-bar')).toBe(false);
    expect(geo.nodes.map((n) => n.kind)).toEqual(['split-bar', 'stub-branch', 'stub-branch']);
    expect(geo.edges).toHaveLength(2); // 2 in-edges, 0 out-edges
  });

  it('split-bar sits in the FIRST branch lane; split-join-bar sits in the LAST branch lane', () => {
    const b0 = branchStub(80, 60, true, 'LaneA');
    const b1 = branchStub(80, 60, true, 'LaneB');
    const tile = new GtileSplit([b0, b1], bounder);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['LaneA', 'LaneB'] };
    const geo = assignCoordinates(tile, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    const splitBar = geo.nodes.find((n) => n.kind === 'split-bar')!;
    const joinLine = geo.nodes.find((n) => n.kind === 'split-join-bar')!;
    expect(splitBar.swimlane).toBe('LaneA');
    expect(joinLine.swimlane).toBe('LaneB');
  });
});
