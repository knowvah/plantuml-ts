/**
 * driver-text-svg.ts — the `UText` → SVG `<text>` driver.
 *
 * Upstream: klimt/drawing/svg/DriverTextSvg.java (~185 ln). Ported: the
 * leading-space-to-x-offset shift, whitespace-only → NBSP substitution,
 * final `StringUtils.trin` trim, the BOLD/ITALIC → `font-weight`/
 * `font-style` mapping, the UNDERLINE/STRIKE/WAVE → `text-decoration`
 * accumulation, and the `<text>` emission call itself.
 *
 * `StringBounder` seam (this task's own finding, reported): upstream's
 * constructor takes a real `StringBounder` (AWT-backed text-measurement
 * engine) — a whole subsystem, not part of any batch-1/2/3 write-set
 * (see `UText.ts`'s own deferred-methods note: "measurement is a
 * separate subsystem from shape data, not ported here"). Rather than
 * inventing a font-metrics table (which would silently diverge from the
 * jar's real glyph widths), this driver keeps upstream's own
 * constructor-injection shape: a minimal local `StringBounder` interface
 * (the single method this driver actually calls,
 * `calculateDimension(font, text)`) that callers must supply a real
 * implementation of. Tests inject a stub returning the exact widths
 * recorded in the cached jar fixtures, which validates this driver's
 * attribute-emission logic against real jar values without this task
 * inventing font metrics.
 *
 * FontConfiguration gaps, as of cdd-B7FU-R1 (which added
 * `FontConfiguration.fontFace` and `.extendedColor` — see `UText.ts`):
 * - `font-weight`/`font-style`/`text-decoration`/`ExtraLines`/`BACKCOLOR`:
 *   all ported, in `driver-text-svg-decorations.ts` (the pure half, shared
 *   with class's own string renderers) plus the two emission helpers
 *   below. That includes upstream's two-tier face-weight fallback
 *   (java:97-103) and the `face.isItalic()` override (java:105-107).
 * - `getUnderlineStroke().getThickness() > 0` (java:133-134): ported as
 *   {@link underlineGate} — `getUnderlineStroke()` is the configuration's
 *   `hyperlinkUnderlineStroke` (FontConfiguration.java:386-388).
 * - the `HColorGradient` BACKCOLOR arm (java:161-169) needs the run's
 *   measured HEIGHT; see `drawBackGradient` below for the seam condition.
 * - `fontConfiguration.getAttributes()` (extra literal SVG attributes):
 *   deferred — no such field on this port's `FontConfiguration`; an
 *   empty `Map` is passed to `text()`'s `attributes` param instead.
 * - `font.getFamily(text, UFontContext.SVG)` (content-aware family
 *   resolution, e.g. CJK fallback fonts): deferred — this port's
 *   `FontConfiguration.family` is used as-is, with no `UFontContext`
 *   equivalent.
 *
 * `UClip`/`ClipContainer` — not ported (same as `DriverRectangleSvg`);
 * this driver's constructor takes no `clipContainer` param and never
 * early-returns for an off-clip text origin.
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import { parseColor } from '../../../paint.js';
import { resolveColorToSvgHex } from '../../color/HColorSet.js';
import { toSvgPaint, toSvgSolid, type ColorMapper } from '../../color/ColorMapper.js';
import { shortenColor } from '../../../svg-format.js';
import { FontStyle, getFont } from '../../shape/UText.js';
import { UStroke } from '../../UStroke.js';
import { extraLineStrokeWidth, textRenderDecorations, type ExtraLine } from './driver-text-svg-decorations.js';
import type { UText, FontConfiguration } from '../../shape/UText.js';
import type { SvgGraphics } from './svg-graphics.js';

/** See the module doc comment above for why this is a local, injected
 * seam rather than a real font-metrics implementation. Upstream:
 * `klimt.font.StringBounder#calculateDimension(UFont, String)`. */
export interface StringBounder {
  calculateDimension(
    font: { readonly family: string; readonly size: number },
    text: string,
  ): { readonly width: number; readonly height?: number };
}

/**
 * `fontConfiguration.getColor().toSvg(mapper)` (DriverTextSvg.java:177-178):
 * the bridged `HColorSimple` while {@link FontConfiguration.color} is still
 * its light paint (`UText.ts#hColor`), else the colour string, mapped.
 */
function fontColorOf(font: FontConfiguration, color: string, mapper: ColorMapper): string {
  if (font.hColor !== undefined && font.hColor.asPaint() === color) return font.hColor.toSvg(mapper);
  return toSvgSolid(color, mapper);
}

// Upstream: `text.replace(' ', (char) 160)` — regular space -> NBSP.
const NBSP = '\u00A0';

// Upstream: `StringUtils.trin(String)` — trims only characters whose code
// point is <= U+0020 (space), from both ends. Deliberately NOT JS's
// `.trim()`: JS's `.trim()` also strips U+00A0 (NBSP) per the ECMAScript
// WhiteSpace production, but upstream's `<= ' '` check does NOT (0xA0 >
// 0x20) — using `.trim()` here would silently swallow the very NBSP
// glyphs the whitespace-only substitution above just inserted. Ported
// faithfully rather than approximated, per this task's own finding.
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/**
 * `fontConfiguration.containsStyle(FontStyle.UNDERLINE) &&
 * fontConfiguration.getUnderlineStroke().getThickness() > 0`
 * (DriverTextSvg.java:133-134) gates BOTH underline arms (CSS `underline`
 * and the extended-colour `ExtraLines` rule). `getUnderlineStroke()` returns
 * the `hyperlinkUnderlineStroke` field (FontConfiguration.java:386-388):
 * `undefined` here is its unset default `UStroke.simple()` (UText.ts), and
 * `null` (`skinparam hyperlinkUnderline false`, SkinParam.java:1057-1061)
 * makes Java NPE on `getThickness()`. A failing gate drops UNDERLINE from
 * the configuration the decoration accumulator reads; nothing else in
 * `textRenderDecorations` reads UNDERLINE.
 */
function underlineGate(font: FontConfiguration): FontConfiguration {
  if (!font.styles.has(FontStyle.UNDERLINE)) return font;
  const stroke = font.hyperlinkUnderlineStroke === undefined ? UStroke.simple() : font.hyperlinkUnderlineStroke;
  if (stroke === null) throw new Error('NullPointerException: getUnderlineStroke() is null (DriverTextSvg.java:134)');
  if (stroke.getThickness() > 0) return font;
  const styles = new Set(font.styles);
  styles.delete(FontStyle.UNDERLINE);
  return { ...font, styles };
}

function measuredFont(font: FontConfiguration): { family: string; size: number; weight?: 'bold'; style?: 'italic' } {
  const { family, size } = getFont(font);
  return {
    family,
    size,
    ...(font.styles.has(FontStyle.BOLD) ? { weight: 'bold' as const } : {}),
    ...(font.styles.has(FontStyle.ITALIC) ? { style: 'italic' as const } : {}),
  };
}

/** Upstream: `DriverTextSvg`. Ported: the members listed in the module
 * doc comment above. */
export class DriverTextSvg implements UDriver<UText> {
  constructor(
    private readonly svg: SvgGraphics,
    private readonly stringBounder: StringBounder,
  ) {}

  draw(shape: UText, param: UParam, mapper: ColorMapper): void {
    const font = shape.getFontConfiguration();
    if (font.color === null) return; // Upstream: fontConfiguration.getColor().isTransparent().

    const y = param.getTranslate().getDy();
    const { text, x } = this.leadingSpaceAdjust(shape.getText(), param.getTranslate().getDx(), font);
    const trimmed = trin(text); // Upstream: StringUtils.trin(text).
    // SI30: every read of the drawing font goes through `getFont`
    // (upstream: `fontConfiguration.getFont()`, FontConfiguration.java:98-104
    // — DriverTextSvg.java:96 binds ONE `font` local from it and uses that
    // same local for the leading-space measure (java:118), the dimension
    // measure (java:126) and the emitted `font.getSize()` (java:179)), so a
    // `<sup>`/`<sub>` run measures AND renders at the muted size. Identical to
    // `font` for a NORMAL run.
    const drawFont = getFont(font);
    const dim = this.stringBounder.calculateDimension(measuredFont(font), trimmed);
    const deco = textRenderDecorations(underlineGate(font), drawFont.size);

    // Upstream java:161-169: a GRADIENT extended colour is painted as a
    // filled rectangle UNDER the run (`deltaPatch = 2`, java:167-168),
    // before the text itself and instead of the `feFlood` filter.
    this.drawBackGradient(deco.backGradient, x, y, dim, mapper);

    this.svg.setFillColor(fontColorOf(font, font.color, mapper));
    this.svg.text(trimmed, x, y, {
      fontFamily: drawFont.family,
      fontSize: drawFont.size,
      fontWeight: deco.fontWeight,
      fontStyle: deco.fontStyle,
      textDecoration: deco.textDecoration,
      textLength: dim.width,
      attributes: font.svgAttributes?.attributes() ?? new Map(),
      textBackColor: deco.backColor === null ? null : toSvgSolid(resolveColorToSvgHex(deco.backColor), mapper),
      orientation: shape.getOrientation(),
    });

    // Upstream java:180: `extraLines.drawAll(x, y, width, font, mapper, svg)`
    // — AFTER the `<text>`, so the coloured rule sits above it in document
    // order exactly as the jar emits it.
    this.drawExtraLines(deco.extraLines, { x, y, width: dim.width }, drawFont.size, mapper);
  }

  /** Upstream `ExtraLines#drawAll` (`DriverTextSvg.java:68-75`), each
   *  colour `toSvg(mapper)` (java:72). */
  private drawExtraLines(
    extraLines: readonly ExtraLine[],
    at: { readonly x: number; readonly y: number; readonly width: number },
    drawnFontSize: number,
    mapper: ColorMapper,
  ): void {
    const { x, y, width } = at;
    for (const extra of extraLines) {
      this.svg.setStrokeColor(shortenColor(toSvgSolid(resolveColorToSvgHex(extra.color), mapper)));
      this.svg.setStrokeWidth(extraLineStrokeWidth(drawnFontSize), null);
      this.svg.svgLine(x, y + extra.deltaY, x + width, y + extra.deltaY, 0);
    }
  }

  /** Upstream `DriverTextSvg.java:161-169` — the `HColorGradient` arm of the
   *  BACKCOLOR branch. Needs the run's measured HEIGHT, which this driver's
   *  own narrow `StringBounder` seam only supplies when its implementation
   *  chooses to (the field is optional, see that interface); with no height
   *  there is nothing to size the patch rectangle from and upstream's own
   *  input is simply unavailable, so the rectangle is skipped rather than
   *  invented. No corpus fixture reaches this arm (a `<back:a|b>` gradient
   *  token appears in none of the 27 cached diagram-type corpora). */
  private drawBackGradient(
    backGradient: string | null,
    x: number,
    y: number,
    dim: { readonly width: number; readonly height?: number },
    mapper: ColorMapper,
  ): void {
    if (backGradient === null || dim.height === undefined) return;
    // `gr.getColor1().toRGB(mapper)`, `gr.getColor2().toRGB(mapper)` (java:165).
    const paint = toSvgPaint(parseColor(backGradient), mapper);
    if (typeof paint === 'string') return;
    const id = this.svg.createSvgGradient(paint.color1, paint.color2, paint.policy);
    this.svg.setFillColor(`url(#${id})`);
    this.svg.setStrokeColor(null);
    const deltaPatch = 2;
    const geo = { x, y: y - dim.height + deltaPatch, width: dim.width, height: dim.height, rx: 0, ry: 0 };
    this.svg.svgRectangle(geo, 0);
  }

  // Upstream: the whitespace-only NBSP substitution + leading-space →
  // x-offset loop at the top of `draw`. Factored out to keep `draw`
  // under this port's per-function NLOC budget.
  private leadingSpaceAdjust(
    rawText: string,
    x0: number,
    font: FontConfiguration,
  ): { readonly text: string; readonly x: number } {
    let text = /^\s*$/.test(rawText) ? rawText.split(' ').join(NBSP) : rawText;
    let x = x0;
    if (text.startsWith(' ')) {
      const space = this.stringBounder.calculateDimension(measuredFont(font), ' ').width;
      while (text.startsWith(' ')) {
        x += space;
        text = text.slice(1);
      }
    }
    return { text, x };
  }
}
