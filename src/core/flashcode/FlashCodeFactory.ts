/**
 * `FlashCodeFactory` — the `FlashCodeUtils` this build has.
 *
 * Upstream loads `FlashCodeUtilsZxing` by name and falls back to
 * `FlashCodeUtilsNone` on `ClassNotFoundException` (java:43-53); TeaVM always
 * gets `FlashCodeUtilsNone` (java:55-56). `FlashCodeUtilsZxing.java:55` is
 * `// ::remove file when __MIT__ ...`, so in the MIT edition the port mirrors
 * (D13) the class is absent and both branches answer `FlashCodeUtilsNone`.
 * There is no QR encoder in the port.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeFactory.java
 */
import type { FlashCodeUtils } from './FlashCodeUtils.js';
import { FlashCodeUtilsNone } from './FlashCodeUtilsNone.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/flashcode/FlashCodeFactory.java:42-58 */
export function getFlashCodeUtils(): FlashCodeUtils {
  return new FlashCodeUtilsNone();
}
