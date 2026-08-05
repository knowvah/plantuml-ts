import type { Entity } from '../abel/Entity.js';
import type { Magma } from './Magma.js';
import { SquareMaker } from './SquareMaker.js';
import type { SquareLinker } from './SquareLinker.js';

/**
 * MagmaList — the magmas of a diagram, square-chained among themselves
 * when three or more share the same parent container. Built and
 * consumed by `CucaDiagram#applySingleStrategy`.
 *
 * SI1/T10 closure pull — full port (4/4 members).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MagmaList.java:43
 */
export class MagmaList {
  /** @see cucadiagram/MagmaList.java:45 */
  private readonly all: Magma[] = [];

  /** @see cucadiagram/MagmaList.java:47-49 */
  add(magma: Magma): void {
    this.all.push(magma);
  }

  /** @see cucadiagram/MagmaList.java:51-59 */
  getMagmas(group: Entity): MagmaList {
    const result = new MagmaList();
    for (const m of this.all) {
      if (m.getContainer() === group) {
        result.add(m);
      }
    }
    return result;
  }

  /** @see cucadiagram/MagmaList.java:61-63 */
  size(): number {
    return this.all.length;
  }

  /** @see cucadiagram/MagmaList.java:65-77 */
  putInSquare(): void {
    const linker: SquareLinker<Magma> = {
      topDown(top: Magma, down: Magma): void {
        top.linkToDown(down);
      },
      leftRight(left: Magma, right: Magma): void {
        left.linkToRight(right);
      },
    };
    new SquareMaker<Magma>().putInSquare(this.all, linker);
  }
}
