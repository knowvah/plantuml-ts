/**
 * class-driver-text-placement.ts -- `DriverTextSvg.java:113-126` for the class
 * emitters that draw a plain `<text>` run (row text, edge-label runs,
 * namespace titles): each leading space moves `x` by one space width, the
 * emitted text is the NBSP/`trin`'d form, and `textLength` is measured from
 * THAT form -- while the run's layout advance stays the raw width
 * (`AtomText.java:222-231`). The string steps are the shared
 * `driverTextPlacement`; this adds the measuring.
 *
 * @see ~/git/plantuml/.../klimt/drawing/svg/DriverTextSvg.java:113-126
 */
import { driverTextPlacement } from '../../core/svg-text-font.js';

/** What a plain run draws: shifted `x`, emitted text, its own `textLength`. */
export interface PlacedRun {
  readonly x: number;
  readonly text: string;
  readonly textLength: number;
}

/** `ClassifierRowGeo['renderDx'|'renderWidth']` for a plain-text row; empty
 *  when the text draws as written. */
export function plainRowRender(
  raw: string,
  measure: (s: string) => number,
): { renderDx?: number; renderWidth?: number } {
  const placed = placeDriverRun(0, raw, measure);
  if (placed.text === raw) return {};
  return { renderWidth: placed.textLength, ...(placed.x !== 0 ? { renderDx: placed.x } : {}) };
}

/**
 * @param x the run's layout x
 * @param measure width of a string in the run's own font (`calculateDimension`)
 */
export function placeDriverRun(x: number, raw: string, measure: (s: string) => number): PlacedRun {
  const placed = driverTextPlacement(raw, raw.startsWith(' ') ? measure(' ') : 0);
  return { x: x + placed.dx, text: placed.text, textLength: measure(placed.text) };
}
