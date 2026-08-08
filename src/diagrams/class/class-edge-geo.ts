/**
 * Class-diagram edge geometry: edge-label / magic-arrow / port-label anchors,
 * stroke override, point normalization, and buildEdgeGeos. Split out of
 * `class-geo-builders.ts` (line cap); independent of the classifier/namespace
 * builders. buildEdgeGeos re-exported from that module.
 */

import type { ClassDiagramAST, Relationship } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { EDGE_DECORATION_MAP } from './class-dot-graph.js';
import { strokeForStyle } from '../../core/svek/svek-edge-stroke.js';
import { CARDINALITY_FONT_SIZE, splitEdgeLabelLines } from './class-layout-helpers.js';
import { ARROW_GLYPH_SIZE, parseMagicArrowLabel, magicArrowAngle, magicArrowGlyphPoints, type MagicArrowLabel } from './class-magic-arrow.js';
import type { EdgeGeo } from './layout.js';

/**
 * Attach the edge label if present, positioned from @knowvah/dot-engine's own
 * native edge `label=` placement (`edgeResult.labelX`/`.labelY`, already
 * computed by `getLayout()` -- `core/graph-layout.ts#toEdgeEntry`'s
 * `ge.label`, unconditional, no SVG-scan extraction needed unlike
 * `tailLabel`/`headLabel`'s xlabel mechanism).
 *
 * G2 N62: replaces a hand-rolled "geometric midpoint, offset right-
 * perpendicular" formula (`LABEL_OFFSET=10`) that was NEVER jar-verified
 * (no ratchet-pinned fixture ever exercised a plain edge label -- `ledger
 * .md` N62) -- confirmed wrong two ways: the position ignored graphviz's
 * own real placement entirely, and the render styling this feeds
 * (`renderer.ts#renderEdge`) used a placeholder `theme.colors.graph
 * .edgeLabel`/`theme.fontSize-2` formula instead of jar's real `arrow`
 * style block (`plantuml.skin`: `FontSize 13`, inherited `FontColor
 * black` -- the SAME `CARDINALITY_FONT_SIZE`/`#000000` formula
 * `tailLabel`/`headLabel` already use, confirmed via `GraphvizImageBuilder
 * .java:235-238`: `labelFont`/`cardinalityFont` are BOTH built from
 * `getDefaultStyleDefinitionArrow`, the same `arrow` style signature).
 * Reuses `portLabelAnchor`'s CENTER-to-left/baseline-anchor conversion
 * unchanged.
 *
 * Still bound by the SAME @knowvah/dot-engine-vs-real-graphviz label-placement
 * residual N25 already named (gvts-genuine, out of scope): @knowvah/dot-engine's
 * own internal label-box measurement doesn't match this port's real
 * sans-serif metrics, so the extracted position is structurally correct
 * (real engine decision, not a guess) but not guaranteed byte-exact.
 */
function attachEdgeLabel(
  edgeGeo: EdgeGeo,
  rel: Relationship,
  edgeResult: DotLayoutResult['edges'][number],
  measurer: StringMeasurer,
  fontFamily: string,
  // G2 item 44: the edge's OWN from-to-ordered points (post-`normalizeEdgePoints`,
  // reversed to entity1->entity2 order when that function flipped the raw
  // dot points) -- ONLY consumed by the magic-arrow angle formula below,
  // which needs jar's exact `dotPath` start/end convention. See
  // `class-magic-arrow.ts#magicArrowAngle`'s doc comment.
  fromToPoints: Array<{ x: number; y: number }>,
): void {
  if (rel.label === undefined) return;
  if (edgeResult.labelX === undefined || edgeResult.labelY === undefined) return;
  const center = { x: edgeResult.labelX, y: edgeResult.labelY };

  // G2 item 43: a `\n`/`\l`/`\r`-split label draws ONE `<text>` per line
  // in jar's real golden SVG (`Display.hasSeveralGuideLines`/`create0`'s
  // line-wrapping, `SvekEdge.java:299`) -- see `multiLineLabelAnchor`'s doc
  // comment for the jar-verified per-line layout formula. A label with no
  // line breaks keeps the EXACT pre-existing single-`<text>` path below,
  // unchanged (`EdgeGeo.label`, N62).
  const { lines, align } = splitEdgeLabelLines(rel.label);
  if (lines.length > 1) {
    edgeGeo.labelLines = multiLineLabelAnchor(lines, align, center, measurer, fontFamily);
    return;
  }

  // G2 item 44: a single-line label ending in `" >"`/`" <"` (or the bare
  // `>`/`<`/`"< "`/`"> "` forms) strips the arrow token and draws a small
  // triangle glyph instead -- see `attachMagicArrow`'s doc comment. A label
  // with no arrow token (`parseMagicArrowLabel` returns `undefined`) keeps
  // the EXACT pre-existing plain-text path below, unchanged.
  const magic = parseMagicArrowLabel(rel.label);
  if (magic !== undefined) {
    attachMagicArrow(edgeGeo, magic, fromToPoints, center, measurer, fontFamily);
    return;
  }

  edgeGeo.label = portLabelAnchor(rel.label, center, measurer, fontFamily);
}

/**
 * G2 item 44: position the magic-arrow glyph (+ its optional remaining
 * text) as ONE combined block, mirroring jar's `TextBlockUtils.mergeLR
 * (arrow, label, CENTER)` (`SvekEdge.java:284,304`, `descdiagram/command/
 * StringWithArrow.java:105-113`) -- width SUMS (`ARROW_GLYPH_SIZE` +
 * text width), height/vertical-center is shared (mergeLR's CENTER
 * alignment). `blockLeft` generalizes `portLabelAnchor`'s own
 * `center.x - width/2` formula from a single `width` to the combined
 * block's `totalWidth` (algebraically identical when `hasText` is
 * `false` and `totalWidth === ARROW_GLYPH_SIZE`). The glyph always sits
 * in the LEFT `ARROW_GLYPH_SIZE`-wide slot regardless of arrow direction
 * (`mergeLR(arrow, label, ...)`'s fixed argument order) -- the triangle's
 * own ROTATION (`magicArrowAngle`) encodes direction, not its position.
 * Text position reuses `portLabelAnchor` verbatim by passing it the
 * TEXT-ONLY sub-block's own center (`blockLeft + ARROW_GLYPH_SIZE +
 * textWidth/2`), so its `y`/baseline formula is byte-identical to the
 * plain single-line label path. Jar-verified byte-exact SHAPE (glyph
 * triangle) against `lojepe-37-liri985`'s golden `<polygon>`; absolute
 * block position carries the SAME gvts-genuine placement residual N25/N62
 * already named.
 */
function attachMagicArrow(
  edgeGeo: EdgeGeo,
  magic: MagicArrowLabel,
  fromToPoints: Array<{ x: number; y: number }>,
  center: { x: number; y: number },
  measurer: StringMeasurer,
  fontFamily: string,
): void {
  const angle = magicArrowAngle(fromToPoints, magic.direction);
  const hasText = magic.text !== undefined && magic.text !== '';
  const font = { family: fontFamily, size: CARDINALITY_FONT_SIZE };
  const textWidth = hasText ? measurer.measure(magic.text!, font).width : 0;
  const totalWidth = ARROW_GLYPH_SIZE + textWidth;
  const blockLeft = center.x - totalWidth / 2;
  edgeGeo.arrowGlyph = {
    points: magicArrowGlyphPoints(blockLeft, center.y - ARROW_GLYPH_SIZE / 2, angle),
  };
  if (hasText) {
    edgeGeo.label = portLabelAnchor(
      magic.text!,
      { x: blockLeft + ARROW_GLYPH_SIZE + textWidth / 2, y: center.y },
      measurer,
      fontFamily,
    );
  }
}

/**
 * G2 item 43: lay out a `\n`/`\l`/`\r`-split edge label as one `<text>`
 * per line, generalizing `portLabelAnchor`'s single-line CENTER-to-left/
 * baseline conversion (reduces to the EXACT SAME formula when `lines.length
 * === 1`, verified algebraically below). Jar draws every line via ONE
 * `TextBlock` translated as a whole to `labelXY`'s top-left corner
 * (`SvekEdge.java:953`, `Display#create0`) -- each line is then
 * individually positioned WITHIN that block's own max-line-width per the
 * block's resolved `HorizontalAlignment` (default CENTER, or LEFT/RIGHT
 * when the label carried a trailing `\l`/`\r` -- {@link
 * splitEdgeLabelLines}). Jar-verified byte-exact SHAPE against
 * `sicile-99-pefa679`'s 3 sibling edges (identical 3-line text, one
 * alignment mode each): the block's LEFT edge sits at the SAME x for every
 * mode (`center.x - maxWidth/2`), and each line offsets from that left
 * edge by `0` (LEFT), `maxWidth-lineWidth` (RIGHT), or
 * `(maxWidth-lineWidth)/2` (CENTER) -- exactly `portLabelAnchor`'s own
 * `center.x - width/2` formula generalized from a single `width` to the
 * block's `maxWidth`. Line spacing is `CARDINALITY_FONT_SIZE` (13) exactly
 * -- jar's real per-line `y` delta on every sampled fixture. `totalHeight`
 * folds the extra `(lines.length-1)` rows into the SAME single-line
 * `m.height`/`baselineOffset` formula `portLabelAnchor` already uses, so at
 * `lines.length === 1` this function's `x`/`y` are algebraically identical
 * to `portLabelAnchor`'s. Still bound by the SAME gvts-genuine
 * label-placement residual N25/N62 already named (@knowvah/dot-engine's own
 * box-center doesn't match jar's sub-pixel placement) -- structurally
 * correct, not guaranteed byte-exact.
 */
function multiLineLabelAnchor(
  lines: string[],
  align: 'center' | 'left' | 'right',
  center: { x: number; y: number },
  measurer: StringMeasurer,
  fontFamily: string,
): Array<{ text: string; x: number; y: number; width: number }> {
  const font = { family: fontFamily, size: CARDINALITY_FONT_SIZE };
  const widths = lines.map((l) => measurer.measure(l, font).width);
  const maxWidth = Math.max(...widths);
  const blockLeft = center.x - maxWidth / 2;
  const firstLine = lines[0] ?? '';
  const m0 = measurer.measure(firstLine, font);
  const baselineOffset = CARDINALITY_FONT_SIZE - measurer.getDescent(font, firstLine);
  const totalHeight = (lines.length - 1) * CARDINALITY_FONT_SIZE + m0.height;
  const blockTop = center.y - totalHeight / 2;
  return lines.map((text, i) => {
    const width = widths[i]!;
    const offset = align === 'left' ? 0 : align === 'right' ? maxWidth - width : (maxWidth - width) / 2;
    return {
      text,
      x: blockLeft + offset,
      y: blockTop + baselineOffset + i * CARDINALITY_FONT_SIZE,
      width,
    };
  });
}

/**
 * Convert a `graph-layout.ts#extractPortLabelPositions` CENTER point into
 * the left/baseline anchor jar's own `<text>` emits (no `text-anchor`/
 * `dominant-baseline` attribute at all -- unlike the pre-existing `label`
 * center-label render, which uses `dominant-baseline:middle`, this mirrors
 * every OTHER text element in this engine's own established convention,
 * `class-member-rows.ts`'s doc comment: "un-centered `<text>`... `y =
 * lineTop + baselineOffset`"). `measurer`/`CARDINALITY_FONT_SIZE` give the
 * SAME box @knowvah/dot-engine itself measured the text with (`core/graph-layout.ts
 * #addEdges`'s `labelfontsize`), so the conversion is self-consistent.
 */
function portLabelAnchor(
  text: string,
  center: { x: number; y: number },
  measurer: StringMeasurer,
  fontFamily: string,
): { text: string; x: number; y: number; width: number } {
  const font = { family: fontFamily, size: CARDINALITY_FONT_SIZE };
  const m = measurer.measure(text, font);
  const baselineOffset = CARDINALITY_FONT_SIZE - measurer.getDescent(font, text);
  // G2 N35 (superseded by ADR-1): the `19.418750000000003` vs jar's
  // `19.4188` mismatch that once motivated pre-rounding this width is now
  // resolved at emission -- `core/svg.ts` formats every numeric attribute
  // through `formatDecimal(value, 3)` (T5), so this raw float reaches the
  // same jar-matching output without a class-engine-local round-trip.
  const width = m.width;
  return {
    text,
    x: center.x - width / 2,
    y: center.y - m.height / 2 + baselineOffset,
    width,
  };
}

/** Attach `tailLabel`/`headLabel` (G2/N25) if `graph-layout.ts` computed a
 *  position for them -- absent when the relationship carries no
 *  `fromMultiplicity`/`toMultiplicity` (`edgeLabelAttrs` then never set
 *  `tailLabel`/`headLabel` on the DOT input, so `extractPortLabelPositions`
 *  never ran for this edge). */
function attachPortLabels(
  edgeGeo: EdgeGeo,
  rel: Relationship,
  edgeResult: DotLayoutResult['edges'][number],
  measurer: StringMeasurer,
  fontFamily: string,
): void {
  if (rel.fromMultiplicity !== undefined && edgeResult.tailLabelX !== undefined && edgeResult.tailLabelY !== undefined) {
    edgeGeo.tailLabel = portLabelAnchor(
      rel.fromMultiplicity, { x: edgeResult.tailLabelX, y: edgeResult.tailLabelY }, measurer, fontFamily,
    );
  }
  if (rel.toMultiplicity !== undefined && edgeResult.headLabelX !== undefined && edgeResult.headLabelY !== undefined) {
    edgeGeo.headLabel = portLabelAnchor(
      rel.toMultiplicity, { x: edgeResult.headLabelX, y: edgeResult.headLabelY }, measurer, fontFamily,
    );
  }
}

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
): Pick<EdgeGeo, 'strokeWidth' | 'strokeDasharray' | 'colorOverride'> {
  // G2 N51: `skinparam arrowThickness N` -- a theme-level DEFAULT thickness
  // every edge picks up when it carries no bracket override of its own,
  // see `theme.ts#arrowThickness`'s doc comment for the exact upstream
  // `LinkType#getStroke3(UStroke defaultThickness)` formula this reduces
  // to (a per-edge bracket override always wins over this default).
  const hasOverride =
    rel.lineStyleOverride !== undefined ||
    rel.thicknessOverride !== undefined ||
    rel.colorOverride !== undefined ||
    defaultArrowThickness !== undefined;
  if (!hasOverride) return {};
  const style = rel.lineStyleOverride ?? (dashed ? 'dashed' : 'solid');
  const stroke = strokeForStyle(style, rel.thicknessOverride ?? defaultArrowThickness);
  const dasharray = stroke.getDasharraySvg();
  return {
    strokeWidth: stroke.getThickness(),
    ...(dasharray !== undefined ? { strokeDasharray: dasharray } : {}),
    ...(rel.colorOverride !== undefined ? { colorOverride: rel.colorOverride } : {}),
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
 * Normalize a raw dot-returned point list to run `idEntity1FullId` ->
 * `idEntity2FullId`, mirroring jar's `SvekEdge.java#solveLine:637-654`
 * exactly: after layout, if the path is closer (summed endpoint distance)
 * to node2->node1 than node1->node2, reverse it. REPLACES the prior
 * hardcoded "always reverse hierarchical edges" rule -- jar's real check is
 * distance-based and type-agnostic, not gated by relationship type at all
 * (byte-diff evidence against `bivize-12-xiko303`'s single extension edge,
 * `plans/g2-class-svg/ledger.md` N30). Falls back to the pre-existing
 * `swappedEdges`-index reversal for relationships built outside the
 * arrow-token/inline-inheritance grammar (couples/lollipop/map rows,
 * `idEntity1FullId` absent -- see that field's own doc comment, ast.ts).
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
  if (rel.idEntity1FullId !== undefined && rel.idEntity2FullId !== undefined && start !== undefined && end !== undefined) {
    const c1 = nodeCenter(posMap, anchors, rel.idEntity1FullId);
    const c2 = nodeCenter(posMap, anchors, rel.idEntity2FullId);
    if (c1 !== undefined && c2 !== undefined) {
      const normal = pointDist(start, c1) + pointDist(end, c2);
      const inversed = pointDist(start, c2) + pointDist(end, c1);
      reversed = inversed < normal;
    }
  }
  const points = reversed ? [...rawPts].reverse() : [...rawPts];
  // points[0] is rel.from's end iff exactly one of {dotSwap, reversed} holds.
  const matchesFromTo = dotSwap === reversed;
  return { points, matchesFromTo };
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
  measurer: StringMeasurer,
  fontFamily: string,
  posMap: Map<string, DotLayoutResult['nodes'][number]>,
  anchors: Map<string, string>,
  // G2 N51: `theme.colors.graph.arrowThickness` (`skinparam arrowThickness
  // N`) -- threaded through to `buildStrokeOverride` below; see that
  // function's own doc comment.
  defaultArrowThickness?: number,
): EdgeGeo[] {
  const edges: EdgeGeo[] = [];
  for (let i = 0; i < ast.relationships.length; i++) {
    const rel = ast.relationships[i]!;
    if (rel.invis === true) continue;
    const edgeResult = result.edges.find((e) => e.id === `edge-${i}`);
    if (edgeResult === undefined) continue;

    const decor = EDGE_DECORATION_MAP[rel.type];
    const rawPts = edgeResult.points;
    const { points: pts, matchesFromTo } = normalizeEdgePoints(rawPts, rel, i, swappedEdges, posMap, anchors);
    // G2 N8: `rel.dashed` overrides the type-derived default for the
    // association-class couple's class-link edge -- see `Relationship
    // .dashed`'s own doc comment (ast.ts).
    const dashed = rel.dashed ?? decor.dashed;
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

    attachEdgeLabel(
      edgeGeo, rel, edgeResult, measurer, fontFamily,
      matchesFromTo ? pts : [...pts].reverse(),
    );
    attachPortLabels(edgeGeo, rel, edgeResult, measurer, fontFamily);
    edges.push(edgeGeo);
  }
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
