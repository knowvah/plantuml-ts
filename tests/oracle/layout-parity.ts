/**
 * Layout parity (description-svek-wrappers D1/D2): does OUR layout input lay
 * out to the same geometry as the jar's `svek-N.dot`?
 *
 * `compareStructural` (`./svek-dot.ts`) compares cluster MEMBERSHIP sizes, so a
 * graph that nests or sizes its clusters differently still reads "equal"
 * (`.agent-notes/dot-engine-2.4.0-bump.md`, bamami: jar
 * `cluster6p0 > cluster6 (17x23 TABLE label) > cluster6p1`, ours one plain
 * cluster). This oracle lays BOTH sides out in-process with dot-engine
 * (D2) and compares the result. Test-side instrument; never imported by `src/`.
 *
 * Comparison is order-free with no id map (D1), in this order, reporting only
 * the FIRST differing component:
 *   1. `clusterTree`: cluster subgraph count, then per base cluster its depth,
 *      wrapper chain (`a/p0/i/p1` present, read from the subgraph names,
 *      `ClusterDotString.java:94-158`) and bb
 *   2. `bb`: graph bounding box
 *   3. `nodeSizes`: sorted multiset of node `(w,h)`
 *   4. `nodePositions`: sorted multiset of node `(x,y,w,h)`
 *   5. `edgePos`: sorted multiset of edge `pos` strings (graphviz `-Tdot`)
 * Numbers are compared exactly as dot-engine reports them; there is no epsilon.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:94-158
 */
import { createGraph, getLayout, parse, render } from '@knowvah/dot-engine';
import type { Graph } from '@knowvah/dot-engine';
import { applyGraphAttrs, addNodes, addClusters, addEdges } from '../../src/core/graph-layout-build.js';
// Pins the dot-engine text measurer, exactly as `layoutGraph` does.
import '../../src/core/dot-engine-measurer.js';
import type { DotInputGraph } from '../../src/core/graph-layout.types.js';

export type LayoutDiffComponent = 'clusterTree' | 'bb' | 'nodeSizes' | 'nodePositions' | 'edgePos';

export interface LayoutParityResult {
  equal: boolean;
  /** The first differing component in D1's order; `detail` is at most {@link MAX_DETAIL} chars. */
  firstDiff?: { component: LayoutDiffComponent; detail: string };
}

/** Upper bound on `firstDiff.detail` (task T1a interface contract). */
export const MAX_DETAIL = 200;

/** Any cluster-prefixed subgraph: the base `cluster<N>`, its wrappers
 *  (`ClusterDotString.java:98-115,151-155`: `a`, `p0`, `i`, `p1`) and the
 *  `together` block `cluster<N>t<M>`. Graphviz treats every one as a cluster. */
const CLUSTER_PREFIX = 'cluster';
const BASE_CLUSTER_RE = /^cluster\d+$/;
const WRAPPER_SUFFIXES = ['a', 'p0', 'i', 'p1'] as const;

/** Everything the five components read from one laid-out graph. */
interface LayoutSide {
  clusterCount: number;
  clusterTree: string[];
  bb: string;
  nodeSizes: string[];
  nodePositions: string[];
  edgePos: string[];
}

interface SubgraphEntry {
  name: string;
  /** Number of enclosing base `cluster<N>` subgraphs. */
  depth: number;
}

const QUOTED_RE = /"(?:[^"\\]|\\[\s\S])*"/g;
/** `-Tdot` folds long attribute values with a trailing backslash-newline. */
const LINE_CONTINUATION_RE = /\\\r?\n/g;
const HTML_LABEL_RE = /<<[\s\S]*?>>/g;
const SUBGRAPH_TOKEN_RE = /subgraph\s+([^\s{]+)\s*\{|\{|\}/g;
const EDGE_RE = /->[^[;\n]*\[((?:"(?:[^"\\]|\\[\s\S])*"|[^\]"])*)\]/g;
const POS_RE = /\bpos="([^"]*)"/;

const unfolded = (dotText: string): string => dotText.replace(LINE_CONTINUATION_RE, '');

/** Subgraphs of a `-Tdot` text, in file order, each with its base-cluster depth.
 *  Quoted strings and HTML labels are blanked first so their braces cannot
 *  unbalance the stack. */
function subgraphEntries(dotText: string): SubgraphEntry[] {
  const text = unfolded(dotText).replace(HTML_LABEL_RE, '<>').replace(QUOTED_RE, '""');
  const stack: (string | undefined)[] = [];
  const out: SubgraphEntry[] = [];
  for (const m of text.matchAll(SUBGRAPH_TOKEN_RE)) {
    if (m[0] === '}') {
      stack.pop();
      continue;
    }
    const name = m[1];
    if (name !== undefined) {
      const depth = stack.filter((s) => s !== undefined && BASE_CLUSTER_RE.test(s)).length;
      out.push({ name, depth });
    }
    stack.push(name);
  }
  return out;
}

/** Edge `pos` strings in file order; an unrouted edge contributes `''`. */
function edgePositions(dotText: string): string[] {
  const text = unfolded(dotText).replace(HTML_LABEL_RE, '<>');
  return [...text.matchAll(EDGE_RE)].map((m) => POS_RE.exec(m[1] ?? '')?.[1] ?? '');
}

/** The bb and sorted edge `pos` strings of a `-Tdot` text. Exported so the
 *  native `dot -Tdot` cross-check (D2, stop 8) reads files the same way. */
export function dotTextSummary(dotText: string): { bb: string; edgePos: string[] } {
  const bb = /\bbb="([^"]*)"/.exec(unfolded(dotText))?.[1] ?? '';
  return { bb, edgePos: edgePositions(dotText).sort() };
}

function clusterTreeOf(
  entries: SubgraphEntry[],
  boxes: ReadonlyMap<string, string>,
): { count: number; tree: string[] } {
  const names = new Set(entries.map((e) => e.name));
  const tree: string[] = [];
  for (const e of entries) {
    if (!BASE_CLUSTER_RE.test(e.name)) continue;
    const chain = WRAPPER_SUFFIXES.map((s) => (names.has(`${e.name}${s}`) ? s : '-')).join('/');
    tree.push(`depth ${e.depth} wrappers ${chain} bb ${boxes.get(e.name) ?? '?'}`);
  }
  return { count: entries.filter((e) => e.name.startsWith(CLUSTER_PREFIX)).length, tree: tree.sort() };
}

function sideOf(g: Graph): LayoutSide {
  const dotText = render(g, 'dot');
  const snap = getLayout(g);
  const boxes = new Map(snap.clusters.map((c) => [c.name, `${c.x},${c.y},${c.width},${c.height}`]));
  const { count, tree } = clusterTreeOf(subgraphEntries(dotText), boxes);
  return {
    clusterCount: count,
    clusterTree: tree,
    bb: `${snap.bounds.x},${snap.bounds.y},${snap.bounds.width},${snap.bounds.height}`,
    nodeSizes: snap.nodes.map((n) => `${n.width},${n.height}`).sort(),
    nodePositions: snap.nodes.map((n) => `${n.x},${n.y},${n.width},${n.height}`).sort(),
    edgePos: edgePositions(dotText).sort(),
  };
}

/** Our side: the same builder entry points `layoutGraph` runs
 *  (`src/core/graph-layout.ts`), on the already `withSameContainerConstraints`
 *  graph the layout-input observer captured. */
function oursSide(ours: DotInputGraph): LayoutSide {
  const b = createGraph({ directed: true });
  applyGraphAttrs(b, ours);
  addNodes(b, ours);
  addClusters(b, ours);
  addEdges(b, ours);
  return sideOf(b.graph);
}

const clip = (s: string): string => (s.length <= MAX_DETAIL ? s : `${s.slice(0, MAX_DETAIL - 3)}...`);

type Diff = { component: LayoutDiffComponent; detail: string };

/** First difference of two sorted multisets, or undefined when equal. */
function multisetDiff(component: LayoutDiffComponent, jar: string[], ours: string[]): Diff | undefined {
  const n = Math.min(jar.length, ours.length);
  for (let i = 0; i < n; i++) {
    if (jar[i] !== ours[i]) {
      return {
        component,
        detail: clip(`jar ${jar.length} vs ours ${ours.length}; sorted[${i}] jar ${jar[i]} vs ours ${ours[i]}`),
      };
    }
  }
  if (jar.length === ours.length) return undefined;
  const extra = jar.length > ours.length ? `jar-only ${jar[n]}` : `ours-only ${ours[n]}`;
  return { component, detail: clip(`jar ${jar.length} vs ours ${ours.length}; ${extra}`) };
}

function firstDiffOf(jar: LayoutSide, ours: LayoutSide): Diff | undefined {
  if (jar.clusterCount !== ours.clusterCount) {
    return {
      component: 'clusterTree',
      detail: `cluster subgraphs: jar ${jar.clusterCount} vs ours ${ours.clusterCount}`,
    };
  }
  const tree = multisetDiff('clusterTree', jar.clusterTree, ours.clusterTree);
  if (tree !== undefined) return tree;
  if (jar.bb !== ours.bb) return { component: 'bb', detail: `jar ${jar.bb} vs ours ${ours.bb}` };
  return (
    multisetDiff('nodeSizes', jar.nodeSizes, ours.nodeSizes) ??
    multisetDiff('nodePositions', jar.nodePositions, ours.nodePositions) ??
    multisetDiff('edgePos', jar.edgePos, ours.edgePos)
  );
}

function result(diff: Diff | undefined): LayoutParityResult {
  return diff === undefined ? { equal: true } : { equal: false, firstDiff: diff };
}

/**
 * Compares the layout of the jar's `svek-N.dot` with the layout of OUR captured
 * graph (D1/D2). Both are laid out by dot-engine in this process.
 *
 * Only `nestedDepth === 0` graphs are comparable: the jar dumps no DOT for a
 * Smetana-routed nested embed (`LayoutInputEvent.nestedDepth` in
 * `src/core/graph-layout.ts`). The CALLER filters; this function cannot tell.
 *
 * @param jarSvekDot - the text of one cached `svek-N.dot`
 * @param ours - the `DotInputGraph` from `setLayoutInputObserver`
 */
export function layoutParity(jarSvekDot: string, ours: DotInputGraph): LayoutParityResult {
  const jar = sideOf(parse(jarSvekDot));
  if (ours.nodes.length === 0) {
    // `layoutGraph` returns before building anything for an empty graph.
    return result(firstDiffOf(jar, sideOf(createGraph({ directed: true }).graph)));
  }
  return result(firstDiffOf(jar, oursSide(ours)));
}

/**
 * Multi-page pairing for T2: `svek-1.dot`, `svek-2.dot`, ... pair with the
 * captured `nestedDepth === 0` graphs BY INDEX, in call order (as
 * `scripts/lib/survey-dot-equal.ts` pairs them). A page-count mismatch is a
 * `clusterTree` difference; a page difference is prefixed `page <n>:`.
 */
export function layoutParityPages(jarSvekDots: readonly string[], ours: readonly DotInputGraph[]): LayoutParityResult {
  if (jarSvekDots.length !== ours.length) {
    return result({
      component: 'clusterTree',
      detail: `page count: jar ${jarSvekDots.length} vs ours ${ours.length}`,
    });
  }
  for (let i = 0; i < ours.length; i++) {
    const page = layoutParity(jarSvekDots[i]!, ours[i]!);
    if (!page.equal && page.firstDiff !== undefined) {
      const { component, detail } = page.firstDiff;
      return result({ component, detail: clip(`page ${i + 1}: ${detail}`) });
    }
  }
  return { equal: true };
}
