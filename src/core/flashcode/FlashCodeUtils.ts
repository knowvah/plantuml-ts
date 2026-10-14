/**
 * `FlashCodeUtils` — renders a text as a 2-D barcode (QR code) image.
 *
 * `PortableImage` is the port's `RgbaBitmap` (`klimt/sprite/sprite-raster.ts`)
 * and `XColor` its `ResolvedColor` (`klimt/color/HColorSet.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeUtils.java
 */
import type { ResolvedColor } from '../klimt/color/HColorSet.js';
import type { RgbaBitmap } from '../klimt/sprite/sprite-raster.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeUtils.java:43-48 */
export interface FlashCodeUtils {
  exportFlashcode(s: string, fore: ResolvedColor, back: ResolvedColor): RgbaBitmap | null;
}
