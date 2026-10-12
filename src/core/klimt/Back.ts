import type { UBackground } from './UBackground.js';
import type { HColorOrPaint } from './color/ColorMapper.js';

/**
 * Back — the sole `UBackground` implementor, wrapping a paint value.
 * Upstream builds one via `HColor#bg()` (`color.bg()`); this port's
 * equivalent entry point is `new Back(paint)` directly, with a `Paint` or
 * the `HColor` itself (`new Back(color)` is `color.bg()`, HColor.java:61-63;
 * see `UBackground.ts` seam note).
 *
 * Upstream: klimt/color/HColor.java, package-private nested class
 * `Back implements UBackground` (upstream's real, documented name for
 * this role — not invented for this port).
 */
export class Back implements UBackground {
  private readonly paint: HColorOrPaint;

  constructor(paint: HColorOrPaint) {
    this.paint = paint;
  }

  getBackColor(): HColorOrPaint {
    return this.paint;
  }
}
