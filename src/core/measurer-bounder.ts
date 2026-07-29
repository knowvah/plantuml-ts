/**
 * measurer-bounder.ts — `StringMeasurer` -> `StringBounder` adapter
 * (description-leaf-sizing-audit T6 / ADR-6).
 *
 * `EntityImageDescription#calculateDimensionSlow` (svek/image path) and
 * every `TextBlock`/`USymbol` it composes expect a `StringBounder`
 * (`calculateDimension(font, text): XDimension2D`, klimt/font/
 * StringBounder.ts). Every layout engine's sizing pass is instead handed a
 * `StringMeasurer` (`measure(text, font): {width, height}`, this port's own
 * sizing-engine DI seam, `measurer.ts`). The two interfaces measure the SAME
 * thing under a swapped argument/return shape — an argument swap, not a new
 * measurement mechanism (T6 mission brief) — so this adapter is a thin shim:
 * it owns no state and adds no behavior beyond the shape translation.
 *
 * `font` here only ever carries `family`/`size` (see `StringBounder`'s own
 * doc comment on its narrowed `UFont` scope); `StringMeasurer`'s `FontSpec`
 * is a structural superset (`weight`/`style` optional), so passing the same
 * object through unmodified is safe.
 */
import type { StringMeasurer } from './measurer.js';
import type { StringBounder } from './klimt/font/StringBounder.js';
import { XDimension2D } from './klimt/geom/XDimension2D.js';

export class MeasurerStringBounder implements StringBounder {
  constructor(private readonly measurer: StringMeasurer) {}

  calculateDimension(font: { readonly family: string; readonly size: number }, text: string): XDimension2D {
    const { width, height } = this.measurer.measure(text, font);
    return new XDimension2D(width, height);
  }

  getDescent(font: { readonly family: string; readonly size: number }, text: string): number {
    return this.measurer.getDescent(font, text);
  }
}
