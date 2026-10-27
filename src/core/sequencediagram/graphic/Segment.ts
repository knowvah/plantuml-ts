import { javaDoubleHashCode } from '../../java-hash-set.js';
import { javaDoubleToString } from '../../decoration/LinkStyle.js';

/** `(int) Math.signum(a - b)` -- Java maps a NaN difference to 0. */
function signum(diff: number): number {
  return Math.sign(diff) || 0;
}

/**
 * Segment -- a closed interval `[pos1, pos2]` on one axis.
 *
 * `TeaVM.a()` assertion guards are dropped (`Segment.java:118`'s
 * `assert pendingStart < pause.pos1`), as in T1f.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:46-135
 */
export class Segment {
  readonly #pos1: number;
  readonly #pos2: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:51-57 (throws `IllegalArgumentException`) */
  public constructor(pos1: number, pos2: number) {
    this.#pos1 = pos1;
    this.#pos2 = pos2;
    if (pos2 < pos1) throw new Error('IllegalArgumentException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:59-63 (a non-Segment is a `ClassCastException`/NPE upstream) */
  public equals(obj: unknown): boolean {
    if (!(obj instanceof Segment)) throw new Error('ClassCastException');
    return this.#pos1 === obj.#pos1 && this.#pos2 === obj.#pos2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:65-68 (`Double.hashCode` sum, wrapped to a Java int) */
  public hashCode(): number {
    return (javaDoubleHashCode(this.#pos1) + javaDoubleHashCode(this.#pos2)) | 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:70-72 (`contains(double)`) and :74-76 (`contains(Segment)`) */
  public contains(other: number | Segment): boolean {
    if (other instanceof Segment) return this.contains(other.#pos1) && this.contains(other.#pos2);
    return other >= this.#pos1 && other <= this.#pos2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:78-81 */
  public toString(): string {
    return `${javaDoubleToString(this.#pos1)} - ${javaDoubleToString(this.#pos2)}`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:83-85 */
  public getLength(): number {
    return this.#pos2 - this.#pos1;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:87-89 */
  public getPos1(): number {
    return this.#pos1;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:91-93 */
  public getPos2(): number {
    return this.#pos2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:95-97 */
  public merge(this2: Segment): Segment {
    return new Segment(Math.min(this.#pos1, this2.#pos1), Math.max(this.#pos2, this2.#pos2));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/graphic/Segment.java:99-127 and the `SortPos1` comparator :129-133 */
  public cutSegmentIfNeed(allDelays: Iterable<Segment>): Segment[] {
    const sortedDelay = [...allDelays].sort((a, b) => signum(a.#pos1 - b.#pos1));
    const result2: Segment[] = [];
    let pendingStart = this.#pos1;
    for (const pause of sortedDelay) {
      if (Math.abs(pause.#pos1 - pendingStart) < 0.001) {
        pendingStart = pause.#pos2;
        continue;
      }
      if (pause.#pos1 < pendingStart) continue;

      if (pause.#pos1 > this.#pos2) {
        if (pendingStart < this.#pos2) result2.push(new Segment(pendingStart, this.#pos2));
        return result2;
      }
      if (this.contains(pause)) {
        result2.push(new Segment(pendingStart, pause.#pos1));
        pendingStart = pause.#pos2;
      }
    }
    if (pendingStart < this.#pos2) result2.push(new Segment(pendingStart, this.#pos2));

    return result2;
  }
}
