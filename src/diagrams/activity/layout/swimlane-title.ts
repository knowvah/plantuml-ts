/**
 * A swimlane title as upstream builds it: `Swimlanes#getTitle`
 * (`Swimlanes.java:285-293`) -- `swimlane.getDisplay().create9(fc, LEFT,
 * skinParam, wrap)`, the display's FULL creole Sheet at the swimlane
 * style's font. The SAME block is measured (`getHalfMissingSpace`,
 * `:436-449`) and drawn (`drawTitles`, `:370-377`), so the layout and the
 * renderer both build it here.
 *
 * The display starts as the lane's name and `|name|LABEL` replaces it
 * (`Swimlane.java:60,74-80`). The trailing special lane `swimlanesSpecial()`
 * appends is named `""` (`Swimlanes.java:116-123`): `Display.getWithNewlines`
 * keeps that as one empty line (`Display.java:344`), whose stripe yields a
 * single `" "` atom (`StripeSimple.java:124-127`) -- so its title measures
 * one space at the title font, not zero.
 *
 * The wrap is `getWrap` (`Swimlanes.java:296-302`): it falls back to
 * `style.wrapWidth()` only when `swimlaneWrapTitleWidth()` `==
 * LineBreakStrategy.NONE`, a reference test a fresh `new
 * LineBreakStrategy(value)` (`SkinParam.java:980-984`) never passes -- so
 * only `skinparam swimlaneWrapTitleWidth` wraps a title (jar fixture
 * `tests/fixtures/isw-T2-act/wrap-swimlane`). `"auto"` becomes `new
 * LineBreakStrategy("" + ((int) swimlane.getActualWidth()))` (`:290-291`),
 * the width `computeSizeInternal` set before any title is measured
 * (`Swimlanes.java:407-411`).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:285-293
 */
import type { Theme } from '../../../core/theme.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import type { FontConfiguration } from '../../../core/klimt/shape/UText.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import { CreoleMode } from '../../../core/klimt/creole/CreoleMode.js';
import { activityDisplayBlock, styleFontConfiguration } from '../activity-text-sheet.js';
import { activityHyperlinkColor } from '../activity-text-style.js';
import { swimlaneTitleFontColor, swimlaneTitleFontSize } from '../activity-style-defaults.js';
import { klimtStringBounder } from '../activity-creole-sheet.js';
import { activityMeasurer } from '../activity-string-bounder.js';
import { LineBreakStrategy } from '../../../core/klimt/LineBreakStrategy.js';

/** The display `new Swimlane("", ...)` gives the appended special lane
 *  (`Swimlanes.java:119`). */
export const SPECIAL_SWIMLANE_DISPLAY = '';

/** `getWrap()` then the `isAuto()` substitution (`Swimlanes.java:289-291,
 *  296-302`); `actualWidth` is `swimlane.getActualWidth()`. */
function titleWrap(theme: Theme, actualWidth: number): LineBreakStrategy {
  const wrap = new LineBreakStrategy(theme.swimlaneWrapTitleWidth ?? null);
  if (wrap.isAuto()) return new LineBreakStrategy(String(Math.trunc(actualWidth)));
  return wrap;
}

/** `getTitle(swimlane)` for a lane whose display creole is `display` and
 *  whose `getActualWidth()` is `actualWidth`. */
export function swimlaneTitleBlock(
  display: string,
  theme: Theme,
  actualWidth: number,
): { tb: TextBlock; fc: FontConfiguration } {
  const font = { family: theme.fontFamily, size: swimlaneTitleFontSize(theme), color: swimlaneTitleFontColor(theme) };
  const fc = styleFontConfiguration(theme, font, activityHyperlinkColor(theme));
  const tb = activityDisplayBlock(display, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode: CreoleMode.FULL,
    maxMessageSize: titleWrap(theme, actualWidth),
  });
  return { tb, fc };
}

/** `getTitle(swimlane).calculateDimension(stringBounder)`
 *  (`Swimlanes.java:312,442`), through the render's own bounder. */
export function swimlaneTitleDimension(
  display: string,
  theme: Theme,
  actualWidth: number,
): { width: number; height: number } {
  const { tb, fc } = swimlaneTitleBlock(display, theme, actualWidth);
  const dim = tb.calculateDimension(klimtStringBounder(activityMeasurer(theme), fc));
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/** `getTitle(swimlane).calculateDimension(stringBounder).getWidth()`
 *  (`Swimlanes.java:442`). */
export function swimlaneTitleWidth(display: string, theme: Theme, actualWidth: number): number {
  return swimlaneTitleDimension(display, theme, actualWidth).width;
}
