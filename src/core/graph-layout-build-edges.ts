/**
 * `addEdges` — split out of ./graph-layout-build.ts (500-line file-cap
 * compliance, forced by G7 T14b's border-point wiring additions; pure move,
 * no behavior change). Owns edge declarations with the (tail,head)→id
 * `EdgeIndex` the snapshot mapper consumes, mirroring `svek-dot-emit.ts`'s
 * per-edge attr assembly (`SvekEdge`) for the real @knowvah/dot-engine layout call.
 * Re-exported verbatim from `graph-layout-build.ts` so `graph-layout.ts` (and
 * any other pre-existing importer) keeps working unchanged.
 */
import type { GvGraphBuilder } from '@knowvah/dot-engine';
import type { DotInputEdge, DotInputGraph } from './graph-layout.types.js';

/** `plantuml.skin`'s `arrow { FontSize 13 }` block (`svek/GraphvizImageBuilder
 *  .java#getStyleArrowCardinality` resolves the `arrow.cardinality` style,
 *  which falls through to the plain `arrow` block — no diagram in the corpus
 *  overrides `cardinality` specifically) — the font @knowvah/dot-engine must measure
 *  `tailLabel`/`headLabel` text with so its `xladjust` placement search uses
 *  the same box size jar's own `cardinalityFont` would. */
export const CARDINALITY_FONT_SIZE = 13;

/** Maps @knowvah/dot-engine (tail,head)-keyed edges back to our edge ids. */
export interface EdgeIndex {
  /** (tail,head) → our edge ids, in input order (consumed left-to-right). */
  idQueues: Map<string, string[]>;
  inputEdgeById: Map<string, DotInputEdge>;
}

export const edgeKey = (tail: string, head: string): string => `${tail} ${head}`;

/** The empty FIXEDSIZE reservation jar hands graphviz for an edge label —
 *  `SvekEdge#appendTable` (SvekEdge.java:504-521), whose `(int)` casts are
 *  the `Math.trunc` here. Graphviz draws nothing; jar draws the text itself
 *  from the box graphviz reserved. */
const fixedSizeTable = (width: number, height: number): string =>
  `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.trunc(width)}" ` +
  `HEIGHT="${Math.trunc(height)}"><TR><TD></TD></TR></TABLE>`;

export function addEdges(b: GvGraphBuilder, input: DotInputGraph): EdgeIndex {
  const nodeIds = new Set(input.nodes.map((n) => n.id));
  const idQueues = new Map<string, string[]>();
  const inputEdgeById = new Map<string, DotInputEdge>();
  for (const e of input.edges) {
    // Defensive: skip edges to/from unknown nodes (the old engine dropped
    // dangling edges in buildWorkingGraph).
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    // I9 mechanism (plans/g1-description-svg/ledger.md): callers that draw
    // arrowheads manually (`DotInputGraph.manualArrowheads` — currently only
    // `description`'s SvekEdge/extremity polygons) must tell @knowvah/dot-engine the
    // same `arrowhead=none`/`arrowtail=none` the Svek-DOT text emitter
    // already writes for every diagram type, or it defaults to
    // `arrowhead=normal` and reserves an arrow-length gap when clipping the
    // spline to the target node's boundary — shortening the routed edge by
    // ~10-11px versus both real graphviz and the jar's own layout (verified
    // by feeding one fixture's exact node/edge geometry to both `dot -Txdot`
    // and this seam — splines matched only once the attrs below were added).
    // NOT applied unconditionally: `class`/`state`/`dot`/`json` draw their
    // arrowhead via an SVG `marker-end` sitting at the raw spline endpoint
    // and rely on graphviz's default reservation to leave room for it
    // without overlapping the target box (see `DotInputGraph
    // .manualArrowheads`'s own doc comment) — scoped to avoid regressing
    // their already-correct, already-tested output.
    const a = e.attributes;
    const attrs: Record<string, string> = input.manualArrowheads === true || a?.noArrow === true
      ? { arrowtail: 'none', arrowhead: 'none' }
      : {};
    if (a?.weight !== undefined) attrs.weight = a.weight.toString();
    if (a?.minLen !== undefined) attrs.minlen = a.minLen.toString();
    // A5/T7: a record field port on the TAIL node, resolved by the engine's own
    // `map_rec_port`/`record_port` (`lib/common/shapes.c`), so the edge leaves
    // that specific field instead of the node centre. Upstream emits `P<row>`
    // (`SmetanaForJson.java:224`). Only json sets it; every other caller is
    // unaffected.
    if (a?.tailport !== undefined) attrs.tailport = a.tailport;
    // B1/M1: the head-side counterpart. A RECTANGLE_HTML_FOR_PORTS node's row
    // ports are HTML-table ports (`lib/common/htmltable.c:html_port`), not
    // record fields, but they reach the engine through the same two edge
    // attributes — the jar emits both suffixes on one statement
    // (`sh0006:p48c4…->sh0007:pcb85…`).
    if (a?.headport !== undefined) attrs.headport = a.headport;
    // Not cosmetic: graphviz collapses every edge sharing a `sametail` value
    // onto ONE tail point. Verified on dot-engine 1.4.0 -- with it, an
    // inheritance group's edges all start at the identical point; without,
    // they fan out from the node border. Omitting it here would emit a
    // faithful DOT and then lay it out as if the attribute were absent.
    if (a?.sametail !== undefined) attrs.sametail = a.sametail;
    // Rank-affecting, not decorative: without this the edge still constrains
    // ranks and the diagram gains a rank the jar does not have. dot-engine
    // 1.4.0 honors it (verified: a 3-rank chain collapses to 2).
    if (a?.constraint === false) attrs.constraint = 'false';
    // G8 T2 (spec.md §1a, mirrors `addClusters`' own `hasTitleTable` gate
    // — that seam is T1c's, unmodified here): a caller that supplies BOTH
    // `labelBoxWidth`/`labelBoxHeight` (currently only the state composite
    // pipeline's own plain, note-free labels, `state-composite-edge-label.ts
    // #edgeLabelAttrs`) gets a REAL jar-faithful `<TABLE FIXEDSIZE="TRUE"
    // WIDTH=".." HEIGHT="..">` label reservation instead of the plain-text
    // `label` attr below — the SAME margin+floor box `state-transition-
    // label.ts#attachTransitionLabel` independently recomputes for the draw
    // anchor (D3's "one mechanism, two consumers" shape). Every other caller
    // (class, component, usecase, the flat state pipeline, a state
    // transition with an attached `note on link`) doesn't set these two
    // fields, so its plain-text path below is byte-for-byte unchanged.
    const hasLabelBox = a?.labelBoxWidth !== undefined && a?.labelBoxHeight !== undefined;
    if (a?.label !== undefined && !hasLabelBox) {
      attrs.label = a.label;
      // Measure with a LUT-known font (graphviz's default "Times,serif" warns).
      attrs.fontname = 'Times';
    }
    // G2/N25: feed the ACTUAL text (not just DOT-gate sizing) into the real
    // layout call so @knowvah/dot-engine's own `placeLabels`/`xladjust` (`label/
    // xlabels.ts`, a faithful port of `lib/label/xlabels.c`) computes the
    // same external-label position real graphviz would — see
    // `DotInputEdge.attributes.tailLabel`'s own doc comment for why the
    // angle/distance formula never applies here. `layoutGraph()` extracts
    // the computed position back out via `extractPortLabelPositions` (no
    // public snapshot API exposes it directly — ADR-1 in @knowvah/dot-engine hides
    // the internal `Edge` model).
    // Same seam as `labelBoxWidth`/`labelBoxHeight` above, one edge-end
    // out: jar reserves a FIXEDSIZE TABLE for `taillabel`/`headlabel` too
    // (`SvekEdge.java:447-468` -> `appendTable`), so handing the engine the
    // raw TEXT makes it reserve a box of its OWN measurement instead of
    // jar's. The reserved box is what `getXY`'s `getMinXY` reads, so the
    // difference lands directly on every port label's placement.
    const hasTailBox = a?.tailLabelWidth !== undefined && a?.tailLabelHeight !== undefined;
    const hasHeadBox = a?.headLabelWidth !== undefined && a?.headLabelHeight !== undefined;
    if (a?.tailLabel !== undefined && !hasTailBox) {
      attrs.taillabel = a.tailLabel;
      attrs.labelfontname = 'Times';
      attrs.labelfontsize = CARDINALITY_FONT_SIZE.toString();
    }
    if (a?.headLabel !== undefined && !hasHeadBox) {
      attrs.headlabel = a.headLabel;
      attrs.labelfontname = 'Times';
      attrs.labelfontsize = CARDINALITY_FONT_SIZE.toString();
    }
    const edge = b.addEdge(e.from, e.to, attrs);
    if (a?.label !== undefined && hasLabelBox) {
      // T1c precedent (addClusters' own title-table seam): jar TRUNCATES
      // both dims towards zero here (`appendTable`'s `(int)` cast,
      // SvekEdge.java:504-507), never rounds -- `labelBoxWidth`/
      // `labelBoxHeight` are already exact integers by construction
      // (`computeReservedLabelBox`'s own `Math.floor`/integer-arithmetic
      // formula), so `Math.floor` here is a defensive no-op matching that
      // convention, not a behavior change.
      edge.setHtmlAttr(
        'label',
        `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.floor(a.labelBoxWidth!)}" ` +
          `HEIGHT="${Math.floor(a.labelBoxHeight!)}"><TR><TD></TD></TR></TABLE>`,
      );
    }

    // `Math.trunc` IS `appendTable`'s `(int)` cast (SvekEdge.java:505-506);
    // identical to the `Math.floor` above for these non-negative dims.
    if (a?.tailLabel !== undefined && hasTailBox) {
      edge.setHtmlAttr('taillabel', fixedSizeTable(a.tailLabelWidth!, a.tailLabelHeight!));
    }
    if (a?.headLabel !== undefined && hasHeadBox) {
      edge.setHtmlAttr('headlabel', fixedSizeTable(a.headLabelWidth!, a.headLabelHeight!));
    }

    const k = edgeKey(e.from, e.to);
    const q = idQueues.get(k) ?? [];
    q.push(e.id);
    idQueues.set(k, q);
    inputEdgeById.set(e.id, e);
  }
  return { idQueues, inputEdgeById };
  // #lizard forgives -- pre-existing (unmodified by G5 C7) faithful mirror
  // of SvekEdge's per-edge attr assembly; each branch below is one
  // independently-conditional DOT attr (label/tailLabel/headLabel/weight/
  // minlen/arrowhead override), not decision complexity to simplify.
}
