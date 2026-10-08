/**
 * lgm-T1b (A3): description `lhead`/`ltail` clip against the rectangle
 * `Cluster#manageEntryExitPoint` left (`svek/Cluster.java:410-436`,
 * `SvekEdge.java:660-672`, `ClusterDotString.java:101-105`), with lines in
 * `allLines()` order — the same shared mutation the state engine uses
 * (`core/svek/FrontierCalculator.ts#ClusterRectangles`).
 *
 * The geometry is hand-built: a description fixture whose port cluster is a
 * link endpoint cannot be compared with the jar yet, because our DOT lacks the
 * `a`/`i` wrapper subgraphs `ClusterDotString.java:91-96` emits for it (see
 * the `it.fails` below), so the layout differs before any clip runs. Every
 * number is the arithmetic of `FrontierCalculator.java:154-167`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildEdgeGeos, type EdgeMapping, type ResultEdge } from '../../../src/diagrams/description/layout-geo-post.js';
import { registerPortCluster, type PortClusterInfo } from '../../../src/diagrams/description/frontier-cluster-bbox.js';
import type { DescriptiveLink } from '../../../src/diagrams/description/ast.js';
import type { DescriptionNodeGeo, EdgeContainerEndpoints } from '../../../src/diagrams/description/layout-helpers.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { mismatchedLinks } from '../../helpers/link-endpoints.js';

const node = (o: Partial<DescriptionNodeGeo> & { id: string }): DescriptionNodeGeo => ({
  symbol: 'component',
  display: o.id,
  x: 0,
  y: 0,
  width: 20,
  height: 20,
  children: [],
  ...o,
});

/** A 200x200 graphviz cluster holding one inside node and one exit port at
 *  the left; its title is 300 wide, so every `ensureMinWidth` call moves the
 *  box (maxX: 200 -> 310 after the first call -> 315 after the second). */
function portCluster(id: string, printIndex: number, x = 0): DescriptionNodeGeo {
  const initial = { minX: x, minY: 0, maxX: x + 200, maxY: 200 };
  const geo = node({
    id,
    x,
    y: 0,
    width: 200,
    height: 200,
    children: [
      node({ id: `${id}.n`, x: x + 40, y: 40 }),
      node({ id: `${id}.p`, symbol: 'port', x: x + 5, y: 45, width: 10, height: 10 }),
    ],
  });
  const info: PortClusterInfo = { initial, clusterRects: new Map([[id, initial]]), titleWidth: 300, titleHeight: 20 };
  registerPortCluster(geo, info, { rankdir: 'TB' }, printIndex);
  return geo;
}

const LINK: DescriptiveLink = { from: 'A', to: 'X', style: 'solid', arrowHead: 'none', length: 1 };
/** Leaves cluster `A` through its right side at y = 100. */
const spline = (): ResultEdge['points'] => [
  { x: 100, y: 100 },
  { x: 150, y: 100 },
  { x: 250, y: 100 },
  { x: 400, y: 100 },
];

function mappingFor(
  geos: readonly DescriptionNodeGeo[],
  edges: readonly ResultEdge[],
  ends: Array<[string?, string?]>,
) {
  const m: EdgeMapping = {
    dotEdgeToLinkIdx: new Map(edges.map((e, i) => [e.id, i])),
    edgeContainerEndpoints: new Map(
      edges.map((e, i): [string, EdgeContainerEndpoints] => {
        const [from, to] = ends[i]!;
        return [
          e.id,
          {
            ...(from !== undefined ? { fromContainerAstId: from } : {}),
            ...(to !== undefined ? { toContainerAstId: to } : {}),
          },
        ];
      }),
    ),
    geoIndex: new Map(geos.flatMap((g) => [g, ...g.children]).map((g) => [g.id, g])),
    dx: 0,
    dy: 0,
  };
  return m;
}

describe('buildEdgeGeos — port-cluster clip (lgm T1b)', () => {
  it('clips each line against the rectangle the lines before it left', () => {
    const a = portCluster('A', 0);
    const edges: ResultEdge[] = [
      { id: 'e0', points: spline() },
      { id: 'e1', points: spline() },
    ];
    const geos = buildEdgeGeos([LINK, LINK], edges, mappingFor([a], edges, [['A'], ['A']]));
    const startX = (i: number): number => geos[i]!.points[0]!.x;
    // First call: box maxX 310; second: 315. The clip lands within a bezier
    // subdivision of the edge (spline-clip.ts: 8 midpoint splits).
    expect(startX(0)).toBeGreaterThan(310);
    expect(startX(0)).toBeLessThan(311);
    expect(startX(1)).toBeGreaterThan(315);
    expect(startX(1)).toBeLessThan(317);
  });

  it('runs lines in link order, not in the layout result’s edge order', () => {
    const a = portCluster('A', 0);
    const edges: ResultEdge[] = [
      { id: 'e0', points: spline() },
      { id: 'e1', points: spline() },
    ];
    const reversed = [edges[1]!, edges[0]!];
    const m = mappingFor([a], edges, [['A'], ['A']]);
    const forward = buildEdgeGeos([LINK, LINK], edges, m);
    const backward = buildEdgeGeos([LINK, LINK], reversed, m);
    expect(backward.map((g) => g.points)).toEqual(forward.map((g) => g.points));
  });

  it('mutates only the LAST printed of the two port clusters a line touches (setProjectionCluster overwrites)', () => {
    const a = portCluster('A', 0);
    const b = portCluster('B', 1, 400);
    const edges: ResultEdge[] = [
      // A -> B: touches both, so only B is made the projection cluster.
      {
        id: 'e0',
        points: [
          { x: 100, y: 100 },
          { x: 250, y: 100 },
          { x: 350, y: 100 },
          { x: 500, y: 100 },
        ],
      },
      // B -> X, leaving B through its right side.
      {
        id: 'e1',
        points: [
          { x: 500, y: 100 },
          { x: 700, y: 100 },
          { x: 900, y: 100 },
          { x: 1200, y: 100 },
        ],
      },
    ];
    const toB: DescriptiveLink = { ...LINK, to: 'B' };
    const fromB: DescriptiveLink = { ...LINK, from: 'B' };
    const [first, second] = buildEdgeGeos([toB, fromB], edges, mappingFor([a, b], edges, [['A', 'B'], ['B']]));
    // A kept its graphviz box (maxX 200): the tail clip lands just past 200, not
    // past the 310 an adjusted A would give.
    expect(first!.points[0]!.x).toBeGreaterThan(200);
    expect(first!.points[0]!.x).toBeLessThan(202);
    // B (graphviz maxX 600) was adjusted by the first line and again by the
    // second: its titled box has grown past 700 by the time `e1` clips.
    expect(second!.points[0]!.x).toBeGreaterThan(700);
  });

  it('leaves a container with no port children on its geo box', () => {
    const plain = node({ id: 'A', width: 200, height: 200 });
    const edges: ResultEdge[] = [{ id: 'e0', points: spline() }];
    const [geo] = buildEdgeGeos([LINK], edges, mappingFor([plain], edges, [['A']]));
    expect(geo!.points[0]!.x).toBeGreaterThan(200);
    expect(geo!.points[0]!.x).toBeLessThan(202);
  });
});

describe('description port cluster against the jar', () => {
  const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/lgm-T1b/desc-port-cluster-lines');

  // KNOWN GAP, separate mechanism: `ClusterDotString.java:91-96` wraps a port
  // cluster that is a link endpoint in `a`/`i` subgraphs (`subgraph cluster6a`,
  // `cluster6i` in the jar's dump), which the description DOT emitter does not
  // write, so graphviz places the nodes differently before any clip runs. When
  // that lands this test starts passing and `it.fails` flags it for removal.
  it.fails('renders every link end equal to the jar’s', () => {
    const ours = renderSync(readFileSync(`${FIXTURE}.puml`, 'utf8'), { measurer: new DeterministicMeasurer() });
    expect(mismatchedLinks(ours, readFileSync(`${FIXTURE}.svg`, 'utf8'))).toEqual([]);
  });
});
