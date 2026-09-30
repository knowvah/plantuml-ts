/**
 * cdd7-T2a (bonaco-71-xefu608, D4): the class engine's port leaf after
 * layout -- `Cluster#manageEntryExitPoint` redraws the cluster border
 * through every port centre (`Cluster.java:344-345,410-430`,
 * `FrontierCalculator.java`), and `EntityImagePort#upPosition`
 * (`EntityImagePort.java:75-81`) puts the label above or below the symbol.
 *
 * Oracle numbers: `test-results/dot-cache/unknown/bonaco-71-xefu608/`.
 * Real `dot -Tdot` on its `svek-1.dot` places the cluster at bb
 * (8,8)-(159,148), the port centre at (41,22) and `C` at (92.925,88)
 * 50.15x44 (y-down); the jar's SVG draws the cluster path from (6,39.611) to
 * (142,165.611), the port rect at (18,33.611) and `C` at (75.92,105.611) --
 * i.e. the frontier (23,22)-(159,148) moved by the canvas delta
 * (-17.005,+17.611).
 */
import { describe, it, expect } from 'vitest';
import {
  portFrontierBox,
  entityPortUpPosition,
  entityPortSymbolInk,
  clusterTitleAndAttributeWidth,
} from '../../../src/diagrams/class/class-geo-builders-port.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/class-geo-types.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseClass } from './parse-helper.js';

const measurer = new WidthTableMeasurer();

const BONACO = ['allowmixing', 'Package Pa {', 'portin Pi', 'component C {', '}', '}'];

function leaf(
  id: string,
  box: { x: number; y: number; width: number; height: number },
  usymbol: string,
): ClassifierGeo {
  return { id, kind: 'descriptive', ...box, dividerYs: [], rows: [{ text: id, y: 0, indent: 0 }], usymbol };
}

const PORT = leaf('Pi', { x: 35, y: 16, width: 12, height: 12 }, 'portin');
const C = leaf('C', { x: 92.925, y: 88, width: 50.15, height: 44 }, 'component');
const CLUSTER = { x: 8, y: 8, width: 151, height: 140 };

describe('portFrontierBox (Cluster#manageEntryExitPoint)', () => {
  it('pulls the top border onto the port centre and pushes minX by DELTA', () => {
    const box = portFrontierBox({
      box: CLUSTER,
      members: [PORT, C],
      childBoxes: [],
      rankdir: 'TB',
      titleAndAttributeWidth: 17,
    });
    expect(box).toEqual({ x: 23, y: 22, width: 136, height: 126 });
  });

  it('is skipped when no member is a port', () => {
    expect(
      portFrontierBox({ box: CLUSTER, members: [C], childBoxes: [], rankdir: 'TB', titleAndAttributeWidth: 17 }),
    ).toBe(undefined);
  });

  it('merges child cluster rectangles into insides', () => {
    const child = { x: 20, y: 60, width: 30, height: 70 };
    const box = portFrontierBox({
      box: CLUSTER,
      members: [PORT, C],
      childBoxes: [child],
      rankdir: 'TB',
      titleAndAttributeWidth: 0,
    });
    // child minX 20 < port centre 41: the port no longer touches minX, so minX
    // falls back to the graphviz box (8); no push (|41-8| >= 18).
    expect(box).toEqual({ x: 8, y: 22, width: 151, height: 126 });
  });

  it('widens to getTitleAndAttributeWidth() + 10 (ensureMinWidth)', () => {
    const lone = portFrontierBox({
      box: CLUSTER,
      members: [PORT],
      childBoxes: [],
      rankdir: 'TB',
      titleAndAttributeWidth: 50,
    });
    // core: 2x2 seed at (82.5,77) merged with (41,22) -> (41,22)-(84.5,79); minX
    // pushed to 23 (width 61.5 >= 60, unchanged by ensureMinWidth).
    expect(lone).toEqual({ x: 23, y: 22, width: 136, height: 126 });
    const wide = portFrontierBox({
      box: CLUSTER,
      members: [PORT],
      childBoxes: [],
      rankdir: 'TB',
      titleAndAttributeWidth: 200,
    });
    expect(wide?.width).toBe(210);
    expect(wide?.x).toBe(8); // error = newMinX - initial.minX < 0 -> shifted right onto initial.minX
  });
});

describe('entityPortUpPosition (EntityImagePort#upPosition)', () => {
  it('is up when the node minY is above the parent centre', () => {
    expect(entityPortUpPosition(PORT, { x: 23, y: 22, width: 136, height: 126 })).toBe(true);
  });
  it('is down below the centre, and without a parent', () => {
    expect(entityPortUpPosition({ ...PORT, y: 140 }, { x: 23, y: 22, width: 136, height: 126 })).toBe(false);
    expect(entityPortUpPosition(PORT, undefined)).toBe(false);
  });
});

describe('entityPortSymbolInk', () => {
  it('walks the desc text above the symbol and the RADIUS*2 rect', () => {
    const ink = entityPortSymbolInk(
      { ...PORT, rows: [{ text: 'Pi', y: 0, indent: 0 }], entityPortUp: true },
      defaultTheme,
      measurer,
    );
    // text "Pi" 12.5125 wide, 14 high: x = -(12.513-12)/2, y = -(12+14);
    // LimitFinder#drawText: baseline(-26+10.889) - 14 + 1.5; rect: (-1,-1)..(11,11)
    // (LimitFinder.java:184-188), whose -1 is left of the text's -0.2565.
    expect(ink.minX).toBe(-1);
    expect(ink.minY).toBeCloseTo(-27.611, 3);
    expect(ink.maxX).toBeCloseTo(12.25625, 5);
    expect(ink.maxY).toBe(11);
  });
});

describe('clusterTitleAndAttributeWidth', () => {
  it('is the (int) title width, 0 without a label', () => {
    const ast = parseClass({ lines: BONACO, type: 'class' });
    const ns = ast.namespaces[0]!;
    expect(clusterTitleAndAttributeWidth(ns, ast, defaultTheme, measurer)).toBe(17);
    expect(clusterTitleAndAttributeWidth({ ...ns, display: '' }, ast, defaultTheme, measurer)).toBe(0);
  });
});

describe('bonaco layout: port on the cluster border (jar-final coordinates)', () => {
  const geo = layoutClass(parseClass({ lines: BONACO, type: 'class' }), defaultTheme, measurer);
  it('places the cluster, the port and C where the jar draws them', () => {
    const pa = geo.namespaces.find((n) => n.id === 'Pa')!;
    expect(pa.x).toBeCloseTo(6, 2);
    expect(pa.y).toBeCloseTo(39.611, 3);
    expect(pa.width).toBeCloseTo(136, 3);
    expect(pa.height).toBeCloseTo(126, 3);
    const port = geo.leaves.find((l) => l.id === 'Pa.Pi') as ClassifierGeo;
    expect(port.x).toBeCloseTo(18, 2);
    expect(port.y).toBeCloseTo(33.611, 3);
    expect(port.entityPortUp).toBe(true);
    const c = geo.leaves.find((l) => l.id === 'Pa.C') as ClassifierGeo;
    expect(c.x).toBeCloseTo(75.92, 2);
    expect(c.y).toBeCloseTo(105.611, 3);
  });
  it('sizes the canvas as the jar does (157x180)', () => {
    expect(geo.totalWidth).toBe(157);
    expect(geo.totalHeight).toBe(180);
  });
});

describe('nested package beside a port', () => {
  const lines = ['allowmixing', 'package Pa {', 'portout Po', 'package Q {', 'class X', '}', '}'];
  const geo = layoutClass(parseClass({ lines, type: 'class' }), defaultTheme, measurer);
  it('keeps the child cluster inside the frontier and puts the border on the port centre', () => {
    const pa = geo.namespaces.find((n) => n.id === 'Pa')!;
    const q = geo.namespaces.find((n) => n.id === 'Pa.Q')!;
    const po = geo.leaves.find((l) => l.id === 'Pa.Po') as ClassifierGeo;
    // PORTOUT ranks `sink`: the port sits below Q, so the frontier's maxY is
    // the port centre (touchMaxY) and the label goes below (not upPosition).
    expect(pa.y + pa.height).toBeCloseTo(po.y + po.height / 2, 6);
    expect(pa.y).toBeLessThanOrEqual(q.y);
    expect(pa.x).toBeLessThanOrEqual(q.x);
    expect(pa.x + pa.width).toBeGreaterThanOrEqual(q.x + q.width);
    expect(po.entityPortUp).toBe(false);
  });
});
