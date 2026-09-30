/**
 * The packing shape `Tetris.add` places: a "tee" of two rectangular arms —
 * (`thickness1`, `elongation1`) then (`thickness2`, `elongation2`) — laid
 * end to end along x, each arm's own thickness centred on the tee's y.
 * `FingerImpl#asSymetricalTee` builds one per mindmap node: arm 1 is the
 * node's own label box, arm 2 is that node's children's packed `Tetris`
 * (thickness2 = children tetris height, elongation2 = children tetris
 * width + `getX12()`), or a zero-size arm 2 for a leaf.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/SymetricalTee.java
 */
export class SymetricalTee {
  private readonly thickness1: number;
  private readonly elongation1: number;
  private readonly thickness2: number;
  private readonly elongation2: number;

  constructor(thickness1: number, elongation1: number, thickness2: number, elongation2: number) {
    this.thickness1 = thickness1;
    this.elongation1 = elongation1;
    this.thickness2 = thickness2;
    this.elongation2 = elongation2;
  }

  /** `SymetricalTee.java:57-59`. */
  getThickness1(): number {
    return this.thickness1;
  }

  /** `SymetricalTee.java:61-63`. */
  getElongation1(): number {
    return this.elongation1;
  }

  /** `SymetricalTee.java:65-67`. */
  getThickness2(): number {
    return this.thickness2;
  }

  /** `SymetricalTee.java:69-71`. */
  getElongation2(): number {
    return this.elongation2;
  }

  /** `SymetricalTee.java:73-75` — the tee's full x-extent. */
  getFullElongation(): number {
    return this.elongation1 + this.elongation2;
  }

  /** `SymetricalTee.java:77-79` — the wider of its two arms; the y-extent
   *  `SymetricalTeePositioned` reserves on either side of its own y. */
  getFullThickness(): number {
    return Math.max(this.thickness1, this.thickness2);
  }
}
