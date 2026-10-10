/**
 * run-draw-metrics.ts — what `DriverTextSvg#draw` does to a run's text
 * BEFORE it measures and emits it, resolved in layout (D1: the renderers hold
 * no measurer).
 *
 * ```java
 * if (text.startsWith(" ")) {
 *     final double space = stringBounder.calculateDimension(font, " ").getWidth();
 *     while (text.startsWith(" ")) { x += space; text = text.substring(1); }
 * }
 * text = StringUtils.trin(text);
 * final XDimension2D dim = stringBounder.calculateDimension(font, text);
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java:113-126
 *
 * So `textLength` is the TRIMMED text's width and each leading space moves
 * `x` right by one space; the LAYOUT advance stays the untrimmed width
 * (`AtomText.java:222-231`), which is why a run keeps `textWidth` and gains
 * these two fields rather than having one repurposed.
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { driverTextPlacement } from '../../core/svg-text-font.js';

/** The two fields a run carries when `DriverTextSvg` would trim it. */
export interface RunDrawMetrics {
  /** `calculateDimension(font, trin(text))` -- reaches `textLength`. */
  readonly drawWidth?: number;
  /** One `calculateDimension(font, " ")` per leading space -- added to `x`. */
  readonly drawDx?: number;
}

/** The draw metrics for `text` at `spec`; empty when the draw would not
 *  change the text (no leading/trailing space, not whitespace-only), so such
 *  a run is byte-identical to the one this port always built. */
export function runDrawMetrics(text: string, spec: FontSpec, measurer: StringMeasurer): RunDrawMetrics {
  const placement = driverTextPlacement(text, measurer.measure(' ', spec).width);
  if (placement.text === text && placement.dx === 0) return {};
  return { drawWidth: measurer.measure(placement.text, spec).width, drawDx: placement.dx };
}

/** A run's drawn `x`: layout `x` plus the leading-space shift. */
export function drawnLeftX(run: { readonly x: number } & RunDrawMetrics): number {
  return run.x + (run.drawDx ?? 0);
}

/** A run's `textLength`: the trimmed width when it has one. */
export function drawnWidth(run: { readonly textWidth: number } & RunDrawMetrics): number {
  return run.drawWidth ?? run.textWidth;
}
