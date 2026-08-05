import type { SquareLinker } from './SquareLinker.js';

/**
 * SquareMaker — chains a flat list into a square grid by driving a
 * `SquareLinker`: left-right neighbors within a row, row head to next
 * row head top-down.
 *
 * SI1/T10 closure pull — full port (3/3 members; the commented-out
 * alternative `getBottomLeft` upstream keeps is preserved below).
 * Package-private upstream; exported here (TS has no package
 * visibility — the `plasma/Quark.ts` precedent). NOTE: an
 * engine-facing adaptation of this algorithm already exists in
 * `src/core/magma.ts` (dot-id based, jar-verified) — that seam stays;
 * this is the faithful abel-model version `CucaDiagram
 * #applySingleStrategy` consumes (ADR-3-style dual residency,
 * journaled).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/SquareMaker.java:40
 */
export class SquareMaker<O> {
  /** @see cucadiagram/SquareMaker.java:42-59 */
  putInSquare(data: readonly O[], linker: SquareLinker<O>): void {
    const branch = SquareMaker.computeBranch(data.length);
    let headBranch = 0;
    for (let i = 1; i < data.length; i++) {
      const dist = i - headBranch;
      const ent2 = data[i] as O;
      if (dist === branch) {
        const ent1 = data[headBranch] as O;
        linker.topDown(ent1, ent2);
        headBranch = i;
      } else {
        const ent1 = data[i - 1] as O;
        linker.leftRight(ent1, ent2);
      }
    }
  }

  /** @see cucadiagram/SquareMaker.java:61-68 */
  static computeBranch(size: number): number {
    const sqrt = Math.sqrt(size);
    const r = Math.trunc(sqrt);
    if (r * r === size) {
      return r;
    }
    return r + 1;
  }

  /** @see cucadiagram/SquareMaker.java:70-74 */
  static getBottomLeft(size: number): number {
    const s = SquareMaker.computeBranch(size);
    const line = Math.trunc((size - 1) / s);
    return line * s;
  }

  // static int getBottomLeft(final int size) {
  // final int s = computeBranch(size);
  // int result = s * (s - 1);
  // while (result >= size) {
  // result -= s;
  // }
  // return result;
  // }
}
