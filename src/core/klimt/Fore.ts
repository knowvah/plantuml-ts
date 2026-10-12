import type { UForeground } from './UForeground.js';
import type { HColorOrPaint } from './color/ColorMapper.js';

/**
 * Fore — the sole `UForeground` implementor, wrapping a paint value.
 * Paired with `Back` (see `Back.ts` / `UForeground.ts` for why this
 * wrapper exists at all — it has no upstream name to inherit).
 *
 * The value is a `Paint` or the upstream `HColor` itself (upstream applies
 * the `HColor` as the change, `ug.apply(color)`); `AbstractCommonUGraphic
 * #apply` stores it unconverted (AbstractCommonUGraphic.java:123-124) and the
 * driver maps it with the graphic's `ColorMapper`.
 */
export class Fore implements UForeground {
  private readonly paint: HColorOrPaint;

  constructor(paint: HColorOrPaint) {
    this.paint = paint;
  }

  getColor(): HColorOrPaint {
    return this.paint;
  }
}
