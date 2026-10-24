/**
 * `skinparam lengthAdjust` for the throwaway klimt `UGraphicSvg` documents the
 * activity text sheets draw through (D3: the klimt `SvgOption` carries the
 * value next to `RenderFragment.lengthAdjust`).
 *
 * `TextBlockExporter.java:306-307` -- `option.withLengthAdjust(skinParam.
 * getlengthAdjust())`; `SkinParam.java:1258-1269` maps the three names;
 * `SvgGraphics.java:703-705` omits `textLength` for NONE.
 */
import { LengthAdjust, type SvgOption } from '../../core/klimt/drawing/svg/svg-option.js';
import type { Theme } from '../../core/theme.js';

const KLIMT_LENGTH_ADJUST = {
  spacing: LengthAdjust.SPACING,
  spacingAndGlyphs: LengthAdjust.SPACING_AND_GLYPHS,
  none: LengthAdjust.NONE,
} as const;

/** The `SvgOption` override for `theme.lengthAdjust`; empty when unset so the
 *  klimt default (SPACING) applies untouched (D4). */
export function lengthAdjustOption(theme: Theme): Partial<SvgOption> {
  return theme.lengthAdjust === undefined ? {} : { lengthAdjust: KLIMT_LENGTH_ADJUST[theme.lengthAdjust] };
}
