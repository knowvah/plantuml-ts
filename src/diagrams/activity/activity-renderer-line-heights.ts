/**
 * activity-renderer-line-heights — the RENDER-time mirror of `tiles/
 * gtile-action.ts#creoleLineHeight`: heterogeneous per-physical-line
 * heights for an `'activity'`-sname (`FtileBox`) text block.
 *
 * add3-T2b pass 2 (KLIMT-ACT/KLIMT-FLOOR): a `=heading` line
 * (`CreoleStripeSimpleParser.java:149-153`, `fontConfigurationForHeading`)
 * or a sub-floor custom `activityFontSize` (`AtomText.java:179-181`) both
 * grow/shrink a line's real height away from the uniform
 * `floorActionLineHeight` advance `renderMultilineText`'s OTHER sname
 * paths (diamond/hexagon, unassigned ALIGN-DIAMOND) still use unchanged.
 * The renderer has no `StringBounder` of its own (`activity-text-
 * placement.ts`'s own "MEASUREMENT SEAM" doc comment) -- a fresh
 * `WidthTableMeasurer` instance is the established pattern there, reused
 * here rather than threading `gtile-action.ts`'s bounder-shaped version
 * through a render-time call.
 *
 * `centeredBaselines` generalizes `activity-renderer-shapes.ts
 * #centeredFirstBaselineY` from one uniform `lineHeight` to an array:
 * identical output when every height is equal (the uniform case's own
 * closed form, algebraically).
 */
import type { Theme } from '../../core/theme.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { creoleTextLines } from '../../core/svek/image/creole-text-lines.js';
import { isTableRowLine } from './activity-text-placement.js';
import { floorActionLineHeight } from './tiles/gtile-action.js';
import { ASCENT_FRACTION } from './activity-renderer-shapes.js';

const MEASURER = new WidthTableMeasurer();

/** See module doc comment; `fontSize` is the box's own RAW, unfloored
 *  font size (what a heading's size-delta cascades from); `fallback` is
 *  the caller's own uniform floored height (table rows keep that fixed
 *  height, matching `StripeTable`'s own row model, not a creole-cascaded
 *  one). */
export function actionLineHeight(line: string, theme: Theme, fontSize: number, fallback: number): number {
  if (isTableRowLine(line)) return fallback;
  const font = { family: theme.fontFamily, size: fontSize };
  const built = creoleTextLines(line, font, MEASURER);
  return built[0]?.height ?? fallback;
}

export function actionLineHeights(lines: readonly string[], theme: Theme, fontSize: number): number[] {
  const fallback = floorActionLineHeight(fontSize);
  return lines.map((l) => actionLineHeight(l, theme, fontSize, fallback));
}

/** See module doc comment. */
export function centeredBaselines(cy: number, heights: readonly number[]): number[] {
  const total = heights.reduce((sum, h) => sum + h, 0);
  let top = cy - total / 2;
  return heights.map((h) => {
    const y = top + h * ASCENT_FRACTION;
    top += h;
    return y;
  });
}
