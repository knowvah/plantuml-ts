import { XLine2D } from '../../core/klimt/geom/XLine2D.js';
import type { SymetricalTee } from './SymetricalTee.js';

/**
 * A `SymetricalTee` placed at a y within a `Tetris`. `Tetris.add` builds two
 * candidate placements per new element (one aligning arm 1's top edge to the
 * frontier, one aligning arm 2's) and keeps whichever lands lower
 * (`getMax`); `Tetris.balance` then re-centres every placed element by a
 * shared delta so the whole packed stack straddles y = 0.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/SymetricalTeePositioned.java
 */
export class SymetricalTeePositioned {
  private readonly tee: SymetricalTee;
  private y: number;

  /** `SymetricalTeePositioned.java:50-57` collapses the public
   *  single-arg / private two-arg constructor pair upstream keeps only to
   *  give the public one a `y = 0` default. */
  constructor(tee: SymetricalTee, y = 0) {
    this.tee = tee;
    this.y = y;
  }

  /** `SymetricalTeePositioned.java:59-62`. */
  moveSoThatSegmentA1isOn(newY: number): void {
    const current = this.getSegmentA1().getY1();
    this.y += newY - current;
  }

  /** `SymetricalTeePositioned.java:64-67`. */
  moveSoThatSegmentA2isOn(newY: number): void {
    const current = this.getSegmentA2().getY1();
    this.y += newY - current;
  }

  /** `SymetricalTeePositioned.java:69-71`. */
  move(delta: number): void {
    this.y += delta;
  }

  /** `SymetricalTeePositioned.java:73-75` — arm 1's top edge. */
  getSegmentA1(): XLine2D {
    const yOff = this.y - this.tee.getThickness1() / 2;
    return new XLine2D(0, yOff, this.tee.getElongation1(), yOff);
  }

  /** `SymetricalTeePositioned.java:77-79` — arm 1's bottom edge. */
  getSegmentB1(): XLine2D {
    const yOff = this.y + this.tee.getThickness1() / 2;
    return new XLine2D(0, yOff, this.tee.getElongation1(), yOff);
  }

  /** `SymetricalTeePositioned.java:81-84` — arm 2's top edge. */
  getSegmentA2(): XLine2D {
    const e1 = this.tee.getElongation1();
    const yOff = this.y - this.tee.getThickness2() / 2;
    return new XLine2D(e1, yOff, e1 + this.tee.getElongation2(), yOff);
  }

  /** `SymetricalTeePositioned.java:86-89` — arm 2's bottom edge. */
  getSegmentB2(): XLine2D {
    const e1 = this.tee.getElongation1();
    const yOff = this.y + this.tee.getThickness2() / 2;
    return new XLine2D(e1, yOff, e1 + this.tee.getElongation2(), yOff);
  }

  /** `SymetricalTeePositioned.java:91-93`. */
  getMaxX(): number {
    return this.tee.getElongation1() + this.tee.getElongation2();
  }

  /** `SymetricalTeePositioned.java:95-97`. */
  getMaxY(): number {
    return this.y + this.tee.getFullThickness() / 2;
  }

  /** `SymetricalTeePositioned.java:99-101`. */
  getMinY(): number {
    return this.y - this.tee.getFullThickness() / 2;
  }

  /** `SymetricalTeePositioned.java:103-105`. */
  getY(): number {
    return this.y;
  }

  /** `SymetricalTeePositioned.java:107-115` — reference identity, not
   *  value equality: upstream's `this.tee != other.tee` guards against
   *  comparing two placements of *different* tees, which would be a
   *  programmer error at the one call site (`Tetris.add`'s `p1.getMax(p2)`,
   *  where `p1`/`p2` both wrap the very same `tee` argument). */
  getMax(other: SymetricalTeePositioned): SymetricalTeePositioned {
    if (this.tee !== other.tee) {
      throw new Error('SymetricalTeePositioned#getMax: cannot compare placements of different tees');
    }
    return other.y > this.y ? other : this;
  }
}
