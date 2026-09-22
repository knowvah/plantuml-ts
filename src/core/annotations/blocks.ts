/**
 * blocks.ts — mission G0b / T4: the drawable half of `Style
 * .createTextBlockBordered` (`style/Style.java:315-332`) +
 * `TextBlockBordered` (`klimt/shape/TextBlockBordered.java`) +
 * `TextBlockMarged` (`klimt/shape/TextBlockMarged.java`, applied via
 * `TextBlockUtils.withMargin`). `DisplayPositioned#createRibbon`
 * (header/footer) delegates straight into `Style.createTextBlockBordered`
 * whenever a non-null `Style` is supplied (verified —
 * `abel/DisplayPositioned.java:118-128`), which is always the case from
 * `DiagramChromeFactory`, so header/footer/title/caption/legend all share
 * this ONE geometry: padding insets the text, a border/background rect is
 * drawn at the padded size (+1 on each axis for the block's REPORTED
 * dimension only — the drawn rect stays at the un-plus-oned size, jar-
 * verified below), then margin wraps that OUTSIDE the border.
 *
 * `kind` is accepted per the T4 interface contract (buildAnnotationBlock's
 * mandated first parameter) but not branched on internally — all five
 * elements share identical box geometry; only their `AnnotationBoxStyle`
 * (T2's `resolveAnnotationStyles`) differs. Kept for call-site consistency
 * and as a forward-compatible hook, should a later diagram type (D10:
 * json/dot/chart) need a per-kind rendering nuance this shared box does
 * not yet have.
 *
 * Text-rendering path (cdd-T28): the text inside the border is a real
 * klimt creole block — `Style#createTextBlockBordered`'s own first
 * statement is `note.create0(fc, alignment, spriteContainer, lineBreak,
 * CreoleMode.FULL, null, null)` (`style/Style.java:358-359`), so every
 * chrome line gets the SAME table/tree/`----`-rule/bold/italic stripe
 * machinery member rows and description labels get. `blocks-creole.ts`
 * (this file's sibling split) owns that pipeline and hands back the
 * block's `calculateDimension` plus its already-serialized markup; THIS
 * file stays `TextBlockBordered` + `TextBlockMarged` — padding, the
 * border/background rect, the +1 reported-dimension quirk and the margin
 * wrap. Before T28 this file measured and drew raw strings through a
 * local `parseCreole`/`measureLines`/`drawLines` trio: no table, no tree,
 * no horizontal rule (`kacico-91-bati232`'s legend drew 10 children
 * against the jar's 34).
 *
 * @see ~/git/plantuml/.../style/Style.java:315-332 (createTextBlockBordered)
 * @see ~/git/plantuml/.../klimt/shape/TextBlockBordered.java
 * @see ~/git/plantuml/.../klimt/shape/TextBlockMarged.java
 * @see ~/git/plantuml/.../klimt/drawing/svg/DriverRectangleSvg.java:78 (rx/2 quirk)
 * @see ~/git/plantuml/.../klimt/font/FontStack.java:187 (getSvgFamily — logical->CSS)
 */

import type { AnnotationBoxStyle, AnnotationElement } from './style.js';
import type { StringMeasurer } from '../measurer.js';
import { buildChromeTextBlock } from './blocks-creole.js';
import { rect } from '../svg.js';
import { shiftFragmentBody } from './coord-shift.js';
import type { BoxStyle } from '../svg.js';
import { resolveColorToSvgHex } from '../klimt/color/HColorSet.js';

/** The fragment shape {@link buildAnnotationBlock} returns — width/height
 *  are the block's OWN reported dimension (post padding/border/+1/margin),
 *  matching `TextBlock#calculateDimension`'s contract. */
export interface AnnotationBlock {
  readonly body: string;
  /** cdd-T28: the `<defs>` payload klimt lifts out of the chrome text
   *  block's own document (a `<back:red>` text-background `filter`, a
   *  gradient, ...) — `chrome.ts` merges it into `RenderFragment.extraDefs`
   *  so `assembleSvg` emits it once at the top of the document, exactly
   *  where `SvgGraphicsCore` puts the diagram body's own. Absent (not
   *  empty-string) when there are none, matching `DrawableFragment`'s own
   *  convention (`klimt/document-shell.ts`). */
  readonly extraDefs?: string;
  readonly width: number;
  readonly height: number;
}

/** `TextBlockBordered#calculateDimension` reports `width + 1, height + 1`
 *  (TextBlockBordered.java:95-98) but `getPolygonNormal` draws the border
 *  rect at the UN-plus-oned `getTextWidth`/`getTextHeight` (:146-150) — the
 *  block's reported size is always 1px larger, on each axis, than what it
 *  actually paints. Re-verified (G2 N45) against the SAME legend fixture,
 *  read correctly this time: rect 70.725 × 38 == pureTextWidth(60.725)+
 *  padding(10) × pureTextHeight(2*14=28)+padding(10), no +1; the block's
 *  outward dimension (consumed one level up, by `decorateEntityImage` in
 *  chrome.ts) carries the +1. */
const BORDERED_DIMENSION_QUIRK = 1;

/** `DriverRectangleSvg.java:78`: `svg.svgRectangle(x, y, width, height,
 *  rx / 2, ry / 2, ...)` — `TextBlockBordered`'s own `URectangle
 *  .rounded(cornersize)` (TextBlockBordered.java:149) sets rx=ry=cornersize
 *  verbatim, but the SVG emission driver halves it again on the way out.
 *  Jar-verified: `plantuml.skin`'s legend `roundCorner: 15` (style.ts's
 *  `BASE_DEFAULTS.legend.roundCorner`) emits `rx="7.5"` in the oracle's
 *  own SVG, not `rx="15"`. */
const SVG_ROUND_CORNER_DIVISOR = 2;

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/** G2 N50: jar's `TextBlockBordered#drawU` always applies an EXPLICIT
 *  stroke -- `stroke:none` when `lineColor` is `null`, never an omitted
 *  attribute -- with `stroke-width` set to the style's OWN
 *  `lineThickness` (`AnnotationBoxStyle#lineThickness`, `style.ts`'s
 *  `titleBorderThickness`/`legendBorderThickness` skinparam wiring) --
 *  jar-verified `bajula-59-puxi485` (`document { header { BackgroundColor
 *  lightGray } }`, no `LineColor`/`BorderThickness` override: oracle draws
 *  `style="stroke:none;stroke-width:1;"`, the root-default `lineThickness`,
 *  this port omitted both entirely) and `cifeta-62-xodi576`/`medexe-08-
 *  ledo064` (`skinparam Legend/title { BorderThickness N }`: oracle's
 *  `stroke-width` follows the override, not the fixed root default).
 *  `rx`/`ry` are likewise ALWAYS paired when `roundCorner` is non-zero
 *  (`URectangle.rounded` sets both to the SAME halved value) and BOTH
 *  omitted (never a literal `rx="0"`) when it is zero -- a
 *  `RoundRectangle2D` with zero radius degenerates to a plain
 *  `Rectangle2D` upstream, never reaching the rx/ry-emitting branch --
 *  jar-verified the SAME `bajula-59-puxi485` fixture (header, roundCorner 0:
 *  no `rx`/`ry` at all) and `mumefa-23-xoxe715` (legend, roundCorner 15: the
 *  oracle's `ry="7.5"` was missing from this port's rx-only output). G2 N51:
 *  `fill` is likewise now ALWAYS explicit (`resolveBoxFill` below), never
 *  omitted -- see that function's own doc comment. */
function borderBoxStyle(style: AnnotationBoxStyle): BoxStyle {
  const box: BoxStyle = {
    stroke: style.lineColor ?? 'none',
    strokeWidth: style.lineThickness,
    fill: resolveBoxFill(style),
  };
  if (style.roundCorner !== 0) {
    const corner = style.roundCorner / SVG_ROUND_CORNER_DIVISOR;
    box.rx = corner;
    box.ry = corner;
  }
  return box;
}

/**
 * G2 N51: jar's `TextBlockBordered#drawU` (`klimt/shape/TextBlockBordered
 * .java:122-127`) resolves the fill to the LITERAL "none" color -- never
 * an omitted attribute -- in THREE cases: no `backgroundColor` set, an
 * explicitly transparent one (this port's `null` already models both),
 * OR the resolved color EQUALS the document canvas's own background
 * (`ug.getDefaultBackground()`) -- a redundant-fill suppression jar
 * applies so a chrome block that happens to match the canvas doesn't draw
 * a pointless opaque rect. jar-verified `mumefa-23-xoxe715` (the legend's
 * `<style> document { BackGroundColor yellow } }`-cascaded background
 * resolves to the SAME yellow as the document canvas -- oracle draws
 * `fill="none"`) against the counter-fixture `majoge-68-zuji574`
 * (`document { BackGroundColor orange; legend { BackgroundColor green
 * } }` -- DIFFERENT colors, the legend keeps its own explicit `#008000`).
 * Comparison runs both sides through `resolveColorToSvgHex` -- the stored
 * `backgroundColor` may still be a raw CSS/named-color token (`"yellow"`,
 * `resolveChromeColor`'s own doc comment), while `documentBackground` is
 * ALREADY hex-normalized (`resolveAnnotationStyles`'s own doc comment).
 */
function resolveBoxFill(style: AnnotationBoxStyle): string {
  if (style.backgroundColor === null) return 'none';
  if (resolveColorToSvgHex(style.backgroundColor) === style.documentBackground) return 'none';
  return style.backgroundColor;
}

/** Border/background rect at the un-plus-oned padded size (see
 *  {@link BORDERED_DIMENSION_QUIRK}), suppressed when BOTH the RESOLVED
 *  fill (`resolveBoxFill` -- post redundant-fill-collapse, G2 N51) and
 *  `lineColor` are none/`null` (`TextBlockBordered#drawU`: `back
 *  .isTransparent() == false || color.isTransparent() == false`, collapsed
 *  to this port's `string | null` color model — `null`/`'none'` IS the
 *  transparent/absent case). G2 N51: MUST check the resolved fill, not the
 *  raw `style.backgroundColor` -- a `document{BackGroundColor X}` cascade
 *  can make `backgroundColor` non-`null` while STILL collapsing to `'none'`
 *  (X equals the canvas background), and jar draws NO rect at all for that
 *  case when there is also no line color (title/header/footer/caption's
 *  own `lineColor: null` default, jar-verified `mumefa-23-xoxe715`: no
 *  `<rect>` before its header/title/footer `<text>`) -- only `legend`'s
 *  OWN non-null default `lineColor: 'black'` keeps its rect alive
 *  (`fill="none" stroke="black"`) under the identical collapse. */
function buildBorderRect(style: AnnotationBoxStyle, textWidth: number, textHeight: number): string {
  // `TextBlockBordered#noBorder()` is exactly `stroke.getThickness() == 0`,
  // and `drawU` then sets `color = back` (transparent) rather than the border
  // color — so a zero-thickness border makes BOTH sides transparent and the
  // whole `ug.draw(polygon)` is skipped. Without this, a theme that sets
  // `root { LineColor … }` and `document { title { LineThickness 0 } }` — the
  // shape every bundled theme uses — draws a border the jar does not
  // (`yaml/tadari-70-nare798`, whose `<g class=\"title\">` holds ONE child).
  const noBorder = style.lineThickness === 0;
  const effectiveLineColor = noBorder ? null : style.lineColor;
  if (resolveBoxFill(style) === 'none' && effectiveLineColor === null) return '';
  return rect(0, 0, textWidth, textHeight, borderBoxStyle(style));
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Builds one bordered/margined annotation block: the creole text block
 * (`blocks-creole.ts`, padding-inset), an optional border/background rect
 * (suppressed when both `backgroundColor` and `lineColor` are `null` —
 * title/caption/header/footer's transparent defaults), then a margin wrap
 * outside the border.
 *
 * `TextBlockBordered`'s own arithmetic, verbatim: `getPureTextWidth`/
 * `getTextHeight` are the inner block's `calculateDimension` plus the
 * padding (java:80-91); `calculateDimension` reports both +1
 * ({@link BORDERED_DIMENSION_QUIRK}, java:93-98) while the rect is drawn
 * at the un-plus-oned size (java:146-150); the text is drawn at
 * `UTranslate(left, top)` (java:141).
 *
 * `kind` is the chrome element's name and now does real work: it seeds the
 * text block's own id namespace (`blocks-creole.ts#buildChromeTextBlock`'s
 * `uid`), so a `<back:red>` filter minted for the legend cannot collide
 * with the footer's.
 *
 * Invariant (caller-enforced, not re-checked here per code-principles —
 * every `matchLegend*`/`matchTitle`/etc. command guards non-empty display
 * before storing a non-null `DisplayPositioned`, and `chrome.ts` only calls
 * this after its own `isDisplayPositionedNull` check): `displayLines` is
 * always non-empty.
 *
 * @see Style.java:353-369 (createTextBlockBordered), TextBlockBordered.java,
 *   TextBlockMarged.java (module doc comment has the full citation list).
 */
export function buildAnnotationBlock(
  kind: AnnotationElement,
  displayLines: readonly string[],
  style: AnnotationBoxStyle,
  measurer: StringMeasurer,
): AnnotationBlock {
  // `TextBlockBordered#drawU`'s own `color` local (java:126-134): the
  // border colour, EXCEPT that a zero-thickness border makes `color = back`
  // (`noBorder()`, java:114-119, the same branch {@link buildBorderRect}
  // reads) and a null one becomes `HColors.none()`.
  const color = style.lineThickness === 0 ? resolveBoxFill(style) : (style.lineColor ?? 'none');
  const textBlock = buildChromeTextBlock({ uid: kind, color }, displayLines, style, measurer);

  const textWidth = textBlock.width + style.padding.left + style.padding.right;
  const textHeight = textBlock.height + style.padding.top + style.padding.bottom;

  const borderedBody =
    buildBorderRect(style, textWidth, textHeight) +
    shiftFragmentBody(textBlock.body, style.padding.left, style.padding.top);

  const width = textWidth + BORDERED_DIMENSION_QUIRK + style.margin.left + style.margin.right;
  const height = textHeight + BORDERED_DIMENSION_QUIRK + style.margin.top + style.margin.bottom;
  // G1d: margin is BAKED into borderedBody's own coordinates (no `<g
  // transform>` wrapper) — matches jar's bare `<g class="...">` shape
  // (annotation.ts#chrome.ts wraps the whole result in that class-bearing
  // `<g>` after this returns); a nested transform here would double-shift
  // when chrome.ts later bakes its OWN (xText,yText) offset on top.
  const body = shiftFragmentBody(borderedBody, style.margin.left, style.margin.top);

  return textBlock.extraDefs === undefined
    ? { body, width, height }
    : { body, extraDefs: textBlock.extraDefs, width, height };
}
