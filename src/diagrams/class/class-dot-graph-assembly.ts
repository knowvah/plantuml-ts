/**
 * Class diagram `DotInputGraph` attribute-bag assembly -- split out of
 * ./class-dot-graph.ts (T2, `plans/class-divergence-drive/batch-1/
 * T2-ordered-links.md`) purely to keep that file under the repo's
 * 500-line-per-file cap once the SB2 `getOrderedLinks` wiring landed;
 * same split rationale as ./class-dot-edges.ts's own module doc.
 * `buildDotGraph` calls {@link assembleDotInputGraph} back in
 * (one-directional, no cycle).
 */

import type { ClassDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { DotInputCluster, DotInputGraph, DotInputNode, DotInputEdge } from '../../core/graph-layout.js';

/** DOT nodesep/ranksep attrs. Oracle emits nodesep=0.486111in (35px),
 *  ranksep=0.833333in (60px) by default; `skinparam nodesep`/`ranksep`
 *  (theme.nodeSep/rankSep, nonzero) unconditionally replace that default
 *  (SkinParam.java:847-856, DotStringFactory.java:117-133 — no max-clamp)
 *  and skip the emitter's minimum floor (svek-dot-emit resolveSep). */
function sepAttrs(theme: Theme): Partial<DotInputGraph> {
  return {
    nodeSep: theme.nodeSep ?? 35,
    rankSep: theme.rankSep ?? 60,
    ...(theme.nodeSep !== undefined ? { nodeSepExplicit: true } : {}),
    ...(theme.rankSep !== undefined ? { rankSepExplicit: true } : {}),
  };
}

/**
 * Assemble the `DotInputGraph` attribute bag from its already-built parts.
 * Split out of `buildDotGraph` purely to keep that function's own NLOC
 * under the project's per-function cap.
 */
export function assembleDotInputGraph(
  ast: ClassDiagramAST,
  theme: Theme,
  dotNodes: DotInputNode[],
  dotEdges: DotInputEdge[],
  clusterParts: { clusters: DotInputCluster[]; clusterIdByNs: Map<string, string> } | undefined,
): DotInputGraph {
  return {
    nodes: dotNodes,
    edges: dotEdges,
    rankDir: ast.rankdir === 'LR' ? 'LR' : 'TB',
    // D3 (plans/linetype-ortho-routing/decisions.md): forwarded via
    // conditional spread so an absent linetype stays absent on
    // DotInputGraph rather than becoming an explicit `undefined`.
    ...sepAttrs(theme),
    ...(theme.linetype !== undefined ? { linetype: theme.linetype } : {}),
    ...(clusterParts !== undefined ? { clusters: clusterParts.clusters } : {}),
    // G2/N29: class's renderer draws EVERY edge decoration as an inline
    // extremity polygon (`renderer-arrowhead.ts`, landed N1 mechanism 2 --
    // the old SVG `<marker>`-reference `targetMarker`/`sourceMarker`
    // functions were fully removed then; `renderer.ts`'s own header doc:
    // "zero `<marker>`/`markerEnd` anywhere", grep-verified). This flag's
    // own doc comment (`graph-layout.types.ts#manualArrowheads`) still
    // lists "class" among the marker-end callers that rely on graphviz's
    // default ~10-11px arrow-clip spline reservation -- stale since N1's
    // rewrite, never updated when class stopped using markers. Every jar
    // svek DOT edge line already carries `arrowtail=none,arrowhead=none`
    // unconditionally (`svek-dot-emit.ts`, confirmed corpus-wide), so
    // withholding this flag left @knowvah/dot-engine reserving a real-graphviz-
    // divergent gap at every edge endpoint -- root cause of the ~400-fixture
    // "@knowvah/dot-engine routing divergence" attribution the orchestrator's
    // 2026-07-17 falsification entry re-opened (bosiki-11-xaza958/
    // farina-07-foti023 byte-diff evidence, `plans/g2-class-svg/ledger.md`
    // N29): the shortfall was a seam invocation gap, not an engine bug.
    manualArrowheads: true,
  };
}
