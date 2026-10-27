/**
 * `Real` — a one-dimensional coordinate that lazily resolves to a `double`.
 *
 * `Real.java:38-56`. The commented-out `getMaxAbsolute`/`getMinAbsolute`
 * (`Real.java:52-55`) stay out: they are not on the interface upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/Real.java
 */
export interface Real {
  /** `Real.java:40`. */
  printCreationStackTrace(): void;
  /** `Real.java:42`. */
  getName(): string;
  /** `Real.java:44`. */
  getCurrentValue(): number;
  /** `Real.java:46`. */
  addFixed(delta: number): Real;
  /** `Real.java:48`. */
  addAtLeast(delta: number): Real;
  /** `Real.java:50`. */
  ensureBiggerThan(other: Real): void;
}
