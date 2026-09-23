/**
 * driver-text-svg-decorations.ts — the pure, emitter-independent half of
 * `DriverTextSvg#draw`: every decision that method makes about a text run's
 * `font-weight`, `font-style`, `text-decoration`, extended-colour
 * decoration LINES and BACKCOLOR filter, given only its
 * `FontConfiguration`.
 *
 * Upstream: klimt/drawing/svg/DriverTextSvg.java:93-180 plus its nested
 * `ExtraLines` class (java:60-76). Split out of `driver-text-svg.ts` so the
 * SAME decisions serve this port's TWO text-emission paths without a second
 * port of the rules: the klimt driver (`driver-text-svg.ts`, used by
 * description and by every chrome block since cdd-T28) and class's own
 * pure-string renderers (`diagrams/class/renderer-classifier-rows.ts`,
 * `renderer-note.ts`), which have no `UDriver`/`UGraphic` seam to hang a
 * shared driver off of and had each grown their own partial copy of the
 * `text-decoration` rule (each file's own doc comment says so).
 *
 * Everything here is a pure function of a `FontConfiguration` (+ the drawn
 * font size, which is `fontConfiguration.getFont().getSize2D()` upstream) —
 * no emitter, no measurer, no state.
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/DriverTextSvg.java:60-76,93-180
 */

import { parseColor } from '../../../paint.js';
import { FontStyle, getFontFace, type FontConfiguration } from '../../shape/UText.js';

/**
 * One entry of upstream's `DriverTextSvg.ExtraLines` (java:60-76): a
 * custom-coloured underline/strike-through that CSS `text-decoration`
 * cannot express, drawn as its own `<line>` after the `<text>`.
 *
 * `color` is the RAW `FontConfiguration.extendedColor` token (upstream's
 * `HColor`); the emitter resolves and shortens it, matching upstream's
 * `colors.get(i).toSvg(mapper)` (java:70).
 */
export interface ExtraLine {
  readonly color: string;
  /** Added to the text baseline `y` (upstream: `y + deltaYs.get(i)`,
   *  java:72) — positive below the baseline for an underline, negative
   *  above it for a strike-through. */
  readonly deltaY: number;
}

/** Everything `DriverTextSvg#draw` derives from the font configuration
 *  alone, in one value so both emitters make one call. */
export interface TextRenderDecorations {
  /** `<text font-weight>` — upstream's two-tier fallback, java:97-103. */
  readonly fontWeight: string | null;
  /** `<text font-style>` — java:105-107. */
  readonly fontStyle: string | null;
  /** `<text text-decoration>` — java:129-157. `null` for "omit". */
  readonly textDecoration: string | null;
  /** The custom-coloured decoration lines, in upstream's own add order
   *  (underline before strike-through). */
  readonly extraLines: readonly ExtraLine[];
  /** `SvgGraphics#text`'s `textBackColor` — the raw token for the
   *  `feFlood` filter, `null` when the run carries no solid BACKCOLOR
   *  (java:159-173). */
  readonly backColor: string | null;
  /** The BACKCOLOR run whose extended colour is a GRADIENT (java:161-169,
   *  the `back instanceof HColorGradient` arm): the raw gradient token, for
   *  the emitter to turn into a `<linearGradient>` def plus the background
   *  rectangle upstream draws instead of a filter. `null` for every other
   *  run. */
  readonly backGradient: string | null;
}

/**
 * Upstream `DriverTextSvg.java:97-103` VERBATIM, including its own comment's
 * intent ("Emit full numeric CSS weight ... rather than being collapsed to
 * binary bold/normal"):
 *
 * ```java
 * if (fontConfiguration.containsStyle(FontStyle.BOLD))
 *   fontWeight = (face.getCssWeight() >= 700) ? face.toCssWeightString() : "700";
 * else if (face.getCssWeight() != 400)
 *   fontWeight = face.toCssWeightString();
 * ```
 *
 * The SECOND tier is the one this port lacked before cdd-B7FU-R1, and it is
 * what keeps a `skinparam classFontStyle bold` header bold through a
 * `<plain>` tag: `FontConfiguration#add` clears `styles` but never
 * `currentFont`'s face, so the first tier goes false while the second still
 * reads 700 (journal rows 119-121, `diseka-11-gozu390`).
 */
export function fontWeightOf(font: FontConfiguration): string | null {
  const face = getFontFace(font);
  if (font.styles.has(FontStyle.BOLD)) return face.cssWeight >= 700 ? String(face.cssWeight) : '700';
  if (face.cssWeight !== 400) return String(face.cssWeight);
  return null;
}

/** Upstream `DriverTextSvg.java:105-107`: `containsStyle(ITALIC) ||
 *  face.isItalic()`. */
export function fontStyleOf(font: FontConfiguration): string | null {
  return font.styles.has(FontStyle.ITALIC) || getFontFace(font).italic ? 'italic' : null;
}

/** Upstream `ExtraLines#drawAll`'s stroke width (java:71):
 *  `font.getSize2D() / 28.0`, on the DRAWN (muted) font size. */
export function extraLineStrokeWidth(drawnFontSize: number): number {
  return drawnFontSize / 28.0;
}

/** Upstream java:135-140 — the UNDERLINE delta. The `getUnderlineStroke()
 *  .getThickness() > 0` gate (java:133-134) has no equivalent on this
 *  port's `FontConfiguration` and is assumed true, exactly as the plain-CSS
 *  branch already assumed it (`driver-text-svg.ts`'s module doc comment). */
function underlineDeltaY(drawnFontSize: number): number {
  return drawnFontSize / 14.0;
}

/** Upstream java:142-148 — the STRIKE delta, ABOVE the baseline. */
function strikeDeltaY(drawnFontSize: number): number {
  return -drawnFontSize / 4.0;
}

/** Upstream java:129-157: the decoration accumulator. Each of UNDERLINE and
 *  STRIKE takes the plain-CSS branch when `getExtendedColor() == null` and
 *  the `ExtraLines` branch otherwise; WAVE has NO extended-colour arm at all
 *  (java:150-155) — `<w:green>` draws a plain `wavy underline`, verified
 *  against `ziripa-77-zizo842`'s oracle. */
function accumulateDecorations(
  font: FontConfiguration,
  drawnFontSize: number,
): { decoration: string | null; extraLines: ExtraLine[] } {
  const parts: string[] = [];
  const extraLines: ExtraLine[] = [];
  const extended = font.extendedColor;
  if (font.styles.has(FontStyle.UNDERLINE)) {
    if (extended === undefined) parts.push('underline');
    else extraLines.push({ color: extended, deltaY: underlineDeltaY(drawnFontSize) });
  }
  if (font.styles.has(FontStyle.STRIKE)) {
    if (extended === undefined) parts.push('line-through');
    else extraLines.push({ color: extended, deltaY: strikeDeltaY(drawnFontSize) });
  }
  if (font.styles.has(FontStyle.WAVE)) parts.push('wavy underline');
  return { decoration: parts.length > 0 ? parts.join(' ') : null, extraLines };
}

/** True when an extended-colour token is upstream's `HColorGradient` — the
 *  `colorA<sep>colorB` form `HColorSet#parseColor`'s gradient branch builds
 *  (`FontStyle.java:128-133`'s own optional second half is exactly that
 *  token). Delegates to `paint.ts#parseColor`, this port's single ported
 *  gradient detector, rather than re-deriving the grammar here. */
function isGradientToken(token: string): boolean {
  return typeof parseColor(token) !== 'string';
}

/** Upstream java:159-173 — the BACKCOLOR split: a gradient extended colour
 *  draws a filled rectangle behind the run, a solid one becomes the
 *  `feFlood` filter `SvgGraphics#text` registers. */
function backColorOf(font: FontConfiguration): { backColor: string | null; backGradient: string | null } {
  const extended = font.extendedColor;
  if (!font.styles.has(FontStyle.BACKCOLOR) || extended === undefined) {
    return { backColor: null, backGradient: null };
  }
  if (isGradientToken(extended)) return { backColor: null, backGradient: extended };
  return { backColor: extended, backGradient: null };
}

/**
 * The whole font-configuration-derived half of `DriverTextSvg#draw`
 * (java:93-173) in one call.
 *
 * @param drawnFontSize upstream's `font.getSize2D()` — the EFFECTIVE
 *   (`getFont()`-muted) size, so a `<sup>` run's decoration lines scale with
 *   the size it is actually drawn at.
 */
export function textRenderDecorations(font: FontConfiguration, drawnFontSize: number): TextRenderDecorations {
  const { decoration, extraLines } = accumulateDecorations(font, drawnFontSize);
  const back = backColorOf(font);
  return {
    fontWeight: fontWeightOf(font),
    fontStyle: fontStyleOf(font),
    textDecoration: decoration,
    extraLines,
    backColor: back.backColor,
    backGradient: back.backGradient,
  };
}
