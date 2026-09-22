/**
 * cdd-T17 (M8): the ADDITIVE role-label mirror geometry, plus
 * `attachPortLabels` itself -- split out of `class-edge-label-anchor.ts`
 * (500-line hook cap; the role mirror pushed that file over) purely to keep
 * both files under the cap. `class-edge-label-anchor.ts` re-exports
 * `roleLabelAnchors`/`attachPortLabels` so no consumer's import path
 * changed (same split precedent as that file's own header: pre-authorised,
 * "500-line splits into re-exported siblings").
 */
import type { Relationship } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { QuantifierLineGeo } from './class-geo-edge-extras.js';
import type { EdgeGeo } from './layout.js';
import { CARDINALITY_FONT_SIZE } from './class-layout-helpers.js';
import { dotEdgeRunsReversed } from './class-dot-edge-order.js';
import {
  measureLabelLines,
  labelLinesFromTopLeft,
  placeQuantifierBox,
  portLabelAnchor,
  type PortLabelContext,
} from './class-edge-label-anchor.js';

/**
 * cdd-T17 (M8): the role's own box mirrors the ALREADY-PLACED quantifier
 * box across the line direction (`SvekEdge.java:1025-1063`, `drawRoleLabel`
 * -- doc comment: "Draws a role label on the opposite side of the line from
 * the quantifier. For vertical lines, the role is placed on the other side
 * of the line's X. For horizontal lines, the role is placed on the other
 * side of the line's Y."). No `manageCollision` pass: upstream draws the
 * role straight from this offset, never through `getXY`'s reserved DOT
 * marker (that reservation stays the quantifier's alone -- or the role's
 * OWN text in the fallback case, which never reaches this function; see
 * `class-layout-edge-labels.ts#computeMultiplicityAttrs`).
 *
 * Three branches, `SvekEdge.java:1033-1063`:
 * - Degenerate (`|dirX|+|dirY| < 0.001`, a zero-length line): role sits
 *   directly BELOW the quantifier's own top-left, no gap.
 * - `|dirY| >= |dirX|` (mostly vertical): mirror across the line's OWN x
 *   (`thisEndpoint.x`) -- role sits `gap=2` past whichever side of the
 *   line the quantifier's own CENTER is NOT on, at the quantifier's SAME
 *   y. Jar-verified against `mugobo-34-fede498`'s vertical `User--Item`
 *   link: quantifier box left=6 width=127.319 (`qCenterX=69.66 < lineX=
 *   149.23`) -> role x = 149.23+2 = `151.23`, exactly jar's `<text
 *   x="151.23">1</text>`/`<text x="151.23">items</text>` (both ends share
 *   `lineX` -- the line is perfectly vertical, so `thisEndpoint.x` is the
 *   SAME 149.23 whichever end is queried) -- and role y = quantifier's OWN
 *   box top, landing role and quantifier on the IDENTICAL baseline (jar:
 *   both `y="73.253"` on the tail, both `y="104.032"` on the head).
 * - `|dirY| < |dirX|` (mostly horizontal): the same mirror, across the
 *   line's OWN y instead -- role x = quantifier's own box left.
 */
function mirrorRoleBoxTopLeft(
  quantifierBox: { pos: { x: number; y: number }; maxWidth: number; totalHeight: number },
  roleDim: { width: number; height: number },
  thisEndpoint: { x: number; y: number },
  otherEndpoint: { x: number; y: number },
): { x: number; y: number } {
  const ROLE_GAP = 2;
  const dirX = otherEndpoint.x - thisEndpoint.x;
  const dirY = otherEndpoint.y - thisEndpoint.y;
  if (Math.abs(dirX) + Math.abs(dirY) < 0.001) {
    return { x: quantifierBox.pos.x, y: quantifierBox.pos.y + quantifierBox.totalHeight };
  }
  if (Math.abs(dirY) >= Math.abs(dirX)) {
    const qCenterX = quantifierBox.pos.x + quantifierBox.maxWidth / 2;
    const lineX = thisEndpoint.x;
    const x = qCenterX < lineX ? lineX + ROLE_GAP : lineX - roleDim.width - ROLE_GAP;
    return { x, y: quantifierBox.pos.y };
  }
  const qCenterY = quantifierBox.pos.y + quantifierBox.totalHeight / 2;
  const lineY = thisEndpoint.y;
  const y = qCenterY < lineY ? lineY + ROLE_GAP : lineY - roleDim.height - ROLE_GAP;
  return { x: quantifierBox.pos.x, y };
}

/** The ADDITIVE role label's per-line anchors -- present only alongside a
 *  real quantifier on the SAME end (see {@link mirrorRoleBoxTopLeft}'s doc
 *  comment). 5 params: the role text, the quantifier's OWN already-placed
 *  box (from `class-edge-label-anchor.ts#placeQuantifierBox`), this end's
 *  line endpoints (this end / the other end, `SvekEdge.java:962-964`'s
 *  `dotPath.getStartPoint()`/`getEndPoint()`), the measurer, and the
 *  cardinality font -- bundling the last two into one object would only
 *  obscure which is which against `quantifierLineAnchors`'s identical
 *  positional pair. */
export function roleLabelAnchors(
  roleText: string,
  quantifierBox: { pos: { x: number; y: number }; maxWidth: number; totalHeight: number },
  endpoints: { thisEnd: { x: number; y: number }; otherEnd: { x: number; y: number } },
  measurer: StringMeasurer,
  font: FontSpec,
): QuantifierLineGeo[] {
  const measured = measureLabelLines(roleText, font, measurer);
  const topLeft = mirrorRoleBoxTopLeft(
    quantifierBox,
    { width: measured.maxWidth, height: measured.totalHeight },
    endpoints.thisEnd,
    endpoints.otherEnd,
  );
  return labelLinesFromTopLeft(measured, topLeft, font, measurer);
}

/** One end's multiplicity/role inputs to {@link attachEndPortLabel} --
 *  bundled to stay under the project's per-function param cap. `role` is
 *  ALREADY swap-resolved by the caller, same as `multiplicity`. */
interface EndLabelInput {
  readonly multiplicity: string | undefined;
  readonly role: string | undefined;
  readonly centerX: number | undefined;
  readonly centerY: number | undefined;
  readonly thisEnd: { x: number; y: number } | undefined;
  readonly otherEnd: { x: number; y: number } | undefined;
}

/** One end's computed anchors -- the legacy single anchor (`tailLabel`/
 *  `headLabel`, T6's note: "the renderer no longer reads" this, kept for
 *  the hand-built-literal fallback `renderer-edge-extras.ts
 *  #renderEdgeCardinalityLabels` still carries), the split quantifier-or-
 *  role-fallback lines, and the additive role lines (empty when this end
 *  carries no ADDITIVE role). */
interface EndLabelResult {
  readonly anchor?: { text: string; x: number; y: number; width: number };
  readonly lines: QuantifierLineGeo[];
  readonly roleLines: QuantifierLineGeo[];
}

/**
 * One end (tail or head) of {@link attachPortLabels} -- factored out so
 * that function stays under the project's per-function NLOC cap once the
 * role mirror joined the quantifier/fallback logic it already ran twice
 * (tail, head). `text = input.multiplicity ?? input.role` mirrors
 * `class-layout-edge-labels.ts#computeMultiplicityAttrs`'s IDENTICAL
 * fallback exactly (`SvekEdge.java:447-466`) -- the reserved DOT position
 * this function reads (`input.centerX`/`centerY`) only exists because that
 * function reserved a box for ONE of the two, so re-deriving the same
 * `??` here is what keeps the two in sync, not a coincidence.
 */
function attachEndPortLabel(
  input: EndLabelInput,
  cardinalityFont: FontSpec,
  splitFont: FontSpec,
  measurer: StringMeasurer,
  nodes: DotLayoutResult['nodes'],
): EndLabelResult {
  const text = input.multiplicity ?? input.role;
  if (text === undefined || input.centerX === undefined || input.centerY === undefined) {
    return { lines: [], roleLines: [] };
  }
  const center = { x: input.centerX, y: input.centerY };
  const anchor = portLabelAnchor(text, center, measurer, cardinalityFont, nodes);
  const placed = placeQuantifierBox(text, center, measurer, splitFont, nodes);
  const lines = labelLinesFromTopLeft(placed, placed.pos, splitFont, measurer);
  const roleLines: QuantifierLineGeo[] = [];
  // T17/M8: ADDITIVE only when BOTH a multiplicity and a role are present
  // on this end -- an end with a role but no multiplicity already took the
  // fallback above (`text === input.role`), and its role ink is already
  // fully drawn via `lines`, so mirroring it again here would duplicate it.
  if (
    input.multiplicity !== undefined &&
    input.role !== undefined &&
    input.thisEnd !== undefined &&
    input.otherEnd !== undefined
  ) {
    roleLines.push(
      ...roleLabelAnchors(
        input.role,
        placed,
        { thisEnd: input.thisEnd, otherEnd: input.otherEnd },
        measurer,
        splitFont,
      ),
    );
  }
  return { anchor, lines, roleLines };
}

/**
 * The tail/head {@link EndLabelInput} pair -- factored out of
 * {@link attachPortLabels} purely to keep that function under the project's
 * per-function NLOC/CCN caps once the role mirror joined the pre-existing
 * swap logic.
 *
 * T11: `edgeResult.tailLabelX/Y` and `headLabelX/Y` are @knowvah/dot-engine's
 * placement for the DOT `taillabel`/`headlabel` attributes -- which
 * `class-dot-edges.ts#buildDotEdgeAttrs` now reserves from the SWAPPED
 * quantifier pair whenever `dotEdgeRunsReversed(rel)` is true (same root
 * this function must follow, or the rendered `<text>` carries the wrong
 * string at the right position -- the second consumer T3's diagnosis named,
 * `.agent-notes/m3-tail-head-swap.md`). `swap` is pure over `rel`, so
 * recomputing it here reproduces `class-dot-edges.ts`'s own `swap` exactly
 * (`class-dot-graph.ts#computeSwappedEdges` builds its `swappedEdges` set
 * the identical way).
 *
 * T17/M8: `Link.java:116-117`'s `getInv()` swaps `role2`/`role1` the SAME
 * way it swaps `quantifier2`/`quantifier1` -- reproduced here, unlike
 * `class-dot-edges.ts#swappedRel`, which does NOT yet swap `fromRole`/
 * `toRole` for the DOT-reservation fallback (see `class-layout-edge-labels
 * .ts#computeMultiplicityAttrs`'s own doc comment: unreached by the corpus,
 * filed as a follow-on).
 *
 * cdd-T13 (M1): `edgeGeo.points[0]`/`.at(-1)` run entity1 -> entity2
 * (`class-edge-geo.ts#buildEdgeGeos`'s own doc comment on `matchesFromTo`)
 * -- the SAME endpoints upstream's `dotPath.getStartPoint()`/`getEndPoint()`
 * name for `startTailRoleText`/`endHeadRoleText`'s own `drawRoleLabel` calls
 * (`SvekEdge.java:962-964,975-977`) on every corpus fixture this task
 * jar-verified (`dotEdgeReversed === false`, no distance-check flip).
 */
function buildEndLabelInputs(
  rel: Relationship,
  edgeGeo: EdgeGeo,
  edgeResult: DotLayoutResult['edges'][number],
): { tail: EndLabelInput; head: EndLabelInput } {
  const swap = dotEdgeRunsReversed(rel);
  const thisEndTail = edgeGeo.points[0];
  const otherEndTail = edgeGeo.points.at(-1);
  return {
    tail: {
      multiplicity: swap ? rel.toMultiplicity : rel.fromMultiplicity,
      role: swap ? rel.toRole : rel.fromRole,
      centerX: edgeResult.tailLabelX,
      centerY: edgeResult.tailLabelY,
      thisEnd: thisEndTail,
      otherEnd: otherEndTail,
    },
    head: {
      multiplicity: swap ? rel.fromMultiplicity : rel.toMultiplicity,
      role: swap ? rel.fromRole : rel.toRole,
      centerX: edgeResult.headLabelX,
      centerY: edgeResult.headLabelY,
      thisEnd: otherEndTail,
      otherEnd: thisEndTail,
    },
  };
}

/** Attach `tailLabel`/`headLabel` (G2/N25) if `graph-layout.ts` computed a
 *  position for them -- absent when the relationship carries no
 *  `fromMultiplicity`/`toMultiplicity`/`fromRole`/`toRole` (`edgeLabelAttrs`
 *  then never set `tailLabel`/`headLabel` on the DOT input, so
 *  `extractPortLabelPositions` never ran for this edge). */
export function attachPortLabels(
  edgeGeo: EdgeGeo,
  rel: Relationship,
  edgeResult: DotLayoutResult['edges'][number],
  ctx: PortLabelContext,
): void {
  const { measurer, fontFamily, nodes } = ctx;
  const cardinalityFont: FontSpec = { family: fontFamily, size: CARDINALITY_FONT_SIZE };
  // A2a/M10: the resolved `arrow.cardinality` font feeds the SPLIT anchors
  // only -- see `PortLabelContext.cardinalityFont`.
  const splitFont = ctx.cardinalityFont ?? cardinalityFont;
  const { tail: tailInput, head: headInput } = buildEndLabelInputs(rel, edgeGeo, edgeResult);
  const tail = attachEndPortLabel(tailInput, cardinalityFont, splitFont, measurer, nodes);
  const head = attachEndPortLabel(headInput, cardinalityFont, splitFont, measurer, nodes);
  if (tail.anchor !== undefined) edgeGeo.tailLabel = tail.anchor;
  if (head.anchor !== undefined) edgeGeo.headLabel = head.anchor;
  if (tail.lines.length > 0 || head.lines.length > 0) edgeGeo.quantifierLines = [tail.lines, head.lines];
  if (tail.roleLines.length > 0 || head.roleLines.length > 0) edgeGeo.roleLines = [tail.roleLines, head.roleLines];
}
