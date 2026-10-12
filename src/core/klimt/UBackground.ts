import type { UChange } from './UChange.js';
import type { HColorOrPaint } from './color/ColorMapper.js';

/**
 * UBackground — a `UChange` that carries a new fill/background paint.
 * `AbstractCommonUGraphic#apply` reads `getBackColor()` to replace the
 * graphic's current background paint.
 *
 * Upstream: klimt/UBackground.java — `public interface UBackground
 * extends UChange { HColor getBackColor(); }`.
 *
 * Adaptation seam (pre-decided, see T2 mission brief): upstream's
 * `getBackColor()` returns `HColor`. This port carries `Paint`
 * (`src/core/paint.ts`) or the ported `HColorSimple`/`HColorGradient`
 * (`HColorOrPaint`, `color/ColorMapper.ts`), mapped at draw time.
 */
export interface UBackground extends UChange {
  getBackColor(): HColorOrPaint;
}
