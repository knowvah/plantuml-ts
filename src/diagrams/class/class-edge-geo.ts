/**
 * Class-diagram edge geometry: edge-label / magic-arrow / port-label anchors,
 * stroke override, point normalization, and buildEdgeGeos. Split out of
 * `class-geo-builders.ts` (line cap); independent of the classifier/namespace
 * builders. buildEdgeGeos re-exported from that module.
 */

import type { ClassDiagramAST, Relationship } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { EDGE_DECORATION_MAP } from './class-dot-edges.js';
import { strokeForStyle } from '../../core/svek/svek-edge-stroke.js';
import {
  attachPortLabels, guideLinesAnchor, multiLineLabelAnchor, portLabelAnchor, type LabelAnchorContext,
} from './class-edge-label-anchor.js';
// T1: the ONE `Display#getWithNewlines` port -- replaces the former
// `splitEdgeLabelLines` re-export chain through `class-layout-helpers.js`,
// see `class-edge-label-lines.ts`'s own doc comment.
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import {
  hasSeveralGuideLines, magicArrowAngle, magicArrowGlyphPoints, parseMagicArrowLabel, splitGuideLines,
  type MagicArrowDirection, type MagicArrowLabel,
} from './class-magic-arrow.js';
import { applyGuillemet } from '../../core/edge-label-box.js';
import type { EdgeGeo } from './layout.js';

/**
 * The text inputs `buildEdgeGeos` threads to every label anchor. SI25 D2:
 * `labelFont` is `resolveArrowLabelFont(theme)` (`GraphvizImageBuilder
 * .java:234-235`'s `labelFont` -- the `arrow` style's font) and positions
 * the MAIN label's ink at the SAME font the DOT box was measured with;
 * `fontFamily` (`theme.fontFamily`) stays the tail/head cardinality
 * labels' family, paired with `CARDINALITY_FONT_SIZE` inside
 * `portLabelAnchor` exactly as before (SI25 D2 scope: main label only).
 * Upstream's `cardinalityFont` (`:237-238`, the `arrow.cardinality`
 * signature) is resolved for the DOT box as `theme.cardinalityFontFamily`/
 * `cardinalityFontSize` (`class-dot-graph.ts`) but NOT yet threaded to the
 * tail/head ink here -- a named follow-on, not this mission's.
 */
export interface EdgeGeoTextContext {
  readonly measurer: StringMeasurer;
  readonly labelFont: FontSpec;
  readonly fontFamily: string;
}

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
  // SI25 D2: `labelFont` = `resolveArrowLabelFont(theme)` -- the SAME font
  // the DOT reservation is measured with (`class-layout-edge-labels.ts`);
  // replaces a bare `fontFamily` + `CARDINALITY_FONT_SIZE` on every
  // MAIN-label path below (tail/head cardinality labels keep their own,
  // `attachPortLabels`).
  text: EdgeGeoTextContext,
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
  const { measurer, labelFont } = text;
  const ctx: LabelAnchorContext = { center, measurer, labelFont };

  // M4 cause C (T12b follow-on, `.agent-notes/m4-single-line-width.md`):
  // rewrite `<<x>>` -> `«x»` ONCE, here, before any of the three branches
  // below read the label -- upstream RENDERS the guillemet-rewritten text,
  // not just measures it (`Display.manageGuillemet` returns the rewritten
  // `Display`; `SvekEdge`'s `labelOnly` block, which BOTH sizes the DOT
  // reservation AND draws the glyphs, is built from that single rewritten
  // copy -- `SvekEdge.java:302,440-445,956-980`; there is no second,
  // unrewritten copy anywhere upstream). `class-layout-edge-labels.ts
  // #computeMeasuredLabelAttrs` sizes the DOT box from the SAME
  // `applyGuillemet` (`core/edge-label-box.ts`) applied to the SAME
  // `rel.label` -- calling the one shared, pure, deterministic function
  // from both sites cannot drift: identical input always yields identical
  // output. Unlike M4 causes A/B (the visibility-char strip), which T12a
  // deliberately left OUT of the rendered text because upstream also draws
  // an icon glyph this port does not render (stripping the char alone
  // would delete information), cause C drops nothing -- upstream's
  // rewritten text IS the whole visible label, so both measurement and
  // render use it unconditionally.
  const label = applyGuillemet(rel.label);

  // G2 item 43: a `\n`/`\l`/`\r`-split label draws ONE `<text>` per line
  // in jar's real golden SVG (`Display.hasSeveralGuideLines`/`create0`'s
  // line-wrapping, `SvekEdge.java:299`) -- see `multiLineLabelAnchor`'s doc
  // comment for the jar-verified per-line layout formula. A label with no
  // line breaks keeps the EXACT pre-existing single-`<text>` path below,
  // unchanged (`EdgeGeo.label`, N62).
  // `splitDisplayLines` returns `readonly string[]` -- materialize a
  // mutable copy since `attachMultiLineLabel`'s downstream callee
  // (`class-edge-label-anchor.ts#multiLineLabelAnchor`, outside T1's
  // write-set) still declares a mutable `string[]` parameter.
  const { lines: splitLines, align } = splitDisplayLines(label);
  const lines = [...splitLines];
  if (lines.length > 1) {
    attachMultiLineLabel(edgeGeo, lines, align, (direction) => magicArrowAngle(fromToPoints, direction), ctx);
    return;
  }

  // G2 item 44: a single-line label ending in `" >"`/`" <"` (or the bare
  // `>`/`<`/`"< "`/`"> "` forms) strips the arrow token and draws a small
  // triangle glyph instead -- see `attachMagicArrow`'s doc comment. A label
  // with no arrow token (`parseMagicArrowLabel` returns `undefined`) keeps
  // the EXACT pre-existing plain-text path below, unchanged. Reads `label`
  // (post-guillemet), not `rel.label`: harmless when both differ, since a
  // magic-arrow token is a single `<`/`>`, never the `<<`/`>>` pair
  // `applyGuillemet` rewrites -- no corpus fixture combines the two.
  const magic = parseMagicArrowLabel(label);
  if (magic !== undefined) {
    attachMagicArrow(edgeGeo, magic, fromToPoints, ctx);
    return;
  }

  edgeGeo.label = portLabelAnchor(label, center, measurer, labelFont);
}

/**
 * SI25 D3/D4: the multi-line branch. A label `hasSeveralGuideLines`
 * (`Display.java:715-740`) takes `StringWithArrow#addSeveralMagicArrows`'
 * per-line-glyph layout (`guideLinesAnchor`) over the SAME `splitGuideLines`
 * walk `class-layout-edge-labels.ts#computeMeasuredLabelAttrs` sized the
 * DOT box from (`SvekEdge.java:288,296-297` -- the ONE `hasSeveralGuideLines`
 * read that selects between `addSeveralMagicArrows` and `create0`); every
 * other multi-line label keeps the EXACT pre-existing `create0` path
 * (`multiLineLabelAnchor`), unchanged.
 */
function attachMultiLineLabel(
  edgeGeo: EdgeGeo,
  lines: string[],
  align: 'center' | 'left' | 'right',
  angleOf: (direction: MagicArrowDirection) => number,
  ctx: LabelAnchorContext,
): void {
  if (hasSeveralGuideLines(lines)) {
    const walk = splitGuideLines(lines, ctx.labelFont, ctx.measurer);
    edgeGeo.labelLines = guideLinesAnchor(walk, align, angleOf, ctx);
    return;
  }
  edgeGeo.labelLines = multiLineLabelAnchor(lines, align, ctx.center, ctx.measurer, ctx.labelFont);
}

/**
 * G2 item 44 / M4 cause D: position the magic-arrow glyph (+ its optional
 * remaining text) as ONE combined block, mirroring jar's
 * `TextBlockUtils.mergeLR(arrow, label, CENTER)` (`SvekEdge.java:284,304`,
 * `descdiagram/command/StringWithArrow.java:105-113`) -- width SUMS the
 * arrow block's OWN font-size square (`TextBlockArrow2.calculateDimension`,
 * `klimt/shape/TextBlockArrow2.java:57,87` -- `arrowFontSize`, NOT
 * `ARROW_GLYPH_SIZE`, the draw-only `.80` ink triangle, `:64-65`) plus the
 * text width; height/vertical-center is shared (mergeLR's CENTER
 * alignment). `blockLeft` generalizes `portLabelAnchor`'s own
 * `center.x - width/2` formula from a single `width` to the combined
 * block's `totalWidth` (algebraically identical when `hasText` is
 * `false` and `totalWidth === arrowFontSize`). The glyph always sits
 * in the LEFT `arrowFontSize`-wide slot regardless of arrow direction
 * (`mergeLR(arrow, label, ...)`'s fixed argument order) -- the triangle's
 * own ROTATION (`magicArrowAngle`) encodes direction, not its position.
 * Text position reuses `portLabelAnchor` verbatim by passing it the
 * TEXT-ONLY sub-block's own center (`blockLeft + arrowFontSize +
 * textWidth/2`), so its `y`/baseline formula is byte-identical to the
 * plain single-line label path. This SAME `arrowFontSize` is what
 * `class-layout-edge-labels.ts#computeMeasuredLabelAttrs` reserves in the
 * DOT box (T12c) -- deriving both from the caller's own `font.size` keeps
 * the drawn glyph's slot and the reserved box in sync, unlike the
 * pre-T12c code which used `ARROW_GLYPH_SIZE` (10) for BOTH and reserved
 * the wrong width. Jar-verified byte-exact SHAPE (glyph triangle) against
 * `lojepe-37-liri985`'s golden `<polygon>`; absolute block position
 * carries the SAME gvts-genuine placement residual N25/N62 already named.
 */
function attachMagicArrow(
  edgeGeo: EdgeGeo,
  magic: MagicArrowLabel,
  fromToPoints: Array<{ x: number; y: number }>,
  ctx: LabelAnchorContext,
): void {
  const { center, measurer } = ctx;
  const angle = magicArrowAngle(fromToPoints, magic.direction);
  const hasText = magic.text !== undefined && magic.text !== '';
  // SI25 D2: the resolved arrow font (`GraphvizImageBuilder.java:234-235`'s
  // `labelFont`, `TextBlockArrow2.java:57` reads `getSize2D()` off it) --
  // `{ theme.fontFamily, 13 }` with no override, byte-identical to before.
  const font = ctx.labelFont;
  const textWidth = hasText ? measurer.measure(magic.text, font).width : 0;
  const blockLeft = center.x - (font.size + textWidth) / 2;
  edgeGeo.arrowGlyph = {
    points: magicArrowGlyphPoints(blockLeft, center.y - font.size / 2, angle, font.size),
  };
  if (hasText) {
    edgeGeo.label = portLabelAnchor(
      magic.text,
      { x: blockLeft + font.size + textWidth / 2, y: center.y },
      measurer,
      font,
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
): Pick<EdgeGeo, 'strokeWidth' | 'strokeDasharray' | 'colorOverride' | 'stereotypeTags'> {
  // G2 N51: `skinparam arrowThickness N` -- a theme-level DEFAULT thickness
  // every edge picks up when it carries no bracket override of its own,
  // see `theme.ts#arrowThickness`'s doc comment for the exact upstream
  // `LinkType#getStroke3(UStroke defaultThickness)` formula this reduces
  // to (a per-edge bracket override always wins over this default).
  // B7/M8: the link's `<<tag>>` labels ride along regardless of whether the
  // edge carries a bracket override -- they are resolved against
  // `theme.colors.graph.arrowTagCascade` at render time, not here.
  const tags = rel.stereotypeTags !== undefined && rel.stereotypeTags.length > 0
    ? { stereotypeTags: rel.stereotypeTags }
    : {};
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
  text: EdgeGeoTextContext,
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

    attachEdgeLabel(edgeGeo, rel, edgeResult, text, matchesFromTo ? pts : [...pts].reverse());
    // `result.nodes` is the collision set — the closest analogue to
    // upstream's `getBibliotekon().allNodes()` (`DotStringFactory.java:466`),
    // which is likewise every laid-out node, in layout order.
    attachPortLabels(edgeGeo, rel, edgeResult, { measurer: text.measurer, fontFamily: text.fontFamily, nodes: result.nodes });
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
