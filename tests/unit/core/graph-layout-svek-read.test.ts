import { describe, it, expect } from 'vitest';
import {
  edgeLabelTables,
  svekCluster,
  svekEdge,
  svekFrame,
  svekNodeCorner,
  svekPoint,
  svekY,
  svgDouble,
} from '../../../src/core/graph-layout-svek-read.js';

// cdd3-T-D3: the jar reads graphviz's `-Tsvg` text, not doubles
// (svek/DotStringFactory.java:388-396, graphviz lib/gvc/gvdevice.c:513-528).
const FRAME = { fullHeight: 108 };

describe('svgDouble — gvprintdouble %.02f as Double.parseDouble reads it', () => {
  it('rounds the exact binary value, not the decimal literal', () => {
    // the double nearest 155.425 is 155.42500000000001136..., printf gives 155.43
    expect(svgDouble(155.425)).toBe(155.43);
    // gatula: the corner graphviz draws sits a round-trip hair below the tie
    expect(svgDouble(155.42499)).toBe(155.42);
  });

  it('rounds an exact binary tie half to even, as snprintf does', () => {
    expect(svgDouble(0.125)).toBe(0.12);
    expect(svgDouble(0.375)).toBe(0.38);
    expect(svgDouble(2.625)).toBe(2.62);
    expect(svgDouble(-0.125)).toBe(-0.12);
    expect(svgDouble(-2.875)).toBe(-2.88);
  });

  it('prints |v| < 0.005 as 0, never -0 (gvdevice.c:516)', () => {
    expect(Object.is(svgDouble(-0.004), 0)).toBe(true);
    expect(svgDouble(0.0049)).toBe(0);
  });

  it('keeps two decimals of an ordinary coordinate', () => {
    expect(svgDouble(-107.7449)).toBe(-107.74);
    expect(svgDouble(30.351)).toBe(30.35);
    expect(svgDouble(12)).toBe(12);
  });
});

describe('svekFrame — <svg height="%dpt"> = ROUND(bbHeight + 2*pad)', () => {
  it('adds DEFAULT_GRAPH_PAD 4 each side and rounds half up (emit.c:1249-1250)', () => {
    expect(svekFrame(100.3).fullHeight).toBe(108);
    expect(svekFrame(100.5).fullHeight).toBe(109);
  });
});

describe('svekY / svekPoint — YDelta(fullHeight) over the parsed -y', () => {
  it('parses -y at 2 dp, then adds fullHeight', () => {
    expect(svekY(FRAME, 20.004)).toBe(88);
    expect(svekPoint(FRAME, { x: 24.898, y: 107.744 })).toEqual({ x: 24.9, y: 108 - 107.74 });
  });
});

describe('svekNodeCorner — DotStringFactory#solve node branches', () => {
  it('takes a polygon node corner as the parsed min vertex (:390-396)', () => {
    expect(svekNodeCorner(FRAME, { cx: 100, cy: 50, width: 89.15, height: 30, shape: undefined })).toEqual([
      55.42,
      108 - 65,
    ]);
  });

  it('takes an ellipse node corner as parsed cx - rx, cy - ry (:419-424)', () => {
    const [x, y] = svekNodeCorner(FRAME, { cx: 10.004, cy: 20.004, width: 22.006, height: 22.006, shape: 'circle' });
    expect(x).toBe(10 - 11);
    expect(y).toBe(88 - 11);
  });
});

describe('svekCluster — min/max of the parsed cluster polygon (:429-436)', () => {
  it('returns the parsed top-left and the parsed extent', () => {
    const c = svekCluster(FRAME, { name: 'cluster1', x: 8.004, y: 10.006, width: 50.001, height: 40.003 });
    expect(c.x).toBe(8);
    expect(c.y).toBe(-50.01 + 108);
    expect(c.width).toBeCloseTo(50, 12);
    expect(c.height).toBeCloseTo(40, 12);
  });

  it('moves the cluster label into the YDelta frame unparsed', () => {
    const c = svekCluster(FRAME, {
      name: 'cluster1',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      label: { x: 3.3333, y: 7.7777, width: 5, height: 6 },
    });
    expect(c.label).toEqual({ x: 3.3333, y: 108 - 7.7777, width: 5, height: 6 });
  });
});

describe('edgeLabelTables — SvekEdge#appendTable (int) boxes (:504-521)', () => {
  it('truncates each present label box and skips the rest', () => {
    const t = edgeLabelTables({
      id: 'e',
      from: 'a',
      to: 'b',
      attributes: { tailLabel: '1', tailLabelWidth: 7.23125, tailLabelHeight: 13.9, headLabel: '*' },
    });
    expect(t).toEqual({ label: undefined, xlabel: undefined, tailLabel: [7, 13], headLabel: undefined });
  });

  it('is empty for an edge with no attributes', () => {
    expect(edgeLabelTables(undefined)).toEqual({});
  });
});

describe('svekEdge — SvekEdge#solveLine parsed values', () => {
  const edge = {
    tail: 'a',
    head: 'b',
    points: [{ x: 30.351, y: 107.744 }],
    sp: { x: 1.004, y: 2.004 },
    ep: { x: 3.006, y: 4.006 },
    tailLabel: { x: 46.8973, y: 20.0 },
    headLabel: { x: 5, y: 6 },
    label: { x: 1, y: 2 },
    xlabel: { x: 9, y: 9 },
  };

  it('parses path points and arrow points at 2 dp in the YDelta frame', () => {
    const e = svekEdge(FRAME, edge, {});
    expect(e.points).toEqual([{ x: 30.35, y: 108 - 107.74 }]);
    expect(e.sp).toEqual({ x: 1, y: 106 });
    expect(e.ep).toEqual({ x: 3.01, y: 108 - 4.01 });
  });

  it('parses a tabled label at its polygon corner and re-centres it (getXY :808-815)', () => {
    const e = svekEdge(FRAME, edge, { tailLabel: [7, 13] });
    // corner x: 46.8973 - 3.5 = 43.3973 -> 43.4; corner y: -(20 + 6.5) -> -26.5
    expect(e.tailLabel?.x).toBeCloseTo(43.4 + 3.5, 12);
    expect(e.tailLabel?.y).toBe(-26.5 + 108 + 6.5);
  });

  it('only changes frame for an untabled label', () => {
    const e = svekEdge(FRAME, edge, {});
    expect(e.headLabel).toEqual({ x: 5, y: 102 });
    expect(e.label).toEqual({ x: 1, y: 106 });
    expect(e.xlabel).toEqual({ x: 9, y: 99 });
  });

  it('omits what the snapshot omits', () => {
    const e = svekEdge(FRAME, { tail: 'a', head: 'b', points: [] }, {});
    expect(e).toEqual({ tail: 'a', head: 'b', points: [] });
  });
});
