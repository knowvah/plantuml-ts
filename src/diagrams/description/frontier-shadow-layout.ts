/**
 * frontier-shadow-layout.ts — obtains the "graphviz-assigned rectangle"
 * `FrontierCalculator`'s `initial` parameter needs (`svek/
 * FrontierCalculator.java`'s constructor takes `Cluster.getRectangleArea()`
 * — the raw box graphviz allocated the cluster's own DOT subgraph, parsed
 * from `DotStringFactory.java:425-434`'s `cluster.setPosition(min,max)`
 * BEFORE `manageEntryExitPoint` overwrites it).
 *
 * Geometry comes from `@knowvah/dot-engine`'s public `getLayout()`
 * (`LayoutSnapshot`), which reports every cluster subgraph's own bounding box
 * alongside node centres. `clusters[]` carries `{name, x, y, width, height}`
 * and, under the default `yAxis: 'down'`, `x`/`y` are the box's TOP-LEFT in
 * the screen frame this module returns — so no manual y-flip is needed.
 *
 * This module used to text-parse `render(graph, 'xdot')` instead, because
 * `getLayout()` exposed nodes/edges/overall bounds ONLY through dot-engine
 * 1.0.x. That workaround coupled the port to the engine's text serialization
 * format rather than to its API, and 1.2.x broke it by wrapping node
 * attributes one per line — a change no API contract forbade. It surfaced as
 * six description fixtures comparing an ERROR diagram against their oracle,
 * which is why this now reads the typed snapshot: the scraping had no upstream
 * counterpart to validate against, so nothing could tell us it had gone stale.
 * The replacement was verified to reproduce the scraped values exactly
 * (cluster 8,8→177,121 and port centres 22/69/116/163 at y=22 on the
 * gafegu-06 shape).
 *
 * This module builds a small, ISOLATED shadow graph — mirroring `svek-dot-
 * emit.ts`'s own `portClusterBlock` structure exactly (ports ranked at the
 * cluster's own level with an ordering chain, a nested `${id}ee` subgraph
 * holding the port-chain's anchor) — runs it through @knowvah/dot-engine's public
 * `render(...,'xdot')`, and text-parses the cluster's own `bb=` plus each
 * port's `pos=` back out. It is deliberately NOT wired into the real
 * `layoutGraph()`/`addClusters` construction (the shared seam every diagram
 * type funnels through): reusing that seam here would mean widening the
 * REAL port-cluster's anchor sizing/nesting/edges for every diagram type, a
 * much larger blast radius than this mission's "port FrontierCalculator
 * faithfully" scope. Since a port cluster's horizontal spacing
 * (nodesep-driven) is ALREADY faithful in the real pipeline (verified:
 * `nodeSep`/`rankSep` and the resulting port-to-port gaps match jar's
 * exactly), the caller aligns this shadow calculation's own coordinate
 * frame to the real, already-resolved port positions via a single
 * reference-port translation (`frontier-cluster-bbox.ts
 * #computeAlignedInitial`) — sidestepping any need for the two graphs'
 * internal layouts to share an absolute origin.
 *
 * Scoped to PURE port-only containers (`frontier-cluster-bbox.ts
 * #computePortClusterBbox` only calls this when the cluster's `insides` is
 * empty) — no "insides" placeholder input here; see that module's doc
 * comment for why a mixed cluster falls back to the prior padded-union
 * formula instead of an approximated placeholder through this shadow calc.
 *
 * Node ids the REST of this port assigns (`dotKeyFor`) can carry characters
 * DOT requires quoting (e.g. `set separator .`'s qualified `srv1.br0`) --
 * xdot text-parsing a QUOTED id back out reliably (vs. this module's own
 * choice of always-bare id text) is needless extra risk for ids this
 * module never needs to expose to graphviz's own text syntax at all. So
 * every caller-supplied id is mapped to a synthetic, always-bare internal
 * id (`n0`, `n1`, ...) for graph construction AND xdot parsing, translated
 * back to the caller's own id only in this function's returned map.
 */

import { createGraph, render, getLayout } from '@knowvah/dot-engine';
import '../../core/dot-engine-measurer.js';
import type { RectangleArea, Point } from './frontier-calculator.js';

// The measurer pin now lives in `core/dot-engine-measurer.ts`, imported above
// for its side effect (A5/T7). This module used to install its own, which was
// safe only while every install point pinned the SAME measurer -- see that
// module's doc comment for the bug that stopped being hypothetical.

import { PX_PER_INCH } from '../../core/graph-layout-build.js';
/** graphviz's own subgraph naming rule (`^cluster`) — a single, fixed name
 *  since each call builds exactly one isolated shadow cluster. */
const SHADOW_CLUSTER_NAME = 'clusterpc';
const SHADOW_EE_NAME = 'clusterpcee';
const ANCHOR_ID = 'na';

export interface ShadowPortSpec {
  readonly id: string;
  readonly width: number;
  readonly height: number;
}

export interface ShadowRankSpec {
  readonly rank: 'source' | 'sink';
  readonly ports: readonly ShadowPortSpec[];
}

export interface ShadowLayoutInput {
  readonly ranks: readonly ShadowRankSpec[];
  readonly anchorWidth: number;
  readonly anchorHeight: number;
  readonly nodeSep: number;
  readonly rankSep: number;
  readonly rankdir: 'TB' | 'LR';
}

export interface ShadowLayoutResult {
  /** The cluster's raw graphviz-assigned rect, in this shadow graph's own
   *  y-DOWN frame (not yet aligned to the real pipeline's frame). */
  readonly initial: RectangleArea;
  /** Every port's center point, keyed by the CALLER's own id (this
   *  module's own synthetic internal ids never escape this function), in
   *  the SAME shadow-graph y-DOWN frame. */
  readonly portCenters: ReadonlyMap<string, Point>;
}

/** One port with its caller-facing id resolved to this module's synthetic,
 *  always-bare-DOT-identifier internal id. */
interface SafePort extends ShadowPortSpec {
  readonly safeId: string;
}

interface SafeRank {
  readonly rank: ShadowRankSpec['rank'];
  readonly ports: readonly SafePort[];
}

function inches(px: number): string {
  return (px / PX_PER_INCH).toString();
}

/** Assigns a synthetic, always-bare-DOT-identifier `safeId` (`n0`, `n1`,
 *  ...) to every port, in rank order -- this module's doc comment. */
function assignSafeIds(ranks: readonly ShadowRankSpec[]): SafeRank[] {
  let n = 0;
  return ranks.map((r) => ({
    rank: r.rank,
    ports: r.ports.map((p) => ({ ...p, safeId: `n${n++}` })),
  }));
}

/** Adds a fixed-size, label-less rect node -- matching `graph-layout.ts
 *  #addNodes`' own convention (`fixedsize:true`+empty label means graphviz
 *  uses exactly the declared width/height, no auto-grow-to-content). */
function addFixedNode(
  b: ReturnType<typeof createGraph>,
  id: string,
  width: number,
  height: number,
): void {
  b.addNode(id, {
    shape: 'rect', fixedsize: 'true', label: '',
    width: inches(width), height: inches(height),
  });
}

/** One rank's ordering chain + bare chain-to-anchor link
 *  (`ClusterDotString.printRanks`' hasPort() branch, Cluster.java). */
function addRankChain(
  b: ReturnType<typeof createGraph>,
  sg: ReturnType<ReturnType<typeof createGraph>['addSubgraph']>,
  rank: SafeRank,
  rankIdx: number,
): void {
  const rsub = sg.addSubgraph(`__rank_${rankIdx}`, { rank: rank.rank });
  for (const p of rank.ports) rsub.addNode(p.safeId);
  for (let i = 0; i < rank.ports.length - 1; i++) {
    b.addEdge(rank.ports[i]!.safeId, rank.ports[i + 1]!.safeId, { arrowhead: 'none' });
  }
  // Bare (bracket-less) chain-to-anchor link -- default minlen=1/weight=1.
  b.addEdge(rank.ports[rank.ports.length - 1]!.safeId, ANCHOR_ID, {});
}

/** Builds the isolated shadow graph (see this module's doc comment):
 *  fixed-size port + anchor nodes, ports ranked at the cluster's own level
 *  with an ordering chain to the anchor, anchor nested one level down in
 *  `${id}ee`. */
function buildShadowGraph(
  input: ShadowLayoutInput,
  safeRanks: readonly SafeRank[],
): ReturnType<typeof createGraph> {
  const b = createGraph({ directed: true });
  b.setAttr('nodesep', inches(input.nodeSep));
  b.setAttr('ranksep', inches(input.rankSep));
  if (input.rankdir === 'LR') b.setAttr('rankdir', 'LR');

  for (const r of safeRanks) for (const p of r.ports) addFixedNode(b, p.safeId, p.width, p.height);
  addFixedNode(b, ANCHOR_ID, input.anchorWidth, input.anchorHeight);

  const sg = b.addSubgraph(SHADOW_CLUSTER_NAME, {});
  safeRanks.filter((r) => r.ports.length > 0).forEach((r, i) => addRankChain(b, sg, r, i));

  const ee = sg.addSubgraph(SHADOW_EE_NAME, {});
  ee.addNode(ANCHOR_ID);
  return b;
}

/** Builds and runs the isolated shadow graph (see this module's doc
 *  comment), returning the cluster's raw rect and every port's center
 *  (keyed by the CALLER's own id), in the shadow graph's own y-DOWN
 *  frame. */
export function computePortClusterInitialRect(input: ShadowLayoutInput): ShadowLayoutResult {
  const safeRanks = assignSafeIds(input.ranks);
  const b = buildShadowGraph(input, safeRanks);
  // `render` is called for its LAYOUT side effect, not its output: `getLayout`
  // rejects a graph that has not been laid out rather than returning
  // calloc-zero geometry, and `render` is the documented way to run it
  // through the public API.
  render(b.graph, 'xdot', { engine: 'dot' });
  const snapshot = getLayout(b.graph, { yAxis: 'down' });

  const cluster = snapshot.clusters.find((c) => c.name === SHADOW_CLUSTER_NAME);
  if (cluster === undefined) {
    throw new Error(`frontier-shadow-layout: no cluster ${SHADOW_CLUSTER_NAME} in layout snapshot`);
  }
  const initial: RectangleArea = {
    minX: cluster.x,
    minY: cluster.y,
    maxX: cluster.x + cluster.width,
    maxY: cluster.y + cluster.height,
  };

  const centerById = new Map(snapshot.nodes.map((n) => [n.name, { x: n.x, y: n.y }]));
  const portCenters = new Map<string, Point>();
  for (const r of safeRanks) {
    for (const p of r.ports) {
      const c = centerById.get(p.safeId);
      if (c === undefined) throw new Error(`frontier-shadow-layout: no node ${p.safeId} in layout snapshot`);
      portCenters.set(p.id, c);
    }
  }
  return { initial, portCenters };
}
