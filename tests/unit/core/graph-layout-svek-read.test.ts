import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, render, getLayout } from '@knowvah/dot-engine';
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

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/class');

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

  it('reads the cluster title at its parsed polygon corner (:438-440)', () => {
    const c = svekCluster(FRAME, {
      name: 'cluster1',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      label: { x: 82.5, y: 8.5004, width: 15, height: 9 },
    });
    // corner x 75 -> 75; corner y -(8.5004 + 4.5) = -13.0004 -> -13, YDelta
    expect(c.label).toEqual({ x: 82.5, y: 108 - 13 + 4.5, width: 15, height: 9 });
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

/**
 * T11 (docs/graphviz-issues/25-edge-label-published-when-unplaced.md;
 * cdd4 T0d already found delasa class-conformant on dot-engine 1.6.1 with
 * no plantuml-ts change -- this pins that finding through the real read).
 *
 * Real graphviz's force-search (`searchsize`) can fail to find a spot for a
 * centre edge label; when it does, `ED_label(e)->set` stays false and
 * `emit.c#emit_edge_label` (real graphviz, cited at :2891 by the prior
 * diagnosis pass, not re-read this pass) skips the `<text>` draw entirely --
 * real `-Tsvg` never emits it. Upstream's OWN consumer recovers the
 * placement the SAME way: `SvekEdge.java:741-748` calls
 * `getXY(fullSvg, this.noteLabelColor)` (`:808-815`) to scan its OWN
 * rendered `-Tsvg` for the `<text>` tagged with this edge's dedicated debug
 * color; when graphviz drew nothing, `getIndexFromColor` returns -1,
 * `getXY` returns `null`, `this.labelXY` stays `null`, and the draw at
 * `:951` (`if (hasNoteLabelText() && this.labelXY != null ...)`) is
 * skipped -- upstream's own drawing gate is "did the SVG text show up",
 * not "was a label attribute given".
 *
 * `@knowvah/dot-engine` 1.6.1 applies the identical `set` gate directly
 * inside its typed `getLayout()` (no SVG-scan needed in this port, unlike
 * upstream's own mechanism above) -- `EdgeGeometry.label` comes back
 * `undefined`, never a sentinel `{x,y}`, the SAME gate it already applied
 * to `tailLabel`/`headLabel`/`xlabel`. `class/delasa-80-jusu462`'s cached
 * DOT carries 3 real edges graphviz leaves unplaced this way -- read here
 * with the SAME `parse`/`render`/`getLayout()` calls
 * `core/graph-layout.ts#layoutGraph` makes (`engine: 'dot'`,
 * `yAxis: 'up'`), then run through the SAME production `svekFrame`/
 * `svekEdge` this repo's `mapEdges` calls -- no mocking, no synthesized
 * absent-label shape.
 */
describe('svekEdge — an unplaced centre label reads back absent, not a sentinel (T11, issue 25)', () => {
  const dot = readFileSync(join(CACHE, 'delasa-80-jusu462', 'svek-1.dot'), 'utf8');
  const g = parse(dot);
  render(g, 'svg', { engine: 'dot' });
  const snap = getLayout(g, { yAxis: 'up' });
  const frame = svekFrame(snap.bounds.height);
  const byKey = new Map(snap.edges.map((e) => [`${e.tail}->${e.head}`, e]));

  // The 3 edges docs/graphviz-issues/25 names: `sh0166->sh0253`,
  // `sh0253->sh0168`, `sh0253->sh0185` (each carries a real `label=<<TABLE
  // ...>>` in the cached DOT -- a label WAS requested, graphviz just never
  // placed it).
  it.each(['sh0166->sh0253', 'sh0253->sh0168', 'sh0253->sh0185'])(
    '%s: getLayout omits label (requested but unplaced), svekEdge propagates the omission',
    (key) => {
      const ge = byKey.get(key);
      expect(ge).toBeDefined();
      // Absent, not a sentinel `{x, y}` -- the exact distinction issue 25
      // is about: dot-engine 1.6.0 used to publish `{x:0, y:...}` here.
      expect('label' in ge!).toBe(false);
      expect(ge!.label).toBeUndefined();

      const out = svekEdge(frame, ge!, {});
      expect('label' in out).toBe(false);
      expect(out.label).toBeUndefined();
    },
  );

  it('contrast: a placed label on the SAME graph reads back a real point, not undefined', () => {
    const ge = byKey.get('sh0166->sh0172');
    expect(ge).toBeDefined();
    expect(ge!.label).toBeDefined();

    const out = svekEdge(frame, ge!, {});
    expect(out.label).toBeDefined();
    expect(Number.isFinite(out.label!.x)).toBe(true);
    expect(Number.isFinite(out.label!.y)).toBe(true);
  });
});
