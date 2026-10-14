/**
 * `FlashCodeUtilsNone` — the `FlashCodeUtils` that exports no image. It is
 * the only one in upstream's MIT edition, which the port mirrors (D13).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeUtilsNone.java
 */
import type { ResolvedColor } from '../klimt/color/HColorSet.js';
import type { FlashCodeUtils } from './FlashCodeUtils.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeUtilsNone.java:43-49 */
export class FlashCodeUtilsNone implements FlashCodeUtils {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeUtilsNone.java:45-47 */
  exportFlashcode(_s: string, _fore: ResolvedColor, _back: ResolvedColor): null {
    return null;
  }
}
