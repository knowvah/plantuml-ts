/**
 * Unit tests for `frontier-cluster-bbox.ts` -- `Cluster#manageEntryExitPoint`
 * (`svek/Cluster.java:410-430`) seeded, as upstream is, with the cluster's
 * own graphviz rect (`getRectangleArea()`, set by `DotStringFactory#solve`
 * via `Cluster#setPosition`, `Cluster.java:511-512`).
 */
import { describe, test, expect } from 'vitest';
import {
  computePortClusterBbox,
  type PortClusterInfo,
  type ClusterSpacing,
} from '../../../src/diagrams/description/frontier-cluster-bbox.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';
import type { RectangleArea } from '../../../src/core/svek/FrontierCalculator.js';

function portGeo(id: string, x: number, y: number): DescriptionNodeGeo {
  return { id, symbol: 'port', display: id, x, y, width: 12, height: 12, children: [] };
}

function leafGeo(id: string, x: number, y: number, width: number, height: number): DescriptionNodeGeo {
  return { id, symbol: 'component', display: id, x, y, width, height, children: [] };
}

const TB: ClusterSpacing = { rankdir: 'TB' };

function info(initial: RectangleArea, extra: Partial<PortClusterInfo> = {}): PortClusterInfo {
  return { initial, clusterRects: new Map(), titleWidth: 0, titleHeight: 0, ...extra };
}

describe('computePortClusterBbox -- sokevu-87-toce485 (node n, three portin)', () => {
  test("reproduces the jar's 199.17x116 node box from the real cluster rect", () => {
    // `layoutGraph(...).clusters` for the fixture: x -8, y 88, 231x142; the
    // three port corners are the PORT cells' (cdd4-T6b). Jar in.svg draws the
    // node from 16,119 to 215.17,235 in its own frame (ports at +28,+5).
    const children = [portGeo('p', 0, 108), portGeo('firstportname', 65.17, 108), portGeo('nwd', 163.17, 108)];
    const bbox = computePortClusterBbox(
      children,
      info({ minX: -8, minY: 88, maxX: 223, maxY: 230 }, { titleWidth: 67, titleHeight: 9 }),
      TB,
    );
    expect(bbox.x).toBe(-12);
    expect(bbox.y).toBe(114);
    expect(bbox.width).toBeCloseTo(199.17, 10);
    expect(bbox.height).toBe(116);
  });
});

describe('computePortClusterBbox -- insides (Cluster.java:413-423)', () => {
  const initial: RectangleArea = { minX: 0, minY: 0, maxX: 300, maxY: 200 };
  const port = portGeo('out', 144, -6); // centre (150, 0)

  test('a leaf child is an inside: its own box joins the core', () => {
    // Core 50..150 x 0..60: the port touches maxX and minY, so both stay,
    // and it sits on a corner within DELTA (18) of maxX -> pushMaxX
    // (FrontierCalculator.java:101-137); the untouched sides snap to initial.
    const bbox = computePortClusterBbox([leafGeo('leaf', 50, 50, 10, 10), port], info(initial), TB);
    expect(bbox).toEqual({ x: 0, y: 0, width: 168, height: 200 });
  });

  test('a child cluster contributes its graphviz rect, not its own drawn box', () => {
    // Parent runs first (SvekResult#drawU walks allCluster() in creation
    // order), so the child's rect is still graphviz's: 40..160 swallows the
    // port's x, maxX is no longer touched and snaps to initial.
    const child: DescriptionNodeGeo = { ...leafGeo('child', 50, 50, 10, 10), symbol: 'rectangle' };
    const clusterRects = new Map([['child', { minX: 40, minY: 40, maxX: 160, maxY: 120 }]]);
    const bbox = computePortClusterBbox([child, port], info(initial, { clusterRects }), TB);
    expect(bbox).toEqual({ x: 0, y: 0, width: 300, height: 200 });
  });

  test('ensureMinWidth widens the box to titleWidth + 10 when the title is wider (java:427-428)', () => {
    const bbox = computePortClusterBbox(
      [portGeo('p0', 0, 0)],
      info({ minX: 0, minY: 0, maxX: 40, maxY: 40 }, { titleWidth: 500, titleHeight: 16 }),
      TB,
    );
    expect(bbox.width).toBe(510);
    // FrontierCalculator.ensureMinWidth's `error` correction keeps minX
    // from moving left of initial.minX.
    expect(bbox.x).toBe(0);
  });
});
