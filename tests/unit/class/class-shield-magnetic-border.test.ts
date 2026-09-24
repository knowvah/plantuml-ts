/**
 * cdd2-T12 (CLIP-1a) — a cluster endpoint's magnetic border
 * (`svek/SvekEdge.java:927-941`, `svek/Cluster.java:726-757`,
 * `decoration/symbol/USymbolFolder.java:127-144,242-266`).
 *
 * Fixture expectations are read off each fixture's cached jar `in.svg`:
 * `runane-30-vena766`'s second link ends on package tab-top y=518 and is
 * pulled onto the tab's rule at y=538 (`htitle` 20): its arrow tip is at
 * `297.796,537.896` and the trimmed path ends at `298.246,532.916`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  applyClusterMagneticBorders,
  clusterMagneticBorder,
  type ClipRect,
} from '../../../src/diagrams/class/class-shield-helpers.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { getWTitle } from '../../../src/diagrams/class/class-namespace-shape.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new WidthTableMeasurer();

// A "p1" folder at (100, 200), 150 x 100.
const NS = { x: 100, y: 200, width: 150, height: 100, label: 'p1' };

function rect(): ClipRect {
  const border = clusterMagneticBorder(NS, undefined, defaultTheme, measurer);
  return { x: NS.x, y: NS.y, width: NS.width, height: NS.height, ...(border ? { magneticBorder: border } : {}) };
}

describe('clusterMagneticBorder — Cluster.java:726-757 + USymbolFolder.java:242-266', () => {
  const r = rect();
  const border = r.magneticBorder!;
  // wtitle = title width + 6, htitle = title height + 6 (USymbolFolder.java:127-144).
  const wtitle = getWTitle(measurer, defaultTheme, 'p1', NS.width);

  it('pushes a point on the top edge right of the tab down by htitle', () => {
    const f = border.getForceAt({ x: NS.x + wtitle + 7 + 1, y: NS.y - 0.1 });
    expect(f.getDx()).toBe(0);
    expect(f.getDy()).toBeGreaterThan(0);
  });

  it('pushes a point inside the title band (right of the tab) by the same htitle', () => {
    const top = border.getForceAt({ x: NS.x + wtitle + 20, y: NS.y - 1 }).getDy();
    expect(border.getForceAt({ x: NS.x + wtitle + 1, y: NS.y + 1 }).getDy()).toBe(top);
  });

  it('ramps linearly across the tab slope (delta / (2 * marginTitleX3))', () => {
    const top = border.getForceAt({ x: NS.x + wtitle + 20, y: NS.y - 1 }).getDy();
    expect(border.getForceAt({ x: NS.x + wtitle, y: NS.y - 1 }).getDy()).toBeCloseTo(top / 2, 9);
  });

  it('exerts no force on the tab itself or below the band', () => {
    expect(border.getForceAt({ x: NS.x + 1, y: NS.y - 1 }).getDy()).toBe(0);
    expect(border.getForceAt({ x: NS.x + 100, y: NS.y + 60 }).getDy()).toBe(0);
  });

  it('is MagneticBorderNone for a non-folder symbol or packageStyle rect', () => {
    expect(clusterMagneticBorder(NS, 'node', defaultTheme, measurer)).toBeUndefined();
    expect(clusterMagneticBorder(NS, undefined, { ...defaultTheme, packageStyle: 'rect' }, measurer)).toBeUndefined();
    expect(clusterMagneticBorder(NS, 'folder', defaultTheme, measurer)).toBeDefined();
  });

  it('uses the rect width for an empty title (getWTitle: max(30, width/4))', () => {
    const wide = clusterMagneticBorder({ ...NS, width: 400, label: '' }, undefined, defaultTheme, measurer)!;
    // wtitle = 100, htitle = 10: x = 100 + 100 + 7 is the first full-force column.
    expect(wide.getForceAt({ x: 100 + 107, y: 199 }).getDy()).toBe(10);
    expect(wide.getForceAt({ x: 100 + 99, y: 199 }).getDy()).toBeLessThan(10);
  });
});

describe('applyClusterMagneticBorders — SvekEdge.java:927-941', () => {
  const pts = [
    { x: 300, y: 100 },
    { x: 300, y: 150 },
    { x: 300, y: 180 },
    { x: 230, y: 199.9 },
  ];

  it('moves the end point and its control point onto the tab rule', () => {
    const r = rect();
    const f = r.magneticBorder!.getForceAt(pts[3]!).getDy();
    const out = applyClusterMagneticBorders(pts, undefined, 'p1', new Map([['p1', r]]));
    expect(out[3]!.y).toBeCloseTo(199.9 + f, 9);
    expect(out[2]!.y).toBeCloseTo(180 + f, 9);
    expect(out[0]).toEqual(pts[0]);
  });

  it('is a no-op for a cluster without a magnetic border', () => {
    const r: ClipRect = { x: 100, y: 200, width: 150, height: 100 };
    expect(applyClusterMagneticBorders(pts, 'p1', 'p1', new Map([['p1', r]]))).toEqual(pts);
  });
});

describe('CLIP-1a at fixture level — runane-30-vena766', () => {
  const svg = renderFixtureClass(
    readFileSync('test-results/dot-cache/class/runane-30-vena766/in.puml', 'utf8'),
    measurer,
  );
  const link = (svg.match(/<g class="link"[\s\S]*?<\/g>/g) ?? [])[1]!;

  it('draws the arrow tip on the tab rule (jar 297.796,537.896)', () => {
    expect(link).toMatch(/points="297\.79\d,537\.89\d/);
  });

  it('ends the path at the trimmed, forced end (jar 298.246,532.916)', () => {
    const d = /<path[^>]* d="([^"]+)"/.exec(link)![1]!;
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    expect(nums.at(-1)).toBeCloseTo(532.916, 2);
    expect(nums.at(-3)).toBeCloseTo(532.458, 2);
  });
});
