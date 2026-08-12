/**
 * Class diagram DOT-edge construction -- split out of ./class-dot-graph.ts
 * (S-A, pure relocation, no logic change) to keep that file under the repo's
 * 500-line-per-file cap, same split rationale as ./class-object-fields.ts's
 * own module doc (split from ./class-object-sizing.ts) and
 * ./class-map-port-rows.ts's (split from ./class-port-rows.ts).
 *
 * Owns the edge-decoration map and the per-relationship DOT edge builder;
 * node/cluster/graph-assembly stays in ./class-dot-graph.ts, which calls
 * {@link buildDotEdges} back in (one-directional, no cycle).
 */

import type { ClassDiagramAST, Relationship, RelationshipType } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotInputEdge } from '../../core/graph-layout.js';
import { findFreestandingNoteRelationshipIndices } from './note-freestanding.js';
import { edgeLabelAttrs } from './class-layout-helpers.js';
import { edgePortAttrs } from './class-port-rows.js';
import type { EdgeGeo } from './layout.js';
import { dotEdgeRunsReversed } from './class-dot-edge-order.js';

// ---------------------------------------------------------------------------
// Edge decoration map
// ---------------------------------------------------------------------------

interface EdgeDecoration {
  targetDecor: EdgeGeo['targetDecor'];
  sourceDecor: EdgeGeo['sourceDecor'];
  dashed: boolean;
}

export const EDGE_DECORATION_MAP: Record<RelationshipType, EdgeDecoration> = {
  extension:      { targetDecor: 'triangle',     sourceDecor: 'none',         dashed: false },
  implementation: { targetDecor: 'triangle',     sourceDecor: 'none',         dashed: true  },
  composition:    { targetDecor: 'none',          sourceDecor: 'filledDiamond', dashed: false },
  aggregation:    { targetDecor: 'none',          sourceDecor: 'diamond',      dashed: false },
  dependency:     { targetDecor: 'open',          sourceDecor: 'none',         dashed: true  },
  association:    { targetDecor: 'open',          sourceDecor: 'none',         dashed: false },
  usage:          { targetDecor: 'none',          sourceDecor: 'none',         dashed: true  },
};


/** `FontParam.ARROW(13, normal)` (klimt/font/FontParam.java:54) --
 *  relationship-label default, distinct from `CLASS(12)`/`theme.fontSize`
 *  (14, this port's own default). G5/C0 jar-verified gap: `bejusa-95-
 *  gafo325`'s `"contains"` relationship label renders at jar size 13
 *  (48.425px), not our prior size-14 measurement (52.15px). Already
 *  flagged as a KNOWN, deliberately-unfixed gap in `class-layout-
 *  helpers.ts#CARDINALITY_FONT_SIZE`'s own doc comment ("NOT the same
 *  font `edgeLabelAttrs` ... measures with for DOT-gate sizing"). No
 *  `skinparam ArrowFontSize` override path exists yet (`core/
 *  skinparam.ts#ELEMENT_BUCKET_SNAMES` omits `'arrow'`) -- bare DEFAULT
 *  only.
 *
 *  S-A: exported (was module-private) -- ./class-dot-graph.ts's
 *  `buildDotNodesAndEdges` (stays behind) is its only OTHER consumer and
 *  now reaches it across the new module boundary. */
export const ARROW_LABEL_FONT_SIZE = 13;

/** Under `skinparam linetype ortho`, svek routes the main edge label through
 *  `xlabel` instead of `label` (SvekEdge.java:434-441: dotSplines == ORTHO
 *  branch) — taillabel/headlabel are unaffected (upstream only tests
 *  `dotMode`/`dotSplines` in the `hasNoteLabelText()` branch). Mutates in
 *  place; called only when linetype is ortho. */
function moveLabelToXlabel(attrs: NonNullable<DotInputEdge['attributes']>): void {
  if (attrs.label === undefined) return;
  attrs.xlabel = attrs.label;
  attrs.xlabelWidth = attrs.labelWidth!;
  attrs.xlabelHeight = attrs.labelHeight!;
  delete attrs.label;
  delete attrs.labelWidth;
  delete attrs.labelHeight;
}

/** Build one dot edge per relationship, with minlen + label attributes. An
 *  endpoint that is a package cluster is routed to that cluster's point anchor. */
interface DotEdgeAttrContext {
  font: { family: string; size: number };
  measurer: StringMeasurer;
  linetype: Theme['linetype'];
  kindBIndices: ReadonlySet<number>;
  /** B1/M1: ids of the leaves emitted as RECTANGLE_HTML_FOR_PORTS row tables,
   *  the only endpoints a `::member` port may legally attach to. */
  portRowIds: ReadonlySet<string>;
}

/** One relationship's DOT edge attributes -- split out of `buildDotEdges`
 *  (G2/N16) to keep that function's own CCN under the project's complexity
 *  cap after adding the Kind-B `noArrow` gate. */
function buildDotEdgeAttrs(rel: Relationship, i: number, ctx: DotEdgeAttrContext): NonNullable<DotInputEdge['attributes']> {
  const attrs = { minLen: (rel.length ?? 2) - 1, ...edgeLabelAttrs(rel, ctx.font, ctx.measurer) };
  if (ctx.linetype === 'ortho') moveLabelToXlabel(attrs);
  if (rel.invis === true) attrs.invis = true;
  if (rel.weight !== undefined) attrs.weight = rel.weight;
  // G2/N16 Kind B: a freestanding note's ONE real relationship connector
  // must route with NO arrow-clip reservation (the SAME `noArrow` fix N14
  // already applied to the synthetic note-attachment edge) -- computed
  // PRE-layout since it affects the spline's own routed endpoint, not just
  // its rendered decoration (`note-freestanding.ts`'s own doc comment).
  if (ctx.kindBIndices.has(i)) attrs.noArrow = true;
  return attrs;
}

/** Rendering inputs {@link buildDotEdges} needs beyond `ast`/`anchors` --
 *  bundled purely to stay under the project's per-function param cap (T2
 *  added `classPortShortNames` to what was already `font`/`measurer`/
 *  `linetype`). */
interface DotEdgesRenderCtx {
  font: { family: string; size: number };
  measurer: StringMeasurer;
  linetype: Theme['linetype'];
  /** T2: `classPortShortNamesById`'s output -- ADR-4's declared port-name
   *  sets, row-port leaves only (`isRowPortKind`: class family + object). */
  classPortShortNames: ReadonlyMap<string, Set<string>>;
}

/** S-A: exported (was module-private) so ./class-dot-graph.ts's
 *  `buildDotNodesAndEdges` can call it across the new module boundary --
 *  the one unavoidable export widening this pure relocation requires. */
export function buildDotEdges(
  ast: ClassDiagramAST,
  anchors: Map<string, string>,
  render: DotEdgesRenderCtx,
): DotInputEdge[] {
  const { font, measurer, linetype, classPortShortNames } = render;
  const kindBIndices = findFreestandingNoteRelationshipIndices(ast.notes, ast.relationships, ast.classifiers);
  // ADR-3: unconditional whenever the TARGET carries row bands at all -- a
  // `map` (its own flat-sizer bands) or an `isRowPortKind` leaf -- class
  // family or object -- with a declared port-name set (T2's
  // `classPortShortNamesById`, ADR-4). Neither
  // set membership depends on whether any row actually WON an election
  // (`bicabi-42-coto932`'s dangling-port control) -- `edgePortAttrs` must
  // not re-derive that from `portRows.length`.
  const portRowIds = new Set([
    ...ast.classifiers.filter((c) => c.kind === 'map').map((c) => c.id),
    ...classPortShortNames.keys(),
  ]);
  const ctx: DotEdgeAttrContext = { font, measurer, linetype, kindBIndices, portRowIds };
  return ast.relationships.map((rel: Relationship, i: number) => {
    const swap = dotEdgeRunsReversed(rel);
    const from = swap ? rel.to : rel.from;
    const to = swap ? rel.from : rel.to;
    const dotFrom = anchors.get(from) ?? from;
    const dotTo = anchors.get(to) ?? to;
    const attrs = buildDotEdgeAttrs(rel, i, ctx);
    Object.assign(attrs, edgePortAttrs(rel, swap, dotFrom, dotTo, ctx.portRowIds));
    return { id: `edge-${i}`, from: dotFrom, to: dotTo, attributes: attrs };
  });
}
