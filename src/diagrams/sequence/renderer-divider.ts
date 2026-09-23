/**
 * `== label ==` / `====` divider rendering — split out of renderer.ts
 * (cdd-T30, 500-line file-size cap) to make room for the widened
 * `resolveScaleFactor` dpi-term call site. A pure move: every function
 * below, doc comments included, is unchanged from the pre-split renderer.ts.
 */

import type { DividerGeo } from './ast.js';
import { rect, line } from '../../core/svg.js';
import type { ScaledTheme } from './scale-geo.js';
import {
  DIVIDER_BACKGROUND,
  DIVIDER_BAND_HEIGHT,
  DIVIDER_FONT_BOLD,
  DIVIDER_FONT_SIZE,
  DIVIDER_LABEL_DELTA_X,
  DIVIDER_LINE_COLOR,
  DIVIDER_LINE_THICKNESS,
} from './divider-style.js';
import { creoleRunText } from './renderer.js';

function renderDividerBand(divider: DividerGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const midY = divider.y + divider.height / 2;
  const { bandX: x, bandWidth: w } = divider;
  const band = rect(x, midY - 1 * k, w, DIVIDER_BAND_HEIGHT * k, {
    fill: DIVIDER_BACKGROUND,
    stroke: DIVIDER_BACKGROUND,
    strokeWidth: 1 * k,
  });
  const ruleStyle = {
    stroke: DIVIDER_LINE_COLOR,
    strokeWidth: (DIVIDER_LINE_THICKNESS / 2) * k,
  };
  return (
    band + line(x, midY - 1 * k, x + w, midY - 1 * k, ruleStyle) + line(x, midY + 2 * k, x + w, midY + 2 * k, ruleStyle)
  );
}

/**
 * The label box and its text (`:73-87`). Absent for the empty `====` form,
 * which upstream branches away from at `:69-70` on
 * `stringsToDisplay.get(0).length() == 0`.
 *
 * `xpos = (width - textWidth - deltaX) / 2` and `ypos = (height - textHeight)
 * / 2`; the box is `textWidth + deltaX` wide and the text starts `deltaX`
 * inside it, with `getOldPaddingY()` of vertical inset.
 */
function renderDividerLabel(divider: DividerGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const deltaX = DIVIDER_LABEL_DELTA_X * k;
  const xpos = divider.bandX + (divider.bandWidth - divider.textWidth - deltaX) / 2;
  const ypos = divider.y + (divider.height - divider.textHeight) / 2;
  const box = rect(xpos, ypos, divider.textWidth + deltaX, divider.textHeight, {
    fill: DIVIDER_BACKGROUND,
    stroke: DIVIDER_LINE_COLOR,
    strokeWidth: DIVIDER_LINE_THICKNESS * k,
  });
  // One `<text>` per creole atom, as the jar's own multi-line text block emits
  // (C6). A5: each run carries a real BASELINE, resolved in layout against the
  // label box's own top-left; the `dominantBaseline: 'hanging'` that stood in
  // for one is gone, and with it the last such adaptation in this file. The
  // separator style's `FontStyle bold` (`plantuml.skin:174-175`) reaches every
  // run through the `FontSpec` the seam's `FontConfiguration` was built from,
  // so `DIVIDER_FONT_BOLD` here only covers a run that carries no weight.
  const label = divider.labelRuns
    .map((run) => creoleRunText(run, theme, DIVIDER_FONT_SIZE * k, DIVIDER_FONT_BOLD))
    .join('');
  return box + label;
}

/**
 * `== label ==` and the empty `====`.
 *
 * This used to emit ONE `<line>` and one `<text>` where
 * `ComponentRoseDivider#drawInternalU` emits five elements -- a band rect, two
 * rules, a label box and the text -- and to stroke the rule with
 * `theme.colors.divider` (`#999999`, this port's own invention) where upstream
 * is `LineColor black` (`plantuml.skin:170`). `theme.colors.divider` had no
 * other reader.
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseDivider.java:64-95
 */
export function renderDivider(divider: DividerGeo, theme: ScaledTheme): string {
  const band = renderDividerBand(divider, theme);
  return divider.text.length === 0 ? band : band + renderDividerLabel(divider, theme);
}
