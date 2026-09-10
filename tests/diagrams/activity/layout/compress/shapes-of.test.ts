import { describe, expect, it } from 'vitest';

import { shapesOf } from '../../../../../src/diagrams/activity/layout/compress/shapes-of.js';
import type { ShapesOfInput } from '../../../../../src/diagrams/activity/layout/compress/shapes-of.js';
import type { ActivityNodeGeo, ActivityEdgeGeo } from '../../../../../src/diagrams/activity/layout.old.js';
import type { EdgeMeta } from '../../../../../src/diagrams/activity/layout/swimlane-placement.js';
import type { Reservation } from '../../../../../src/diagrams/activity/layout/hexagon-reservations.js';
import type { StringBounder } from '../../../../../src/diagrams/activity/tiles/tile.js';
import { resolveTheme } from '../../../../../src/core/theme.js';

const theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };
const bounder: StringBounder = { getDimension: (text: string) => ({ width: text.length * 6, height: 11 }) };

function baseInput(overrides: Partial<ShapesOfInput> = {}): ShapesOfInput {
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    swimlanes: [],
    reservations: [],
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

  it('if-merge emits no shape (FtileEmpty#drawU draws nothing)', () => {
    expect(shapesOf(baseInput({ nodes: [node('if-merge')] }))).toHaveLength(0);
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

  it('a parallel-in edge tags its arrowhead polygonSkipMode: x', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta('parallel-in')] }));
    expect(shapes[0]!.polygonSkipMode).toBe('x');
  });

  it('a parallel-out edge also tags polygonSkipMode: x', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta('parallel-out')] }));
    expect(shapes[0]!.polygonSkipMode).toBe('x');
  });

  it('a default-shape edge carries no polygonSkipMode', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta('default')] }));
    expect(shapes[0]!.polygonSkipMode).toBeUndefined();
  });

  it('midArrow adds a second polygon at the longest segment midpoint', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 10 },
      ],
      midArrow: true,
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    // terminal arrowhead (last point) + mid arrowhead (longest segment: (0,0)->(100,0))
    expect(shapes).toHaveLength(2);
    expect(shapes[1]!.kind).toBe('polygon');
  });

  it('an edge label is measured with the bounder and placed like renderEdgeLabel (no color)', () => {
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
      label: 'ok',
    };
    const shapes = shapesOf(baseInput({ edges: [edge], edgeMeta: [meta()] }));
    const textShape = shapes.find((s) => s.kind === 'text')!;
    // mid = points[Math.floor(2/2)] = points[1] = (0, 20); no color -> (midX+4, midY-4)
    expect(textShape).toEqual({ kind: 'text', x: 4, y: 16, width: 12, height: 11 });
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
