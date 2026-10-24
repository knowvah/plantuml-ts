/**
 * sdd3-T8e: the markup a `draw<X>` produces on the page's real graphic -- the
 * seam every region now draws through (`renderer-ug.ts#openSequenceGraphic`),
 * for tests that assert a drawn VALUE rather than an apply chain. Not a
 * bridge: no `src/` module draws a region onto a throwaway graphic any more.
 */
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { openSequenceGraphic, pageThemeOf, type PageTheme } from '../../../src/diagrams/sequence/renderer-ug.js';

/** The page's `PageTheme` under the default theme. */
export function pageTheme(measurer = new DeterministicMeasurer()): PageTheme {
  return pageThemeOf(defaultTheme, measurer);
}

/** `draw` on a fresh page graphic, serialised: the page's defs (gradients)
 *  lead the markup, as `renderer.ts#drawPaginated` hands it on. */
export function drawMarkup(draw: (ug: UGraphic, theme: PageTheme) => void, theme: PageTheme = pageTheme()): string {
  const graphic = openSequenceGraphic(theme, { width: 0, height: 0 });
  draw(graphic.ug, theme);
  const { extraDefs, body } = graphic.finish();
  return extraDefs + body;
}
