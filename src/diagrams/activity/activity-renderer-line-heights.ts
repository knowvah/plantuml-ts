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
 * add3-T2b pass 3 (STRIPE): a bare `----`/`====`/`....` separator line
 * (`CreoleStripeSimpleParser.ts#classifyStripeLine`'s `HORIZONTAL_LINE`)
 * is `ACTIVITY_HR_HEIGHT` (`= 10`, `gtile-action.ts`'s own doc comment --
 * `CreoleHorizontalLine.java:118-129`'s flat `XDimension2D(10, 10)`, NOT
 * `creole-text-lines.ts#CREOLE_HR_HEIGHT`'s `8`, a DIFFERENT upstream
 * class's verified value). `isHr` is exposed on {@link ActionLine} so
 * {@link centeredBaselines} can place it at its own MIDPOINT (`top +
 * height / 2`, `CreoleHorizontalLine.ts#drawU`'s `UTranslate.dy(dim
 * .getHeight() / 2)`) rather than a text line's ASCENT-fraction baseline
 * -- `activity-renderer-text.ts#drawCreoleLine` draws the actual rule(s)
 * at the `y` this function returns for an HR line.
 *
 * `centeredBaselines` generalizes `activity-renderer-shapes.ts
 * #centeredFirstBaselineY` from one uniform `lineHeight` to an array:
 * identical output when every height is equal and no line is HR (the
 * uniform case's own closed form, algebraically).
 */
import type { Theme } from '../../core/theme.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { creoleTextLines } from '../../core/svek/image/creole-text-lines.js';
import { isTableRowLine } from './activity-text-placement.js';
import { floorActionLineHeight, ACTIVITY_HR_HEIGHT } from './tiles/gtile-action.js';
import { ASCENT_FRACTION } from './activity-renderer-shapes.js';

const MEASURER = new WidthTableMeasurer();

/** One physical line's real height plus whether it is a `HORIZONTAL_LINE`
 *  rule -- see module doc comment for both. */
export interface ActionLine {
  readonly height: number;
  readonly isHr: boolean;
}

/** `fontSize` is the box's own RAW, unfloored font size (what a heading's
 *  size-delta cascades from); `fallback` is the caller's own uniform
 *  floored height (table rows keep that fixed height, matching
 *  `StripeTable`'s own row model, not a creole-cascaded one). */
function actionLine(line: string, theme: Theme, fontSize: number, fallback: number): ActionLine {
  if (isTableRowLine(line)) return { height: fallback, isHr: false };
  const font = { family: theme.fontFamily, size: fontSize };
  const built = creoleTextLines(line, font, MEASURER)[0];
  if (built === undefined) return { height: fallback, isHr: false };
  return built.kind === 'hr' ? { height: ACTIVITY_HR_HEIGHT, isHr: true } : { height: built.height, isHr: false };
}

export function actionLines(lines: readonly string[], theme: Theme, fontSize: number): ActionLine[] {
  const fallback = floorActionLineHeight(fontSize);
  return lines.map((l) => actionLine(l, theme, fontSize, fallback));
}

/** `FtileBoxOld.ts#MyStencil` clip (`getStartingX=0`..`getEndingX=width`,
 *  mirroring `AbstractFtile.java`'s own `SheetBlock2` wrap): a
 *  `HORIZONTAL_LINE` rule is "infinite" edge to edge within the WHOLE
 *  box, NOT the padded text content area -- jar-verified,
 *  `bigide-91-bise382`'s `====` rule spans `x1` = the box's own left
 *  edge to `x2` = `box.x + box.width`, never the padding-indented text
 *  `x`. `{}` (not `undefined`) when `width` is unset, so the caller can
 *  spread it unconditionally. */
export function actionRuleFields(
  cx: number,
  width: number | undefined,
  nodeBorder: string,
): { ruleLeft: number; ruleWidth: number; ruleStroke: string } | Record<string, never> {
  if (width === undefined) return {};
  return { ruleLeft: cx - width / 2, ruleWidth: width, ruleStroke: nodeBorder };
}

/** See module doc comment. */
export function centeredBaselines(cy: number, lines: readonly ActionLine[]): number[] {
  const total = lines.reduce((sum, l) => sum + l.height, 0);
  let top = cy - total / 2;
  return lines.map((l) => {
    const y = top + l.height * (l.isHr ? 0.5 : ASCENT_FRACTION);
    top += l.height;
    return y;
  });
}
