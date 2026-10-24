/**
 * driver-centered-character-svg.ts — the `UCenteredCharacter` → SVG `<path>`
 * driver: one glyph outline, filled with the current foreground colour.
 *
 * Upstream: klimt/drawing/svg/DriverCenteredCharacterSvg.java (83 ln).
 * Ported: `draw` (the non-deterministic branch, java:72-81).
 *
 * NOT ported (reported):
 *  - the `fileFormat == FileFormat.SVG_DETERMINISTIC` `<text>` shortcut
 *    (java:62-70) and the constructor's `fileFormat` (java:51-55): this port
 *    has no `FileFormat` (`UGraphicSvg.build` drops it, see `u-graphic-svg.ts`),
 *    and the oracle renders never select that format
 *    (`-DPLANTUML_DETERMINISTIC_TEXT=true` swaps only the `StringBounder`,
 *    `core/spot-glyph-data.ts`'s header);
 *  - `DriverCenteredCharacterSvgDeterministic` (the TeaVM branch,
 *    UGraphicSvg.java:131-132): this port is not a TeaVM transpile target.
 *
 * Library-forced: upstream computes the outline from the system font
 * (`UnusedSpace.getUnusedSpace(font, c)`, `font.createTextLayout(c)
 * .getOutline(null).getPathIterator(null)`, java:73-81) — AWT, absent here.
 * The outline is read from `core/spot-glyph-data.ts#spotGlyphPath`, the
 * table of outlines scraped from jar renders and already translated to the
 * glyph's centre (`x - centerX - 0.5`, java:75-76, is what places it), then
 * replayed through the `SvgGraphics` path builder exactly as
 * `SvgGraphics#drawPathIterator` (SvgGraphics.java:944-968) does: `newpath`,
 * one `moveto`/`lineto`/`quadto`/`closepath` per segment, `fill`. A
 * (size, letter) with no capture draws nothing — a made-up outline would not
 * be the jar's (the same rule `spotGlyphPath` documents).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverCenteredCharacterSvg.java:49-83
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import { noGradient } from '../../../paint.js';
import { toSvgPaint, type ColorMapper } from '../../color/ColorMapper.js';
import type { UCenteredCharacter } from '../../shape/UCenteredCharacter.js';
import { spotGlyphPath } from '../../../spot-glyph-data.js';
import type { SvgGraphics } from './svg-graphics.js';

/** `java.awt.geom.PathIterator.WIND_NON_ZERO`, the rule `TextLayout#getOutline` reports. */
const WIND_NON_ZERO = 1;

/** One `d`-string command: letter, then its coordinate numbers. */
const SEGMENT_RE = new RegExp('([MLQZ])([^MLQZ]*)', 'g');

/** Replays a `spotGlyphPath` string through `svg`'s path builder — the
 *  `PathIterator` loop of `SvgGraphics#drawPathIterator` (java:946-964). */
function replayOutline(svg: SvgGraphics, d: string): void {
  svg.newpath();
  for (const [, code, args] of d.matchAll(SEGMENT_RE)) {
    const n = (args ?? '')
      .split(/[\s,]+/)
      .filter((t) => t !== '')
      .map(Number);
    if (code === 'M') svg.moveto(n[0]!, n[1]!);
    else if (code === 'L') svg.lineto(n[0]!, n[1]!);
    else if (code === 'Q') svg.quadto(n[0]!, n[1]!, n[2]!, n[3]!);
    else svg.closepath();
  }
  svg.fill(WIND_NON_ZERO);
}

/** Upstream: `DriverCenteredCharacterSvg`. */
export class DriverCenteredCharacterSvg implements UDriver<UCenteredCharacter> {
  constructor(private readonly svg: SvgGraphics) {}

  /** @see DriverCenteredCharacterSvg.java:57-82 */
  draw(characterCircled: UCenteredCharacter, param: UParam, mapper: ColorMapper): void {
    const x = param.getTranslate().getDx();
    const y = param.getTranslate().getDy();
    // `textColor.toSvg(mapper)` (java:60, :79); for a gradient that is its first stop
    // (`HColorGradient#toColor` = `color1.toColor(mapper)`, HColorGradient.java:103-104).
    const textColor = noGradient(toSvgPaint(param.getColor(), mapper));
    this.svg.setFillColor(textColor); // java:79
    const font = characterCircled.getFont();
    const outline = spotGlyphPath(characterCircled.getChar(), font.getSize(), x, y);
    if (outline !== undefined) replayOutline(this.svg, outline); // java:81
  }
}
