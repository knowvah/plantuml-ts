/**
 * `== label ==` / `====` divider rendering — split out of renderer.ts
 * (cdd-T30, 500-line file-size cap).
 *
 * Every paint value is the divider's merged `separator` style, carried on the
 * geo by layout (`sequence-layout-divider.ts`) and read as
 * `ComponentRoseDivider`'s constructor reads it (`:70-74`): `background` =
 * `BackGroundColor`, `borderColor` = `LineColor`, `stroke` = `getStroke()`
 * (`LineThickness` + `LineStyle`), `roundCorner`, `shadow`. Every length is
 * scaled at emission, as `SvgGraphics#format` scales it (`:466-468`,
 * `:555-561`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDivider.java
 */

import type { DividerGeo } from './ast.js';
import { fmt } from '../../core/svg-format.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { rect, line } from '../../core/svg.js';
import type { ScaledTheme } from './scale-geo.js';
import { DIVIDER_BAND_HEIGHT, DIVIDER_LABEL_DELTA_X } from './divider-style.js';
import { creoleRunText } from './renderer.js';
import { sequenceShadowFilter } from './sequence-shadow.js';
import type { SequencePaint } from './sequence-skin-param.js';

/** `drawRectLong` strokes the band with `UStroke.simple()` (`:117`), whose
 *  thickness is 1, whatever the style's `LineThickness`. */
const BAND_STROKE_THICKNESS = 1;

/** `drawSep` draws the band one pixel above the divider's middle (`:109`)
 *  and `drawDoubleLine` its two rules at `dy(-1)` and `dy(2)` (`:124-125`). */
const UPPER_RULE_DY = -1;
const LOWER_RULE_DY = 2;

/** The paint layout resolved for this divider. */
function dividerPaintOf(divider: DividerGeo): SequencePaint {
  if (divider.paint === undefined) throw new Error(`divider "${divider.text}" carries no paint`);
  return divider.paint;
}

/** `URectangle.rounded(roundCorner)`, emitted as `rx = ry = roundCorner / 2`
 *  (`DriverRectangleSvg.java:78`). */
function roundedOf(paint: SequencePaint, k: number): { readonly rx: number; readonly ry: number } {
  const r = (paint.roundCorner / 2) * k;
  return { rx: r, ry: r };
}

/** `getStroke()`'s dash, formatted as one string (`SvgGraphics.java:555-561`). */
function dashOf(paint: SequencePaint, k: number): { readonly strokeDasharray?: string } {
  const dash = paint.dash;
  return dash === undefined ? {} : { strokeDasharray: `${fmt(dash[0]! * k)},${fmt(dash[1]! * k)}` };
}

/**
 * `drawSep` (`:107-111`): the band (`drawRectLong`, `:113-119`), filled and
 * stroked with the background colour, then the double rule (`drawDoubleLine`,
 * `:121-126`) in `LineColor` at half the style's thickness, undashed
 * (`UStroke.withThickness`).
 */
function renderDividerBand(divider: DividerGeo, paint: SequencePaint, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const midY = divider.y + divider.height / 2;
  const { bandX: x, bandWidth: w } = divider;
  const band = rect(x, midY + UPPER_RULE_DY * k, w, DIVIDER_BAND_HEIGHT * k, {
    fill: paint.fill,
    stroke: paint.fill,
    strokeWidth: BAND_STROKE_THICKNESS * k,
    ...roundedOf(paint, k),
    ...sequenceShadowFilter(paint.shadowing),
  });
  const ruleStyle = { stroke: paint.stroke, strokeWidth: (paint.thickness / 2) * k };
  const rule = (dy: number): string => line(x, midY + dy * k, x + w, midY + dy * k, ruleStyle);
  return band + rule(UPPER_RULE_DY) + rule(LOWER_RULE_DY);
}

/**
 * The label box and its text (`:86-103`). Absent for the empty `====` form,
 * which upstream branches away from at `:84-85` on
 * `stringsToDisplay.get(0).length() == 0`.
 *
 * `xpos = (width - textWidth - deltaX) / 2` and `ypos = (height - textHeight)
 * / 2`; the box is `textWidth + deltaX` wide and the text starts `deltaX`
 * inside it, with `getOldPaddingY()` of vertical inset. The box takes the
 * style's whole stroke, dash included (`ug.apply(stroke)`, `:98`).
 */
function renderDividerLabel(divider: DividerGeo, paint: SequencePaint, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const deltaX = DIVIDER_LABEL_DELTA_X * k;
  const xpos = divider.bandX + (divider.bandWidth - divider.textWidth - deltaX) / 2;
  const ypos = divider.y + (divider.height - divider.textHeight) / 2;
  const box = rect(xpos, ypos, divider.textWidth + deltaX, divider.textHeight, {
    fill: paint.fill,
    stroke: paint.stroke,
    strokeWidth: paint.thickness * k,
    ...dashOf(paint, k),
    ...roundedOf(paint, k),
    ...sequenceShadowFilter(paint.shadowing),
  });
  // One `<text>` per creole atom, as the jar's own multi-line text block emits
  // (C6). Layout built every run from the style's `FontConfiguration`, so
  // each carries its own size, weight and colour; the fallbacks are that same
  // font's, for a run that carries none.
  const font = paint.font;
  const label = divider.labelRuns
    .map((run) => creoleRunText(run, theme, font.size * k, font.styles.has(FontStyle.BOLD)))
    .join('');
  return box + label;
}

/**
 * `== label ==` and the empty `====`: `ComponentRoseDivider#drawInternalU`
 * (`:79-105`) — a band rect, two rules, and for a label a box and its text.
 */
export function renderDivider(divider: DividerGeo, theme: ScaledTheme): string {
  const paint = dividerPaintOf(divider);
  const band = renderDividerBand(divider, paint, theme);
  return divider.text.length === 0 ? band : band + renderDividerLabel(divider, paint, theme);
}
