/**
 * Class-diagram edge LABEL attachment: the main label's plain, multi-line,
 * guide-line and magic-arrow arms, plus the text context every anchor
 * shares. Split out of `class-edge-geo.ts` (500-line hook cap, cdd-T6) --
 * a pure move; `class-edge-geo.ts` re-exports `EdgeGeoTextContext`.
 */
import type { Relationship } from './ast.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import {
  guideLinesAnchor,
  multiLineLabelAnchor,
  portLabelAnchor,
  type LabelAnchorContext,
} from './class-edge-label-anchor.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import {
  hasSeveralGuideLines,
  magicArrowAngle,
  magicArrowGlyphPoints,
  parseMagicArrowLabel,
  splitGuideLines,
  type MagicArrowDirection,
  type MagicArrowLabel,
} from './class-magic-arrow.js';
import { applyGuillemet } from '../../core/edge-label-box.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import { stripEdgeLabelVisibility, visibilityBlockAnchor } from './class-edge-visibility.js';
import type { Kal } from './class-kal.js';
import type { NoteBoxContext } from './class-layout-edge-labels.js';
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
  /** cdd-T6 (A2a/M2): `skinparam classAttributeIconSize` -- the SAME value
   *  `class-layout-edge-labels.ts#computeMeasuredLabelAttrs` passes to
   *  {@link applyVisibilityIcon} for the DOT reservation, so box and ink
   *  cannot disagree about whether a leading `-`/`#`/`+`/`~`/`*` is a
   *  visibility modifier (`LinkArg.build`'s `manageVisibilityModifier` is
   *  literally `skinParam.classAttributeIconSize() > 0`,
   *  `CommandLinkClass.java:348-350`). `undefined` takes
   *  `applyVisibilityIcon`'s own upstream default of 10. */
  readonly classAttributeIconSize?: number | undefined;
  /** cdd-T6 (A2a/M10): the resolved `arrow.cardinality` font -- forwarded
   *  verbatim to {@link attachPortLabels}, see
   *  `class-edge-label-anchor.ts#PortLabelContext.cardinalityFont`. */
  readonly cardinalityFont?: FontSpec | undefined;
  /** cdd-T6 (A2a/M5, M9): the theme + sprite pair `class-dot-graph.ts`
   *  already sized a `note on link`'s merged label box with. Needed here to
   *  recover the note operand's own dimension ({@link computeEdgeNoteBox})
   *  and, for `constraint on links`, the reserved box whose top-left is the
   *  constraint spot ({@link edgeLabelAttrs}). Optional so hand-built test
   *  callers compile unchanged; both mechanisms are skipped without it. */
  readonly noteCtx?: NoteBoxContext | undefined;
  /** cdd-T15 (A2a/M1, D6): the page's `Kal` list, built ONCE in
   *  `class-dot-graph.ts#buildDotGraph` (so the node shield margins and
   *  the drawn boxes cannot disagree about a box's size) and threaded here
   *  rather than as a ninth positional parameter to `buildEdgeGeos`, which
   *  already sits at this repo's parameter cap. Each `Kal.relIndex` indexes
   *  the SAME (already `getOrderedLinks`-reordered) relationship array
   *  `buildEdgeGeos` walks. Optional so hand-built test callers compile
   *  unchanged; the mechanism is skipped without it. */
  readonly kals?: readonly Kal[] | undefined;
  /** cdd-T16 (M7, `Link.java:238-239`): relationship index -> protected
   *  parent uid, for exactly the extends-like links a `skinparam
   *  groupInheritance` tail-count grouped -- threaded here for the SAME
   *  ninth-parameter reason {@link kals} is (`class-dot-graph.ts
   *  #DotGraphParts.sametailByRelIndex`'s own doc comment). Optional so
   *  hand-built test callers compile unchanged; every relationship is
   *  treated as ungrouped without it. */
  readonly sametailByRelIndex?: ReadonlyMap<number, string> | undefined;
  /** cdd-T16b (E11, `Neighborhood.java:97-113` `allButSametails`): every
   *  protected leaf's classifier id -- `class-dot-graph.ts
   *  #DotGraphParts.protectedIds`'s own doc comment. */
  readonly protectedIds?: ReadonlySet<string> | undefined;
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
export function attachEdgeLabel(
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
  const { measurer, labelFont } = text;

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
  // Escapes decode PER LINE, after the split -- decoding the whole string
  // first would let a decoded `<U+000A>` (a real newline) escape this
  // split, mirroring `StripeSimple.ts#decodeAtomEscapes`'s own established
  // per-line ordering. `.map` already returns a fresh mutable array, which
  // is what `attachMultiLineLabel`'s downstream callee
  // (`class-edge-label-anchor.ts#multiLineLabelAnchor`, outside T1's
  // write-set) needs (`string[]`, not `readonly string[]`).
  const { lines: splitLines, align } = splitDisplayLines(label);
  // cdd-T6 (A2a/M2): strip the leading visibility character from the drawn
  // FIRST line (`Display.java:415-416`) and record the icon block's own
  // anchor, exactly as `core/edge-label-box.ts#applyVisibilityIcon` already
  // reserved its `size+2` x `size+3` inside the DOT label box -- the
  // reservation is unchanged, so this moves ink only. See
  // `class-edge-visibility.ts` for the merge arithmetic and its jar
  // verification.
  const vis = stripEdgeLabelVisibility(splitLines[0] ?? '', text.classAttributeIconSize);
  const lines = [vis.text, ...splitLines.slice(1)].map(resolveTextEscapes);
  let center = { x: edgeResult.labelX, y: edgeResult.labelY };
  if (vis.modifier !== undefined) {
    const placed = visibilityBlockAnchor(vis, lines, center, labelFont, measurer);
    edgeGeo.visibilityIcon = placed.icon;
    center = placed.center;
  }
  const ctx: LabelAnchorContext = { center, measurer, labelFont };
  if (lines.length > 1) {
    attachMultiLineLabel(edgeGeo, lines, align, (direction) => magicArrowAngle(fromToPoints, direction), ctx);
    return;
  }

  // G2 item 44: a single-line label ending in `" >"`/`" <"` (or the bare
  // `>`/`<`/`"< "`/`"> "` forms) strips the arrow token and draws a small
  // triangle glyph instead -- see `attachMagicArrow`'s doc comment. A label
  // with no arrow token (`parseMagicArrowLabel` returns `undefined`) keeps
  // the EXACT pre-existing plain-text path below, unchanged. Reads the
  // resolved `lines[0]` (post-guillemet, post-escape-decode), not
  // `rel.label`: harmless when they differ, since a magic-arrow token is a
  // single `<`/`>`, never the `<<`/`>>` pair `applyGuillemet` rewrites, nor
  // a `<U+XXXX>` escape -- no corpus fixture combines either with the other.
  const resolvedLabel = lines[0] ?? '';
  const magic = parseMagicArrowLabel(resolvedLabel);
  if (magic !== undefined) {
    attachMagicArrow(edgeGeo, magic, fromToPoints, ctx);
    return;
  }

  edgeGeo.label = portLabelAnchor(resolvedLabel, center, measurer, labelFont);
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
