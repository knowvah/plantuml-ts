/**
 * Class-diagram edge geometry: edge-label / magic-arrow / port-label anchors,
 * stroke override, point normalization, and buildEdgeGeos. Split out of
 * `class-geo-builders.ts` (line cap); independent of the classifier/namespace
 * builders. buildEdgeGeos re-exported from that module.
 */

import type { ClassDiagramAST, Relationship } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import { EDGE_DECORATION_MAP } from './class-dot-edges.js';
import { strokeForStyle } from '../../core/svek/svek-edge-stroke.js';
import { attachPortLabels } from './class-edge-label-anchor.js';
import { attachEdgeLabel, type EdgeGeoTextContext } from './class-edge-label-attach.js';
import { computeEdgeNoteBox } from './class-edge-note-box.js';
import { constraintAnchor } from './class-edge-constraint.js';
import { edgeLabelAttrs } from './class-layout-edge-labels.js';
import type { EdgeGeo } from './layout.js';

// cdd-T6: `EdgeGeoTextContext` and the three label-attach functions moved
// to `class-edge-label-attach.ts` when the note-box/constraint wiring pushed
// this file past the 500-line hook cap (pre-authorised split re-export) --
// a pure move, re-exported below so no consumer's import path changed.
export type { EdgeGeoTextContext } from './class-edge-label-attach.js';

/**
 * G2 N26: `-[#color]->`/`-[bold]->`/`-[thickness=N]->` bracket-modifier
 * render overrides -- computed ONLY when the relationship actually
 * carried one (`Relationship.lineStyleOverride`/`.thicknessOverride`/
 * `.colorOverride`, all `undefined` for the ~700 fixtures with no
 * bracket), reusing the shared `LinkStyle#getStroke3()` formula
 * (`core/svek/svek-edge-stroke.ts#strokeForStyle`) description's own
 * edge renderer already uses for the identical upstream mechanism (see
 * `Relationship.lineStyleOverride`'s doc comment, ast.ts). Absent when
 * `!hasOverride` -- `renderer.ts#renderEdge` falls back to the
 * pre-existing `dashed`-boolean-driven default in that case, zero
 * behavior change for every other edge.
 */
function buildStrokeOverride(
  rel: Relationship,
  dashed: boolean,
  defaultArrowThickness: number | undefined,
): Pick<EdgeGeo, 'strokeWidth' | 'strokeDasharray' | 'colorOverride' | 'stereotypeTags'> {
  // G2 N51: `skinparam arrowThickness N` -- a theme-level DEFAULT thickness
  // every edge picks up when it carries no bracket override of its own,
  // see `theme.ts#arrowThickness`'s doc comment for the exact upstream
  // `LinkType#getStroke3(UStroke defaultThickness)` formula this reduces
  // to (a per-edge bracket override always wins over this default).
  // B7/M8: the link's `<<tag>>` labels ride along regardless of whether the
  // edge carries a bracket override -- they are resolved against
  // `theme.colors.graph.arrowTagCascade` at render time, not here.
  const tags =
    rel.stereotypeTags !== undefined && rel.stereotypeTags.length > 0 ? { stereotypeTags: rel.stereotypeTags } : {};
  const hasOverride =
    rel.lineStyleOverride !== undefined ||
    rel.thicknessOverride !== undefined ||
    rel.colorOverride !== undefined ||
    defaultArrowThickness !== undefined;
  if (!hasOverride) return tags;
  const style = rel.lineStyleOverride ?? (dashed ? 'dashed' : 'solid');
  const stroke = strokeForStyle(style, rel.thicknessOverride ?? defaultArrowThickness);
  const dasharray = stroke.getDasharraySvg();
  return {
    strokeWidth: stroke.getThickness(),
    ...(dasharray !== undefined ? { strokeDasharray: dasharray } : {}),
    ...(rel.colorOverride !== undefined ? { colorOverride: rel.colorOverride } : {}),
    ...tags,
  };
}

/** Node-center lookup for `normalizeEdgePoints` below -- resolves a
 *  namespace endpoint through its DOT point anchor the same way
 *  `class-dot-graph.ts#buildDotEdges` does for the edge itself. */
function nodeCenter(
  posMap: Map<string, DotLayoutResult['nodes'][number]>,
  anchors: Map<string, string>,
  id: string,
): { x: number; y: number } | undefined {
  const pos = posMap.get(anchors.get(id) ?? id);
  return pos === undefined ? undefined : { x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 };
}

function pointDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Normalize a raw dot-returned point list to run entity1 -> entity2,
 * mirroring jar's `SvekEdge.java#solveLine:643-655` exactly: after layout,
 * if the path is closer (summed endpoint distance) to node2->node1 than
 * node1->node2, reverse it. Jar's real check is distance-based and
 * type-agnostic, not gated by relationship type at all (byte-diff evidence
 * against `bivize-12-xiko303`'s single extension edge,
 * `plans/g2-class-svg/ledger.md` N30).
 *
 * cdd-T6 (A5/M5): the node centres are resolved from `rel.from`/`rel.to`
 * -- the POST-`resolveRelationshipEndpoint` ids `posMap` is actually keyed
 * by -- and re-ordered into upstream's `cl1`/`cl2` pair by the parser's own
 * {@link Relationship.dotEdgeReversed} flag. The previous code keyed the
 * lookup on `idEntity1FullId`/`idEntity2FullId`, which the parser stamps
 * from the RAW arrow-token ids (`class-relationship-field-builder.ts:45`)
 * BEFORE `class-command-relationships.ts` qualifies the endpoints, so
 * inside a `namespace`/`package` a bare id (`Rabbit`) never matched the
 * laid-out node (`issues.Rabbit`), `nodeCenter` returned `undefined`, the
 * distance verdict was skipped entirely, and `reversed` kept its `dotSwap`
 * seed -- the exact opposite verdict for a DOT-swapped hierarchical edge,
 * which is why all 7 of A5/M5's PURE fixtures emitted a mirrored `<path d>`.
 * Instrumented on `delano-03-xino845`'s two inheritance edges before the
 * fix: `c1` (namespace-QUALIFIED `f1.function.Fox`) resolved, `c2` (bare
 * `Rabbit`) did not -- so `nodeCenter`'s namespace handling was never the
 * trigger. This is the same desynchronisation `dotEdgeRunsReversed`'s own
 * doc comment records for B6, resolved the same way: read the flag the
 * parser set, never compare ids a later rename can rewrite.
 *
 * Upstream has NO `dotSwap` fallback at all (`:646` gates only on both
 * `SvekNode`s being non-null). The `dotSwap` seed survives here purely for
 * the degenerate case where an endpoint is not a laid-out node at all
 * (neither `posMap` nor `anchors` resolves it), which no corpus fixture
 * reaches.
 *
 * Returns `matchesFromTo` alongside `points` so the caller can keep
 * `sourceDecor`/`targetDecor` correctly paired with `points[0]`/
 * `points[last]` WITHOUT reading `idEntity1Decor`/`idEntity2Decor` --
 * those track a separately-computed decor pair
 * (`class-relationship-parser.ts#parseArrowDecorsRaw`) that a jar-verified
 * corpus probe (G2 N30, `bob x--> alice`) found genuinely diverges from
 * `sourceDecor`/`targetDecor` for cross (`x`) notation -- an unrelated,
 * pre-existing bug in that OTHER field, out of this mechanism's scope
 * (`idEntity1Decor`/`idEntity2Decor` are only jar-verified for the
 * `<path id>` string, N9). `matchesFromTo` sidesteps it entirely: `true`
 * when `points[0]` is `rel.from`'s end (so `sourceDecor`/`targetDecor` need
 * no swap -- the common case, identical to pre-N30 behavior), `false` when
 * the entity-distance check (or, for non-arrow-grammar edges, the
 * `swappedEdges` fallback) flipped the array so `points[0]` is `rel.to`'s
 * end instead.
 */
interface NormalizedEdgePoints {
  points: Array<{ x: number; y: number }>;
  matchesFromTo: boolean;
}

function normalizeEdgePoints(
  rawPts: Array<{ x: number; y: number }>,
  rel: Relationship,
  i: number,
  swappedEdges: Set<number>,
  posMap: Map<string, DotLayoutResult['nodes'][number]>,
  anchors: Map<string, string>,
): NormalizedEdgePoints {
  // `rawPts` (dot tail->head) is `rel.to -> rel.from` when the DOT graph
  // swapped this edge for hierarchical ranking (`class-dot-graph.ts
  // #buildDotEdges`'s `swap`), else `rel.from -> rel.to`.
  const dotSwap = swappedEdges.has(i);
  const start = rawPts[0];
  const end = rawPts[rawPts.length - 1];
  let reversed = dotSwap;
  // `getSvekNode1()`/`getSvekNode2()` (`SvekEdge.java:644-645`) are
  // `link.getEntity1()`/`getEntity2()`, i.e. upstream's `cl1`/`cl2`. This
  // port normalizes `from`/`to` by the arrowhead, so `dotEdgeReversed`
  // records when the two orders disagree (`class-dot-edge-order.ts`).
  const cFrom = nodeCenter(posMap, anchors, rel.from);
  const cTo = nodeCenter(posMap, anchors, rel.to);
  const c1 = rel.dotEdgeReversed === true ? cTo : cFrom;
  const c2 = rel.dotEdgeReversed === true ? cFrom : cTo;
  if (c1 !== undefined && c2 !== undefined && start !== undefined && end !== undefined) {
    const normal = pointDist(start, c1) + pointDist(end, c2);
    const inversed = pointDist(start, c2) + pointDist(end, c1);
    reversed = inversed < normal;
  }
  const points = reversed ? [...rawPts].reverse() : [...rawPts];
  // points[0] is rel.from's end iff exactly one of {dotSwap, reversed} holds.
  const matchesFromTo = dotSwap === reversed;
  return { points, matchesFromTo };
}

/** One end of a pending `constraint on links` pair -- the edge to stamp,
 *  the shared constraint record that identifies its partner, and the point
 *  `SvekEdge.java:998-1010` sampled for this end. */
interface ConstraintEntry {
  edgeGeo: EdgeGeo;
  constraint: { text: string };
  point: { x: number; y: number };
}

/**
 * The two label-box-derived mechanisms that need the note/theme context:
 * A2a/M5's `note on link` operand ({@link computeEdgeNoteBox}) and A2a/M9's
 * constraint spot. Both hang off `labelXY`, the reserved box graphviz
 * placed -- `SvekEdge.java:952-954` (note) and `:995-996` (constraint,
 * `x + labelXY.getPosition().getX()`), which is why the spot below is the
 * box's TOP-LEFT rather than the centre this port carries.
 */
function attachNoteAndConstraintSpot(
  edgeGeo: EdgeGeo,
  rel: Relationship,
  edgeResult: DotLayoutResult['edges'][number],
  text: EdgeGeoTextContext,
  constrained: ConstraintEntry[],
): void {
  const { measurer, labelFont, noteCtx } = text;
  if (noteCtx === undefined) return;
  if (edgeResult.labelX === undefined || edgeResult.labelY === undefined) return;
  const center = { x: edgeResult.labelX, y: edgeResult.labelY };
  const noteBox = computeEdgeNoteBox(rel, center, labelFont, measurer, noteCtx);
  if (noteBox !== undefined) edgeGeo.noteBox = noteBox;
  if (rel.linkConstraint === undefined) return;
  const cardinalityFont = text.cardinalityFont ?? labelFont;
  const attrs = edgeLabelAttrs(rel, labelFont, cardinalityFont, measurer, noteCtx);
  const spot = {
    x: center.x - (attrs.labelWidth ?? 0) / 2,
    y: center.y - (attrs.labelHeight ?? 0) / 2,
  };
  const point = constraintAnchor(edgeGeo.points, spot);
  if (point !== undefined) constrained.push({ edgeGeo, constraint: rel.linkConstraint, point });
}

/**
 * Pair the collected ends and stamp each with the line `LinkConstraint
 * #drawMe` draws (`cucadiagram/LinkConstraint.java:93-95`: `ULine(x2 - x1,
 * y2 - y1)` translated to `(x1, y1)`).
 *
 * Both ends are stamped, each with its OWN point first -- measured, not
 * assumed: `gujigi-63-roki030`'s golden emits a dashed `<line>` inside BOTH
 * links of each constrained pair (`lnk10`/`lnk11` and `lnk12`/`lnk13`),
 * each starting at its own link's sampled corner. A literal reading of
 * `drawMe`'s `x2 == 0 && y2 == 0` early return would emit only one; the
 * golden disproves that reading, so the observed behaviour is ported and
 * the residual is journaled (cdd-T6) rather than guessed at.
 */
function attachConstraints(entries: readonly ConstraintEntry[]): void {
  for (const entry of entries) {
    const partner = entries.find((o) => o !== entry && o.constraint === entry.constraint);
    if (partner === undefined) continue;
    entry.edgeGeo.constraint = {
      line: { x1: entry.point.x, y1: entry.point.y, x2: partner.point.x, y2: partner.point.y },
      text: entry.constraint.text,
    };
  }
}

/**
 * Build EdgeGeo entries from the dot layout result, normalizing each edge's
 * drawn direction (see `normalizeEdgePoints`). G2 N8: an `invis: true`
 * relationship (the association-class-couple sibling-circle connector,
 * `class-assoc-couple.ts#makeCoupleCircle`) is skipped entirely -- it still
 * constrains the DOT layout (`style=invis`, `class-dot-graph.ts`) but is
 * NEVER drawn, matching upstream's own early-return for an invisible link
 * (`svek/SvekEdge.java#drawU`/`#solveLine`, both `if (link.isInvis())
 * return;` before emitting any `<g>`/comment/path at all).
 */
export function buildEdgeGeos(
  ast: ClassDiagramAST,
  result: DotLayoutResult,
  swappedEdges: Set<number>,
  text: EdgeGeoTextContext,
  posMap: Map<string, DotLayoutResult['nodes'][number]>,
  anchors: Map<string, string>,
  // G2 N51: `theme.colors.graph.arrowThickness` (`skinparam arrowThickness
  // N`) -- threaded through to `buildStrokeOverride` below; see that
  // function's own doc comment.
  defaultArrowThickness?: number,
): EdgeGeo[] {
  const edges: EdgeGeo[] = [];
  // A2a/M9: `constraint on links` binds a PAIR of links through one shared
  // `LinkConstraint` object (`class-notes.ts#applyConstraintOnLinks` assigns
  // the same record to both), so the line can only be resolved once both
  // ends have been sampled -- collected here, paired below.
  const constrained: ConstraintEntry[] = [];
  // Built once so the per-relationship lookup below is O(1) rather than an
  // O(n) `.find` repeated per relationship (code review 2026-09-21).
  const edgeResultById = new Map(result.edges.map((e) => [e.id, e]));
  for (let i = 0; i < ast.relationships.length; i++) {
    const rel = ast.relationships[i]!;
    if (rel.invis === true) continue;
    const edgeResult = edgeResultById.get(`edge-${i}`);
    if (edgeResult === undefined) continue;

    const decor = EDGE_DECORATION_MAP[rel.type];
    const rawPts = edgeResult.points;
    const { points: pts, matchesFromTo } = normalizeEdgePoints(rawPts, rel, i, swappedEdges, posMap, anchors);
    // G2 N8: `rel.dashed` overrides the type-derived default for the
    // association-class couple's class-link edge -- see `Relationship
    // .dashed`'s own doc comment (ast.ts).
    //
    // cdd-T6 (A2a/M4): `rel.dashedBody` (T5) is the arrow BODY's own
    // dottedness, which upstream keeps INDEPENDENT of the head decors --
    // `getLinkType()` builds `new LinkType(decors2, decors1)` from the
    // glyphs and only then applies `result.goDashed()` iff either body
    // contains `.` (`CommandLinkClass.java:495-497`), so a decor can never
    // make a link dashed and a dotted body can never be out-voted by one.
    // `decor.dashed` survives only as the fallback for relationships built
    // outside the arrow-token grammar (couples/lollipop/map rows), which
    // carry no flag. Measured: `dashed` reaches no DOT attribute in this
    // port (0 of 723 emitted graphs contain the token), matching the jar,
    // whose captured `svek-*.dot` files contain no `style=dashed` either --
    // the diagnosis report's MEDIUM layout risk does not apply here.
    const dashed = rel.dashed ?? rel.dashedBody ?? decor.dashed;
    // G2 N30: keep sourceDecor/targetDecor paired with points[0]/points
    // [last] -- swap them together with `pts` when `normalizeEdgePoints`
    // flipped the array relative to `rel.from`/`rel.to` (see that
    // function's own doc comment for why `idEntity1Decor`/`idEntity2Decor`
    // are deliberately NOT used here).
    const fromDecor = rel.sourceDecor ?? decor.sourceDecor;
    const toDecor = rel.targetDecor ?? decor.targetDecor;
    const edgeGeo: EdgeGeo = {
      id: edgeResult.id,
      points: pts,
      sourceDecor: matchesFromTo ? fromDecor : toDecor,
      targetDecor: matchesFromTo ? toDecor : fromDecor,
      dashed,
      from: rel.from,
      to: rel.to,
      ...(rel.creationIndex !== undefined ? { creationIndex: rel.creationIndex } : {}),
      ...(rel.idEntity1 !== undefined ? { idEntity1: rel.idEntity1 } : {}),
      ...(rel.idEntity2 !== undefined ? { idEntity2: rel.idEntity2 } : {}),
      ...(rel.idEntity1Decor !== undefined ? { idEntity1Decor: rel.idEntity1Decor } : {}),
      ...(rel.idEntity2Decor !== undefined ? { idEntity2Decor: rel.idEntity2Decor } : {}),
      ...(rel.sourceLine !== undefined ? { sourceLine: rel.sourceLine } : {}),
      ...(rel.phantomSlot === true ? { phantomSlot: true as const } : {}),
      ...buildStrokeOverride(rel, dashed, defaultArrowThickness),
    };

    attachEdgeLabel(edgeGeo, rel, edgeResult, text, matchesFromTo ? pts : [...pts].reverse());
    attachNoteAndConstraintSpot(edgeGeo, rel, edgeResult, text, constrained);
    // `result.nodes` is the collision set — the closest analogue to
    // upstream's `getBibliotekon().allNodes()` (`DotStringFactory.java:466`),
    // which is likewise every laid-out node, in layout order.
    attachPortLabels(edgeGeo, rel, edgeResult, {
      measurer: text.measurer,
      fontFamily: text.fontFamily,
      nodes: result.nodes,
      cardinalityFont: text.cardinalityFont,
    });
    edges.push(edgeGeo);
  }
  attachConstraints(constrained);
  return edges;
  // #lizard forgives -- verbatim move from layout.ts (pre-existing code,
  // not touched this iteration); one EdgeGeo literal with 10 optional
  // jar-verified fields (G2 N2/N8/N9), each gated by its own `?? decor`/
  // `!== undefined` check -- reducible only by splitting the single
  // EdgeGeo construction across functions, which would obscure the
  // field-by-field jar citations far more than it simplifies control flow.
}

// ---------------------------------------------------------------------------
// Degenerate-diagram skip (0-1 entities -> no DOT graph)
// ---------------------------------------------------------------------------
