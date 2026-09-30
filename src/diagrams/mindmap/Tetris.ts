import { StripeFrontier } from './StripeFrontier.js';
import { SymetricalTeePositioned } from './SymetricalTeePositioned.js';
import type { SymetricalTee } from './SymetricalTee.js';

/**
 * Packs a node's children's `SymetricalTee`s against each other with no
 * overlap, tightest-fit first: `add` slides a new tee's arm 1 down the
 * `StripeFrontier` until it touches whatever is already packed (trying both
 * arm 1's and arm 2's own contact point, keeping the lower result), then
 * records its bottom edges back onto the frontier. `balance` re-centres the
 * whole stack around y = 0 once every child has been added.
 *
 * `FingerImpl.getTetris` builds one `Tetris` per mindmap node from that
 * node's children's own `SymetricalTee`s (`FingerImpl.java:167-176`); its
 * `getHeight`/`getWidth` become that node's own `SymetricalTee`'s
 * `thickness2`/`elongation2` one level up (`FingerImpl.java:178-187`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Tetris.java
 */
export class Tetris {
  private readonly frontier = new StripeFrontier();
  private readonly elements: SymetricalTeePositioned[] = [];
  // `Tetris.java:49-50` sentinels `Double.MAX_VALUE`/`-Double.MAX_VALUE`,
  // marking "not yet balanced" — ported as `Number.MAX_VALUE` (D8: sentinel
  // translation, not a fitted value).
  private minY = Number.MAX_VALUE;
  private maxY = -Number.MAX_VALUE;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /** `Tetris.java:62-78` — throws if called a second time (`minY` is only
   *  ever the sentinel before the first `balance`); an empty `Tetris` is a
   *  no-op, matching the leaf case where `FingerImpl.getTetris` still
   *  allocates a `Tetris` with nothing added to it. */
  balance(): void {
    if (this.elements.length === 0) return;
    if (this.minY !== Number.MAX_VALUE) {
      throw new Error(`Tetris#balance: "${this.name}" is already balanced`);
    }

    for (const element of this.elements) {
      this.minY = Math.min(this.minY, element.getMinY());
      this.maxY = Math.max(this.maxY, element.getMaxY());
    }
    const mean = (this.minY + this.maxY) / 2;
    for (const stp of this.elements) stp.move(-mean);
  }

  /** `Tetris.java:80-85`. */
  getHeight(): number {
    if (this.elements.length === 0) return 0;
    return this.maxY - this.minY;
  }

  /** `Tetris.java:87-93`. */
  getWidth(): number {
    let result = 0;
    for (const tee of this.elements) result = Math.max(result, tee.getMaxX());
    return result;
  }

  /** `Tetris.java:95-122` — the first element seeds the frontier at y = 0;
   *  every later one is placed by trying both of its own arms against the
   *  existing frontier and keeping the placement whose resulting y is
   *  greater (i.e. lands lower, since `Tetris`'s y grows downward). */
  add(tee: SymetricalTee): void {
    if (this.frontier.isEmpty()) {
      this.addInternal(new SymetricalTeePositioned(tee));
      return;
    }

    const c1 = this.frontier.getContact(0, tee.getElongation1());
    const c2 = this.frontier.getContact(tee.getElongation1(), tee.getElongation1() + tee.getElongation2());

    const p1 = new SymetricalTeePositioned(tee);
    p1.moveSoThatSegmentA1isOn(c1);

    const p2 = new SymetricalTeePositioned(tee);
    p2.moveSoThatSegmentA2isOn(c2);

    this.addInternal(p1.getMax(p2));
  }

  /** `Tetris.java:124-135` — records the placed element's bottom edges onto
   *  the frontier; arm 2 is skipped when it has zero width (a leaf tee),
   *  matching upstream's `b2.getX1() != b2.getX2()` guard. */
  private addInternal(result: SymetricalTeePositioned): void {
    this.elements.push(result);

    const b1 = result.getSegmentB1();
    this.frontier.addSegment(b1.getX1(), b1.getX2(), b1.getY1());

    const b2 = result.getSegmentB2();
    if (b2.getX1() !== b2.getX2()) {
      this.frontier.addSegment(b2.getX1(), b2.getX2(), b2.getY1());
    }
  }

  /** `Tetris.java:137-139` — `Collections.unmodifiableList` there is a
   *  read-only view over the same backing list; a `readonly` array type
   *  here is the same contract at the type level. */
  getElements(): readonly SymetricalTeePositioned[] {
    return this.elements;
  }
}
