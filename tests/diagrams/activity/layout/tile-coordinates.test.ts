import { describe, expect, it } from 'vitest';
import { assignCoordinates, LAYOUT_MARGIN } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { dedupeAdjacentPoints } from '../../../../src/diagrams/activity/layout/edge-point-dedupe.js';
import { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { GtileDiamond } from '../../../../src/diagrams/activity/tiles/gtile-diamond.js';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
import { GtileFork } from '../../../../src/diagrams/activity/tiles/gtile-fork.js';
import { GtileSplit } from '../../../../src/diagrams/activity/tiles/gtile-split.js';
import { NORTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
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

describe('assignCoordinates — GtileWhile produces back-edge', () => {
  const header = new GtileDiamond('loop?', bounder, theme);
  const body = new GtileAction(actionNode, bounder, theme);
  const tile = new GtileWhile(header, body, undefined, undefined, bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces at least 2 nodes (diamond + action)', () => {
    expect(geo.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('produces exactly 2 edges (forward + back)', () => {
    expect(geo.edges).toHaveLength(2);
  });

  it('back-edge has >= 4 waypoints', () => {
    // forward edge has 2 points; back-edge has 4
    const backEdge = geo.edges.find((e) => e.points.length >= 4);
    expect(backEdge).toBeDefined();
    expect(backEdge!.points.length).toBeGreaterThanOrEqual(4);
  });
});

describe('assignCoordinatesFull — GtileWhile emits a hexagon reservation', () => {
  const header = new GtileDiamond('loop?', bounder, theme);
  const body = new GtileAction(actionNode, bounder, theme);
  const tile = new GtileWhile(header, body, undefined, undefined, bounder, theme);
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
