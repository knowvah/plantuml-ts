import type { Real } from './Real.js';

/**
 * `RealOrigin` — a {@link Real} that can solve its own line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealOrigin.java:38-41
 */
export interface RealOrigin extends Real {
  /** `RealOrigin.java:40`. */
  compileNow(): void;
}
