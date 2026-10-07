import { describe, expect, it } from 'vitest';

import { shapesOf } from '../../../../../src/diagrams/activity/layout/compress/shapes-of.js';
import type { ShapesOfInput } from '../../../../../src/diagrams/activity/layout/compress/shapes-of.js';
import type {
  ActivityNodeGeo,
  ActivityEdgeGeo,
  SwimlaneGeo,
} from '../../../../../src/diagrams/activity/activity-geometry.types.js';
import type { EdgeMeta } from '../../../../../src/diagrams/activity/layout/swimlane-placement.js';
import type { Reservation } from '../../../../../src/diagrams/activity/layout/hexagon-reservations.js';
import type { StringBounder } from '../../../../../src/diagrams/activity/tiles/tile.js';
import { resolveTheme } from '../../../../../src/core/theme.js';
import {
  activityFontSize,
  swimlaneTitleFontSize,
} from '../../../../../src/diagrams/activity/activity-style-defaults.js';
import { measureLineWidth } from '../../../../../src/diagrams/activity/activity-text-placement.js';

const theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };
const bounder: StringBounder = { getDimension: (text: string) => ({ width: text.length * 6, height: 11 }) };

function baseInput(overrides: Partial<ShapesOfInput> = {}): ShapesOfInput {
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    swimlanes: [],
    reservations: [],
    swimlaneBand: undefined,
    bounder,
    theme,
    ...overrides,
  };
}

function node(kind: string, extra: Partial<ActivityNodeGeo> = {}): ActivityNodeGeo {
  return { id: 'n1', kind, x: 10, y: 20, width: 30, height: 6, ...extra };
}

describe('shapesOf — node kinds that draw nothing', () => {
  it('break emits no shape (FtileBreak draws nothing)', () => {
    expect(shapesOf(baseInput({ nodes: [node('break')] }))).toHaveLength(0);
  });

  it('split-bar emits no shape (FtileThinSplit draws a ULine, never occupies)', () => {
    expect(shapesOf(baseInput({ nodes: [node('split-bar')] }))).toHaveLength(0);
  });

  it('split-join-bar emits no shape (same ULine as split-bar)', () => {
    expect(shapesOf(baseInput({ nodes: [node('split-join-bar')] }))).toHaveLength(0);
  });
});

describe('shapesOf — fork/join bars', () => {
  it('fork-bar is a rect with ignoreX true and the node box', () => {
    const shapes = shapesOf(baseInput({ nodes: [node('fork-bar', { x: 12, y: 55, width: 103.4, height: 6 })] }));
    expect(shapes).toEqual([{ kind: 'rect', x: 12, y: 55, width: 103.4, height: 6, ignoreX: true }]);
  });

  it('join-bar is a rect with ignoreX true', () => {
    const shapes = shapesOf(baseInput({ nodes: [node('join-bar', { x: 12, y: 184, width: 103.4, height: 6 })] }));
    expect(shapes[0]).toMatchObject({ kind: 'rect', ignoreX: true });
    expect(shapes[0]!.ignoreY).toBeUndefined();
  });
});

describe('shapesOf — condition diamonds/hexagons', () => {
  it('if-split with a label is a polygon spanning the full hexagon box', () => {
    const n = node('if-split', { x: 10, y: 20, width: 40, height: 30, label: 'yes' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes).toEqual([{ kind: 'polygon', x: 10, y: 20, width: 40, height: 30 }]);
  });

  it('if-split with no label is a diamond polygon (y centred on width/2, not the node height)', () => {
    const n = node('if-split', { x: 10, y: 20, width: 40, height: 30 });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    // size = width/2 = 20; cy = y + height/2 = 35; diamond y = cy - size = 15
    expect(shapes).toEqual([{ kind: 'polygon', x: 10, y: 15, width: 40, height: 40 }]);
  });

  it('repeat-cond is always a hexagon, even with no label', () => {
    const n = node('repeat-cond', { x: 10, y: 20, width: 40, height: 24 });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes).toEqual([{ kind: 'polygon', x: 10, y: 20, width: 40, height: 24 }]);
  });
});

describe('shapesOf — if-merge and if-label (D2/D3)', () => {
  it('if-merge is a polygon spanning its own 24x24 box (Hexagon.java:49-56)', () => {
    const n = node('if-merge', { x: 10, y: 20, width: 24, height: 24 });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes).toEqual([{ kind: 'polygon', x: 10, y: 20, width: 24, height: 24 }]);
  });

  it('if-label is a text box at the node origin, measured with the bounder', () => {
    const n = node('if-label', { x: 10, y: 20, width: 12, height: 11, label: 'yes' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    // bounder.getDimension('yes', ARROW_FONT_SIZE=11) = { width: 3*6, height: 11 };
    // baseline = node.y + 11 * (1 - 1/4.5), Q5's ASCENT_FRACTION formula
    // (`activity-renderer-shapes.ts:76`).
    expect(shapes).toEqual([{ kind: 'text', x: 10, y: 20 + 11 * (1 - 1 / 4.5), width: 18, height: 11 }]);
  });

  it('a multi-line if-label is ONE box spanning first-line-top to last-line-bottom (bazuma)', () => {
    const n = node('if-label', { x: 10, y: 20, width: 12, height: 11, label: 'a\nbb\nccc' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    const ascent = 11 * (1 - 1 / 4.5);
    // firstBaselineY = 20 + ascent; lastBaselineY = firstBaselineY + 11*2;
    // y = lastBaselineY; height = (lastBaselineY - firstBaselineY) + 11 = 33;
    // width = max line width = 'ccc'.length * 6 = 18 (longest line, not the
    // single-call whole-string measurement the old code used).
    expect(shapes).toEqual([{ kind: 'text', x: 10, y: 20 + ascent + 22, width: 18, height: 33 }]);
  });
});

describe('shapesOf — note with spike', () => {
  it('extends the box to include the spike tip', () => {
    const n = node('note', { x: 100, y: 50, width: 60, height: 40, spikeTip: { x: 90, y: 65 } });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes).toEqual([{ kind: 'polygon', x: 90, y: 50, width: 70, height: 40 }]);
  });

  it('a note with no spike is just its own box', () => {
    const n = node('note', { x: 100, y: 50, width: 60, height: 40 });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes).toEqual([{ kind: 'polygon', x: 100, y: 50, width: 60, height: 40 }]);
  });
});

// T3i (row PARTCOMP): `partition`/`group` are a `USymbolFrame`
// (`USymbols.java:81,87`) -- its own rect sets BOTH
// `ignoreForCompressionOnX/Y()` (`USymbolFrame.java:70-71`), unlike every
// other box kind above (none of which carry either flag).
describe('shapesOf — group/partition frame (USymbolFrame, T3i)', () => {
  it('the frame rect is ignoreX AND ignoreY, unlike a plain box', () => {
    const n = node('group', { x: 16, y: 45, width: 138.4, height: 122, label: '' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes[0]).toEqual({ kind: 'rect', x: 16, y: 45, width: 138.4, height: 122, ignoreX: true, ignoreY: true });
  });

  it('partition resolves the same way as group', () => {
    const n = node('partition', { x: 16, y: 45, width: 138.4, height: 122, label: '' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes[0]).toMatchObject({ kind: 'rect', ignoreX: true, ignoreY: true });
  });

  it('an untitled frame also pushes its own title-tab polygon, skipped on X, width/3 x 12', () => {
    const n = node('group', { x: 16, y: 45, width: 138.4, height: 122, label: '' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    expect(shapes).toHaveLength(2);
    expect(shapes[1]).toEqual({
      kind: 'polygon',
      x: 16,
      y: 45,
      width: 138.4 / 3,
      height: 12,
      polygonSkipMode: 'x',
    });
  });

  it('a titled frame measures textWidth/textHeight from the title (USymbolFrame.java:76-84,99-104)', () => {
    const n = node('group', { x: 16, y: 45, width: 138.4, height: 122, label: 'P1' });
    const shapes = shapesOf(baseInput({ nodes: [n] }));
    const fontSize = activityFontSize(theme, 'composite');
    const expectedTextWidth = measureLineWidth(theme, fontSize, 'P1') + 10;
    const expectedTextHeight = fontSize + 3;
    expect(shapes[1]).toEqual({
      kind: 'polygon',
      x: 16,
      y: 45,
      width: expectedTextWidth,
      height: expectedTextHeight,
      polygonSkipMode: 'x',
    });
  });
});

describe('shapesOf — plain box kinds', () => {
  it('action is a rect over the node box', () => {
    const shapes = shapesOf(baseInput({ nodes: [node('action')] }));
    expect(shapes).toEqual([{ kind: 'rect', x: 10, y: 20, width: 30, height: 6 }]);
  });

  it('start/stop/spot/unknown all fall back to the same rect box', () => {
    for (const kind of ['start', 'stop', 'end', 'kill', 'spot', 'unknown-kind']) {
      const shapes = shapesOf(baseInput({ nodes: [node(kind)] }));
      expect(shapes).toEqual([{ kind: 'rect', x: 10, y: 20, width: 30, height: 6 }]);
    }
  });
});

const meta = (shape: EdgeMeta['shape'] = 'default'): EdgeMeta => ({ lane1: undefined, lane2: undefined, shape });
const metaCrossLane = (shape: EdgeMeta['shape']): EdgeMeta => ({ lane1: 'a', lane2: 'b', shape });

describe('shapesOf — edges', () => {
  it('a plain edge contributes only its terminal arrowhead, never its segments', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    expect(shapes).toHaveLength(1);
    expect(shapes[0]!.kind).toBe('polygon');
    // ArrowsRegular asToDown: (-4,-10),(0,0),(4,-10),(0,-6) at tip (0,20)
    expect(shapes[0]).toEqual({ kind: 'polygon', x: -4, y: 10, width: 8, height: 10 });
  });

  it('a CROSS-LANE parallel-in edge tags its arrowhead polygonSkipMode: x (ParallelBuilderFork.java:166-184 drawTranslate)', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [metaCrossLane('parallel-in')] }));
    expect(shapes[0]!.polygonSkipMode).toBe('x');
  });

  it('a CROSS-LANE parallel-out edge also tags polygonSkipMode: x', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [metaCrossLane('parallel-out')] }));
    expect(shapes[0]!.polygonSkipMode).toBe('x');
  });

  it('a SAME-LANE parallel-in edge carries no polygonSkipMode (PARX: ParallelBuilderFork.java:151-163 drawU never ignoreForCompression)', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta('parallel-in')] }));
    expect(shapes[0]!.polygonSkipMode).toBeUndefined();
  });

  it('a SAME-LANE parallel-out edge carries no polygonSkipMode', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta('parallel-out')] }));
    expect(shapes[0]!.polygonSkipMode).toBeUndefined();
  });

  it('a default-shape edge carries no polygonSkipMode even cross-lane', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [metaCrossLane('default')] }));
    expect(shapes[0]!.polygonSkipMode).toBeUndefined();
  });

  it('emphasize adds a second polygon at the FIRST matching segment midpoint', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 10 },
      ],
      emphasize: 'right',
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    // terminal arrowhead (last point) + emphasized arrowhead (first RIGHT
    // segment: (0,0)->(100,0))
    expect(shapes).toHaveLength(2);
    expect(shapes[1]!.kind).toBe('polygon');
  });

  it('emphasize with no matching segment adds no second polygon', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      emphasize: 'up',
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    expect(shapes).toHaveLength(1);
  });

  it('arrowhead: false drops the terminal arrowhead entirely', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
      arrowhead: false,
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    expect(shapes).toHaveLength(0);
  });

  // `Snake#getTextBlockPosition` (`Snake.java:244-270`), the SAME position
  // `renderer.ts#renderEdgeLabelAligned` draws at; baseline is
  // `centeredFirstBaselineY(top + size/2, size, 1)` = top + size * 7/9.
  const ARROW = activityFontSize(theme, 'arrow');
  const baselineOf = (top: number): number => top + (ARROW * 7) / 9;

  it('an unaligned edge label takes the default LEFT branch: x = max(pt1.x, pt2.x) + 4', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
      label: 'ok',
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    const textShape = shapes.find((s) => s.kind === 'text')!;
    // y top = (0 + 20) / 2 - ARROW / 2 (`Snake.java:250`)
    expect(textShape).toEqual({ kind: 'text', x: 4, y: baselineOf(10 - ARROW / 2), width: 12, height: 11 });
  });

  it('a CENTER-aligned edge label sits at worm minX, centred on (first.y + last.y - 10) / 2', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 50, y: 0 },
        { x: 50, y: 30 },
        { x: 10, y: 30 },
        { x: 10, y: 60 },
      ],
      label: 'no',
      labelAlign: { vertical: 'CENTER' },
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    const textShape = shapes.find((s) => s.kind === 'text')!;
    // `Snake.java:254-256`: x = minX = 10, y = (0 + 60 - 10) / 2 - h / 2
    expect(textShape).toEqual({ kind: 'text', x: 10, y: baselineOf(25 - ARROW / 2), width: 12, height: 11 });
  });

  it('a labelled H-then-V switch case edge (LEFT) is not boxed at the midpoint + 4', () => {
    // `ConnectionHorizontalThenVertical` (`FtileSwitchWithManyLinks.java:91-104`):
    // D1 point -> (x2, y1) -> (x2, y2); code "LD" -> x = min(pt1.x, pt2.x),
    // y centred between pt1.y and pt3.y (`Snake.java:265-267`).
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 100, y: 10 },
        { x: 40, y: 10 },
        { x: 40, y: 50 },
      ],
      label: 'a',
      labelAlign: { horizontal: 'LEFT' },
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    const textShape = shapes.find((s) => s.kind === 'text')!;
    expect(textShape).toEqual({ kind: 'text', x: 40, y: baselineOf(30 - ARROW / 2), width: 6, height: 11 });
  });
});

describe('shapesOf — midArrowAt (D4/T1b)', () => {
  it('adds a polygon occupant at the mid-arrow point, using the same extent as emphasize', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
      midArrowAt: { x: 50, y: 30, dir: 'up' },
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    // terminal arrowhead (index 0) + mid-arrow polygon (index 1, emphasize
    // is absent here).
    expect(shapes).toHaveLength(2);
    // asToUp: (-4,10),(0,0),(4,10),(0,6) -> minX=-4,maxX=4,minY=0,maxY=10.
    expect(shapes[1]).toEqual({ kind: 'polygon', x: 46, y: 30, width: 8, height: 10 });
  });

  it('is pushed AFTER the emphasize shape when both are present', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 10 },
      ],
      emphasize: 'right',
      midArrowAt: { x: 200, y: 200, dir: 'down' },
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    // terminal + emphasize + midArrow = 3, in that order.
    expect(shapes).toHaveLength(3);
    // asToDown: (-4,-10),(0,0),(4,-10),(0,-6) -> minX=-4,maxX=4,minY=-10,maxY=0.
    expect(shapes[2]).toEqual({ kind: 'polygon', x: 196, y: 190, width: 8, height: 10 });
  });

  it('no midArrowAt contributes no extra shape', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    expect(shapes).toHaveLength(1);
  });
});

describe('shapesOf — reservations', () => {
  it('a plain reservation (no ignore flags) is an empty shape', () => {
    const r: Reservation = { x: 5, y: 12, width: 5, height: 12 };
    const shapes = shapesOf(baseInput({ reservations: [r] }));
    expect(shapes).toEqual([{ kind: 'empty', x: 5, y: 12, width: 5, height: 12 }]);
  });

  it('a reservation with ignoreX/ignoreY becomes a rect carrying those flags', () => {
    const r: Reservation = { x: 20, y: 0, width: 349.275, height: 18, ignoreX: true, ignoreY: true };
    const shapes = shapesOf(baseInput({ reservations: [r] }));
    expect(shapes).toEqual([{ kind: 'rect', x: 20, y: 0, width: 349.275, height: 18, ignoreX: true, ignoreY: true }]);
  });
});

/**
 * `CenteredText` (`ftile/CenteredText.java:26`) via `Swimlanes#drawTitles`
 * (`:369-375`) -- one shape per lane title, position/font mirroring
 * `activity-renderer-swimlanes.ts#renderSwimlaneTitles:115-126`.
 */
describe('shapesOf — swimlane titles (centeredText)', () => {
  const lane: SwimlaneGeo = { name: 'Lane A', x: 20, width: 60, contentX: 25, contentWidth: 30, titleWidth: 10 };

  it('no band (single-lane diagram) emits no title shapes', () => {
    const shapes = shapesOf(baseInput({ swimlanes: [lane], swimlaneBand: undefined }));
    expect(shapes.some((s) => s.kind === 'centeredText')).toBe(false);
  });

  it('one centeredText per lane when a band is present', () => {
    const bandY = 12;
    const shapes = shapesOf(baseInput({ swimlanes: [lane], swimlaneBand: { x: 20, y: bandY, width: 60, height: 18 } }));
    const titles = shapes.filter((s) => s.kind === 'centeredText');
    expect(titles).toHaveLength(1);
  });

  it('x = contentX + (contentWidth - titleWidth) / 2 (renderSwimlaneTitles:122-124)', () => {
    const shapes = shapesOf(baseInput({ swimlanes: [lane], swimlaneBand: { x: 20, y: 12, width: 60, height: 18 } }));
    const title = shapes.find((s) => s.kind === 'centeredText')!;
    // contentX=25, contentWidth=30, titleWidth=10 -> 25 + (30-10)/2 = 35
    expect(title.x).toBe(35);
  });

  it('y = band.y + fontSize * (1 - 1/4.5) (renderSwimlaneTitles:119)', () => {
    const bandY = 12;
    const shapes = shapesOf(baseInput({ swimlanes: [lane], swimlaneBand: { x: 20, y: bandY, width: 60, height: 18 } }));
    const title = shapes.find((s) => s.kind === 'centeredText')!;
    const fontSize = swimlaneTitleFontSize(theme);
    expect(title.y).toBeCloseTo(bandY + fontSize * (1 - 1 / 4.5), 10);
  });

  it('width/height come from the bounder at the lane name and title font size', () => {
    const shapes = shapesOf(baseInput({ swimlanes: [lane], swimlaneBand: { x: 20, y: 12, width: 60, height: 18 } }));
    const title = shapes.find((s) => s.kind === 'centeredText')!;
    const dim = bounder.getDimension('Lane A', swimlaneTitleFontSize(theme));
    expect(title.width).toBe(dim.width);
    expect(title.height).toBe(dim.height);
  });

  it('falls back to lane.x/width/0 when contentX/contentWidth/titleWidth are unset', () => {
    const bare: SwimlaneGeo = { name: 'X', x: 5, width: 20 };
    const shapes = shapesOf(baseInput({ swimlanes: [bare], swimlaneBand: { x: 5, y: 0, width: 20, height: 18 } }));
    const title = shapes.find((s) => s.kind === 'centeredText')!;
    // contentX ?? x = 5; contentWidth ?? width = 20; titleWidth ?? 0 = 0 -> 5 + (20-0)/2 = 15
    expect(title.x).toBe(15);
  });
});
