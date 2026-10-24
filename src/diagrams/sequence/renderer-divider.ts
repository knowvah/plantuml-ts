/**
 * `== label ==` / `====` divider rendering, drawn through the page's
 * `UGraphic` (cdd-T30 split it out of renderer.ts for the 500-line cap; sdd3
 * T8e moved it onto the seam).
 *
 * Every paint value is the divider's merged `separator` style, carried on the
 * geo by layout (`sequence-layout-divider.ts`) and read as
 * `ComponentRoseDivider`'s constructor reads it (`:70-74`): `background` =
 * `BackGroundColor`, `borderColor` = `LineColor`, `stroke` = `getStroke()`
 * (`LineThickness` + `LineStyle`), `roundCorner`, `shadow`. Every length is
 * the page's own: the export scale is the exporter's `SvgGraphics#format`
 * pass (`:466-468`, `:555-561`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDivider.java
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { noGradient } from '../../core/paint.js';
import type { DividerGeo } from './ast.js';
import type { PageTheme } from './renderer-ug.js';
import { DIVIDER_BAND_HEIGHT, DIVIDER_LABEL_DELTA_X } from './divider-style.js';
import { strokeOf } from './renderer-line-component.js';
import { drawCreoleRuns } from './sequence-text.js';
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

/**
 * `drawSep` (`:107-111`): the band (`drawRectLong`, `:113-119`), filled and
 * stroked with the background colour, then the double rule (`drawDoubleLine`,
 * `:121-126`) in `LineColor` at half the style's thickness, undashed
 * (`UStroke.withThickness`). A rule is a `ULine`, which `DriverLineSvg`
 * strokes with a gradient's FIRST colour (`DriverLineSvg.java:76-80`); the
 * rects keep the gradient. `ug` is at the divider's top-left, already under
 * `background.bg()` (`:82`).
 */
function drawDividerBand(ug: UGraphic, divider: DividerGeo, paint: SequencePaint): void {
  const sep = ug.apply(UTranslate.dy(divider.height / 2)).apply(new Fore(paint.fill));
  const band = URectangle.build(divider.bandWidth, DIVIDER_BAND_HEIGHT).rounded(paint.roundCorner);
  band.setDeltaShadow(paint.shadowing);
  sep.apply(UTranslate.dy(UPPER_RULE_DY)).apply(UStroke.withThickness(BAND_STROKE_THICKNESS)).draw(band);
  const rules = sep.apply(UStroke.withThickness(paint.thickness / 2)).apply(new Fore(noGradient(paint.stroke)));
  const rule = ULine.hline(divider.bandWidth);
  rules.apply(UTranslate.dy(UPPER_RULE_DY)).draw(rule);
  rules.apply(UTranslate.dy(LOWER_RULE_DY)).draw(rule);
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
function drawDividerLabel(
  page: UGraphic,
  component: UGraphic,
  divider: DividerGeo,
  paint: SequencePaint,
  theme: PageTheme,
): void {
  const deltaX = DIVIDER_LABEL_DELTA_X;
  const xpos = (divider.bandWidth - divider.textWidth - deltaX) / 2;
  const ypos = (divider.height - divider.textHeight) / 2;
  const box = URectangle.build(divider.textWidth + deltaX, divider.textHeight).rounded(paint.roundCorner);
  box.setDeltaShadow(paint.shadowing);
  component.apply(new Fore(paint.stroke)).apply(strokeOf(paint)).apply(new UTranslate(xpos, ypos)).draw(box);
  // One `UText` per creole atom, as the jar's own multi-line text block emits
  // (C6). Layout built every run from the style's `FontConfiguration`, so
  // each carries its own size, weight and colour; the fallbacks are that same
  // font's, for a run that carries none. Runs sit at page coordinates.
  drawCreoleRuns(page, divider.labelRuns, theme, paint.font.size, paint.font.styles.has(FontStyle.BOLD));
}

/**
 * `== label ==` and the empty `====`: `ComponentRoseDivider#drawInternalU`
 * (`:79-105`) -- a band rect, two rules, and for a label a box and its text.
 * `ug` is the page graphic; the tile's translate to the divider's top-left is
 * applied here, and `ug.apply(background.bg())` (`:82`) precedes everything.
 */
export function drawDivider(ug: UGraphic, divider: DividerGeo, theme: PageTheme): void {
  const paint = dividerPaintOf(divider);
  const component = ug.apply(new UTranslate(divider.bandX, divider.y)).apply(new Back(paint.fill));
  drawDividerBand(component, divider, paint);
  if (divider.text.length > 0) drawDividerLabel(ug, component, divider, paint, theme);
}
