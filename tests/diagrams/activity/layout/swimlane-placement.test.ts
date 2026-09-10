import { describe, expect, it } from 'vitest';
import {
  computeSwimlaneChrome,
  laneAt,
  laneIn,
  laneOut,
  measureSwimlaneTitlesHeight,
  placeSwimlanes,
  resolveSwimlaneVertical,
} from '../../../../src/diagrams/activity/layout/swimlane-placement.js';
import type { SwimlaneGeo } from '../../../../src/diagrams/activity/activity-layout-types.js';
import type { EdgeMeta } from '../../../../src/diagrams/activity/layout/swimlane-placement.js';
import { TileLeaf } from '../../../../src/diagrams/activity/tiles/tile.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import {
  NORTH_HOOK,
  SOUTH_HOOK,
  WEST_HOOK,
  EAST_HOOK,
  NORTH_BORDER,
  SOUTH_BORDER,
} from '../../../../src/diagrams/activity/tiles/points.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { ActivityNodeGeo } from '../../../../src/diagrams/activity/activity-layout-types.js';

/** A minimal leaf tile with a caller-controlled width/height, used to feed
 * exact content extents into `placeSwimlanes` without going through a real
 * `GtileAction` (whose own text measurement + `ACTION_MIN_WIDTH` floor
 * would obscure the arithmetic under test). */
class FixedTile extends TileLeaf {
  readonly kind = 'gtile-spot' as const;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    super();
  }
  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
    }
  }
}

const theme: Theme = resolveTheme('default');

function node(id: string, x: number, width: number, swimlane: string): ActivityNodeGeo {
  return { id, kind: 'action', x, y: 0, width, height: 32, swimlane };
}

describe('laneAt/laneIn/laneOut', () => {
  it('laneAt returns the tile own swimlane when set', () => {
    const t = new FixedTile(10, 10);
    t.swimlane = 'A';
    expect(laneAt(t, 'B')).toBe('A');
  });

  it('laneAt falls back to inherited when unset', () => {
    const t = new FixedTile(10, 10);
    expect(laneAt(t, 'B')).toBe('B');
  });

  it('laneIn descends into the FIRST child of an unlabeled top-down wrapper', () => {
    const first = new FixedTile(10, 10);
    first.swimlane = 'first-lane';
    const second = new FixedTile(10, 10);
    second.swimlane = 'second-lane';
    const wrapper = new GtileTopDown([first, second], {} as StringBounder, theme);
    expect(laneIn(wrapper, undefined)).toBe('first-lane');
  });

  it('laneOut descends into the LAST child of an unlabeled top-down wrapper', () => {
    const first = new FixedTile(10, 10);
    first.swimlane = 'first-lane';
    const second = new FixedTile(10, 10);
    second.swimlane = 'second-lane';
    const wrapper = new GtileTopDown([first, second], {} as StringBounder, theme);
    expect(laneOut(wrapper, undefined)).toBe('second-lane');
  });

  it('laneIn/laneOut fall back to inherited when the wrapper is empty', () => {
    const empty = new GtileTopDown([], {} as StringBounder, theme);
    expect(laneIn(empty, 'ambient')).toBe('ambient');
    expect(laneOut(empty, 'ambient')).toBe('ambient');
  });

  it("a composite's own swimlane wins over descending into children", () => {
    const child = new FixedTile(10, 10);
    child.swimlane = 'child-lane';
    const wrapper = new GtileTopDown([child], {} as StringBounder, theme);
    wrapper.swimlane = 'wrapper-lane';
    expect(laneIn(wrapper, undefined)).toBe('wrapper-lane');
    expect(laneOut(wrapper, undefined)).toBe('wrapper-lane');
  });
});

describe('placeSwimlanes — no lanes is a byte-identical passthrough', () => {
  it('returns the same node/edge content, new arrays, empty swimlanes', () => {
    const nodes = [node('n1', 12, 40, 'unused')];
    const edges = [
      {
        points: [
          { x: 12, y: 0 },
          { x: 12, y: 30 },
        ],
      },
    ];
    const result = placeSwimlanes({
      nodes,
      edges,
      edgeMeta: [{ lane1: undefined, lane2: undefined, shape: 'default' }],
      laneNames: [],
      baseX: 12,
      baseY: 12,
      bounder: { getDimension: () => ({ width: 0, height: 0 }) },
      theme,
    });
    expect(result.swimlanes).toEqual([]);
    expect(result.nodes).toEqual(nodes);
    expect(result.edges).toEqual(edges);
  });
});

/**
 * Reproduces the `pakema-21-xema183` hand-check from the mission's prior
 * observations: two lanes, content width 26.675 each (the golden's own
 * `a`/`b` action-box widths), title widths 28.338 / 300.937 (solved from
 * the golden's own observed divider positions 20, 58.338, 369.275 -- a
 * uniform +15 diagram margin the swimlane arithmetic itself does not
 * produce, so the expected RELATIVE positions are 5, 43.338, 354.275).
 * `min = 0` throughout (the `swimlaneWidth` skinparam default).
 */
describe('placeSwimlanes — worked-example arithmetic (pakema-21-xema183)', () => {
  const CONTENT_WIDTH = 26.675;
  const TITLE_A = 28.338;
  const TITLE_B = 300.937;

  const bounder: StringBounder = {
    getDimension: (text: string) => {
      if (text === 'A') return { width: TITLE_A, height: 18 };
      if (text === 'BBBBBBBBBBBBBBBBBBBBBBBBB') return { width: TITLE_B, height: 18 };
      throw new Error(`unexpected title text: ${text}`);
    },
  };

  function place() {
    const nodes = [node('a', 0, CONTENT_WIDTH, 'A'), node('b', 0, CONTENT_WIDTH, 'BBBBBBBBBBBBBBBBBBBBBBBBB')];
    return placeSwimlanes({
      nodes,
      edges: [],
      edgeMeta: [],
      laneNames: ['A', 'BBBBBBBBBBBBBBBBBBBBBBBBB'],
      baseX: 0,
      baseY: 0,
      bounder,
      theme,
    });
  }

  it('lane A starts at 5 (the literal outer half-space)', () => {
    expect(place().swimlanes[0]!.x).toBeCloseTo(5, 3);
  });

  it('the A/B divider sits at 43.338 (A content 26.675 + 2x its title overflow half-space)', () => {
    expect(place().swimlanes[1]!.x).toBeCloseTo(43.338, 3);
  });

  it("the trailing divider sits at 354.275 (closes lane B's own title overflow)", () => {
    const s = place().swimlanes;
    expect(s[1]!.x + s[1]!.width).toBeCloseTo(354.275, 3);
  });

  it('lane B starts exactly where lane A ends', () => {
    const s = place().swimlanes;
    expect(s[1]!.x).toBe(s[0]!.x + s[0]!.width);
  });
});

/**
 * Mission `activity-klimt-compress` T3, D5: `LaneDivider#drawU`'s own
 * `UEmpty(x1 + x2, 1)` (`LaneDivider.java:85-97`), one per boundary
 * (n lanes -> n + 1 dividers, `Swimlanes.java`'s own `dividers.size() ==
 * swimlanes().size() + 1` assertion). Titles here are narrower than their
 * lane's content (`getDimension` returns width 0), so every `x1`/`x2` is
 * the fixed `SWIMLANE_HALF_MISSING_SPACE` (5) with no title-overflow
 * adjustment -- keeps the arithmetic exact and independently checkable.
 */
describe('placeSwimlanes — divider reservations (no title overflow)', () => {
  const bounder: StringBounder = { getDimension: () => ({ width: 0, height: 18 }) };
  const nodes = [node('a', 0, 20, 'A'), node('b', 0, 30, 'B')];

  function place(baseX: number, baseY: number) {
    return placeSwimlanes({ nodes, edges: [], edgeMeta: [], laneNames: ['A', 'B'], baseX, baseY, bounder, theme });
  }

  it('emits laneNames.length + 1 reservations', () => {
    expect(place(0, 0).reservations).toHaveLength(3);
  });

  it('every reservation is 1 tall and sits at baseY', () => {
    const result = place(0, 7);
    for (const r of result.reservations) {
      expect(r.height).toBe(1);
      expect(r.y).toBe(7);
    }
  });

  it('each divider is 10 wide (x1=x2=5, the fixed outer half-space)', () => {
    for (const r of place(0, 0).reservations) expect(r.width).toBe(10);
  });

  it('reservations sit at the block origin, after lane A, and after lane B', () => {
    const result = place(0, 0);
    const xs = result.reservations.map((r) => r.x).sort((a, b) => a - b);
    // lane A: content 20 + its own leading divider (10) = 30; lane B: + 30 + 10 = 70
    expect(xs).toEqual([0, 30, 70]);
  });

  it('reservations shift by baseX exactly like the lane origins do', () => {
    const xs = place(100, 0)
      .reservations.map((r) => r.x)
      .sort((a, b) => a - b);
    expect(xs).toEqual([100, 130, 170]);
  });
});

describe('placeSwimlanes — edge routing', () => {
  const bounder: StringBounder = { getDimension: () => ({ width: 40, height: 18 }) };
  const laneNames = ['A', 'B'];

  it('a cross-lane edge becomes a 4-point path with a horizontal middle segment', () => {
    const nodes = [node('a', 12, 40, 'A'), node('b', 12, 40, 'B')];
    const edgeMeta: EdgeMeta[] = [{ lane1: 'A', lane2: 'B', shape: 'default' }];
    const edges = [
      {
        points: [
          { x: 32, y: 32 },
          { x: 32, y: 60 },
        ],
      },
    ];
    const result = placeSwimlanes({ nodes, edges, edgeMeta, laneNames, baseX: 12, baseY: 12, bounder, theme });
    const pts = result.edges[0]!.points;
    expect(pts).toHaveLength(4);
    expect(pts[1]!.y).toBe(pts[2]!.y);
    expect(pts[0]!.x).not.toBe(pts[3]!.x);
  });

  it('a same-lane edge keeps its pass-1 point count, only shifted', () => {
    const nodes = [node('a', 12, 40, 'A'), node('a2', 12, 40, 'A')];
    const edgeMeta: EdgeMeta[] = [{ lane1: 'A', lane2: 'A', shape: 'default' }];
    const original = [
      {
        points: [
          { x: 32, y: 32 },
          { x: 32, y: 60 },
        ],
      },
    ];
    const result = placeSwimlanes({
      nodes,
      edges: original,
      edgeMeta,
      laneNames,
      baseX: 12,
      baseY: 12,
      bounder,
      theme,
    });
    expect(result.edges[0]!.points).toHaveLength(2);
  });

  it('a node whose lane is not among laneNames is left unshifted', () => {
    const nodes = [node('a', 12, 40, 'A'), node('stray', 12, 40, 'unknown-lane')];
    const result = placeSwimlanes({ nodes, edges: [], edgeMeta: [], laneNames, baseX: 12, baseY: 12, bounder, theme });
    const stray = result.nodes.find((n) => n.id === 'stray')!;
    expect(stray.x).toBe(12);
  });

  /**
   * D6 / `ParallelBuilderFork.java:166-184`, `ParallelBuilderSplit.java
   * :207-225`: a bar-to-branch in-connector's horizontal sits at the
   * BAR-side endpoint's own y plus 4, never the two endpoints' average.
   */
  it("a 'parallel-in' cross-lane edge puts the horizontal at the bar-side y + 4", () => {
    const nodes = [node('a', 12, 40, 'A'), node('b', 12, 40, 'B')];
    const edgeMeta: EdgeMeta[] = [{ lane1: 'A', lane2: 'B', shape: 'parallel-in' }];
    const edges = [
      {
        points: [
          { x: 32, y: 32 },
          { x: 32, y: 60 },
        ],
      },
    ];
    const result = placeSwimlanes({ nodes, edges, edgeMeta, laneNames, baseX: 12, baseY: 12, bounder, theme });
    const pts = result.edges[0]!.points;
    expect(pts).toHaveLength(4);
    expect(pts[0]).toEqual({ x: pts[0]!.x, y: 32 });
    expect(pts[1]).toEqual({ x: pts[0]!.x, y: 36 });
    expect(pts[2]).toEqual({ x: pts[3]!.x, y: 36 });
    expect(pts[3]).toEqual({ x: pts[3]!.x, y: 60 });
  });

  /**
   * D6 / `ParallelBuilderFork.java:220-241`, `ParallelBuilderSplit.java
   * :264-285`: a branch-to-join out-connector's horizontal sits at the
   * join-side endpoint's own y minus 14.
   */
  it("a 'parallel-out' cross-lane edge puts the horizontal at the join-side y - 14", () => {
    const nodes = [node('a', 12, 40, 'A'), node('b', 12, 40, 'B')];
    const edgeMeta: EdgeMeta[] = [{ lane1: 'A', lane2: 'B', shape: 'parallel-out' }];
    const edges = [
      {
        points: [
          { x: 32, y: 32 },
          { x: 32, y: 80 },
        ],
      },
    ];
    const result = placeSwimlanes({ nodes, edges, edgeMeta, laneNames, baseX: 12, baseY: 12, bounder, theme });
    const pts = result.edges[0]!.points;
    expect(pts).toHaveLength(4);
    expect(pts[0]).toEqual({ x: pts[0]!.x, y: 32 });
    expect(pts[1]).toEqual({ x: pts[0]!.x, y: 66 });
    expect(pts[2]).toEqual({ x: pts[3]!.x, y: 66 });
    expect(pts[3]).toEqual({ x: pts[3]!.x, y: 80 });
  });
});

// ---------------------------------------------------------------------------
// measureSwimlaneTitlesHeight — D2, floored at 10 by AtomText (T6)
// ---------------------------------------------------------------------------

describe('measureSwimlaneTitlesHeight', () => {
  // `theme` here uses the default `SwimlaneTitleFontSize` (18,
  // `activity-style-defaults.ts#swimlaneFontSize`); each fixture below
  // overrides it via a bounder that reports that resolved size as height
  // (mirrors `StringBounderFromWidthTable.java:71`: height === size).
  function bounderAt(height: number) {
    return { getDimension: () => ({ width: 0, height }) };
  }

  it('is unaffected when every lane title is already >= 10 (default 18)', () => {
    expect(measureSwimlaneTitlesHeight(['A', 'B'], bounderAt(18), theme)).toBe(18);
  });

  it('floors a small title height at 10 (sikino-19-vuca111: FontSize 8 -> 10)', () => {
    expect(measureSwimlaneTitlesHeight(['lane1', 'lane2'], bounderAt(8), theme)).toBe(10);
  });

  it('is unaffected by a large title height (cemipu-87-dinu624: FontSize 30 -> 30)', () => {
    expect(measureSwimlaneTitlesHeight(['swimlane1', 'swimlane2'], bounderAt(30), theme)).toBe(30);
  });

  it('takes the MAX across lanes, not the last', () => {
    let call = 0;
    const bounder = { getDimension: () => ({ width: 0, height: ++call === 1 ? 8 : 22 }) };
    expect(measureSwimlaneTitlesHeight(['short', 'tall'], bounder, theme)).toBe(22);
  });
});

// ---------------------------------------------------------------------------
// resolveSwimlaneVertical — the Swimlanes#drawU size() > 1 guard (T6)
// ---------------------------------------------------------------------------

describe('resolveSwimlaneVertical', () => {
  const bounder = { getDimension: () => ({ width: 0, height: 18 }) };

  it('reserves no vertical space for a single lane', () => {
    expect(resolveSwimlaneVertical(['A'], 12, bounder, theme)).toEqual({ contentY: 12, titlesHeight: 0 });
  });

  it('reserves no vertical space for zero lanes', () => {
    expect(resolveSwimlaneVertical([], 12, bounder, theme)).toEqual({ contentY: 12, titlesHeight: 0 });
  });

  it('pushes content down by titlesHeight + 5 for two or more lanes', () => {
    expect(resolveSwimlaneVertical(['A', 'B'], 12, bounder, theme)).toEqual({ contentY: 35, titlesHeight: 18 });
  });
});

// ---------------------------------------------------------------------------
// computeSwimlaneChrome — band x/width and divider Y-range (T6)
// ---------------------------------------------------------------------------

describe('computeSwimlaneChrome', () => {
  const lanes: SwimlaneGeo[] = [
    { name: 'A', x: 20, width: 38.338 },
    { name: 'B', x: 58.338, width: 310.937 },
  ];

  it('returns nothing for a single lane', () => {
    expect(computeSwimlaneChrome([lanes[0]!], 17.5, 18, 164.5)).toEqual({});
  });

  it('bands from the first divider, width = Σ(lane.width) - 1 (pakema-21-xema183)', () => {
    const chrome = computeSwimlaneChrome(lanes, 17.5, 18, 164.5);
    expect(chrome.swimlaneBand?.x).toBe(20);
    expect(chrome.swimlaneBand?.y).toBe(17.5);
    expect(chrome.swimlaneBand?.width).toBeCloseTo(348.275, 3);
    expect(chrome.swimlaneBand?.height).toBe(18);
  });

  it('spans the divider Y-range from the block top to the content bottom', () => {
    const chrome = computeSwimlaneChrome(lanes, 17.5, 18, 164.5);
    expect(chrome.swimlaneDividerY).toEqual({ y1: 17.5, y2: 164.5 });
  });
});
