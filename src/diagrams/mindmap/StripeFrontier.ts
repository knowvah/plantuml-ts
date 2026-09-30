import { Stripe } from './Stripe.js';

/**
 * The packed-so-far skyline `Tetris.add` reads and writes: a sorted,
 * non-overlapping partition of the x-axis into `Stripe`s, each holding the
 * highest y reached under that x-range. `Tetris` asks it where a new
 * element's bottom edges would land (`getContact`) and then records the
 * new element's own bottom edges (`addSegment`).
 *
 * Ported as a sorted array (ascending by `Stripe#getStart`) in place of
 * upstream's `TreeSet<Stripe>` — `Stripe#compareTo` never returns 0 for two
 * distinct stripes within one frontier (its segments partition the x-axis
 * with no shared start), so array order and set order coincide.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/StripeFrontier.java
 */
export class StripeFrontier {
  // `StripeFrontier.java:48-50` — the whole x-axis starts covered by one
  // sentinel stripe at y = -Number.MAX_VALUE (D8: sentinel translation of
  // `-Double.MAX_VALUE`, not a fitted value), so every `x` is always inside
  // some stripe and `collisionning` never falls off the end for a caller
  // that respects the public contract.
  private readonly stripes: Stripe[] = [new Stripe(-Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE)];

  /** `StripeFrontier.java:52-54`. */
  isEmpty(): boolean {
    return this.stripes.length === 1;
  }

  /** `StripeFrontier.java:61-67`. */
  contains(x: number, y: number): boolean {
    for (const stripe of this.stripes) {
      if (stripe.contains(x)) return y <= stripe.getValue();
    }
    throw new Error(`StripeFrontier#contains: x (${x}) is not covered by any stripe`);
  }

  /** `StripeFrontier.java:69-77`. */
  getContact(x1: number, x2: number): number {
    const collisions = this.collisionning(x1, x2);
    let result = -Number.MAX_VALUE;
    for (const stripe of collisions) result = Math.max(result, stripe.getValue());
    return result;
  }

  /** `StripeFrontier.java:79-105` — a segment that spans more than one
   *  existing stripe is split at each boundary and re-added piecewise,
   *  recursing until every sub-call touches exactly one stripe. */
  addSegment(x1: number, x2: number, value: number): void {
    if (x2 <= x1) {
      throw new Error(`StripeFrontier#addSegment: x2 (${x2}) must be greater than x1 (${x1})`);
    }
    const collisions = this.collisionning(x1, x2);
    if (collisions.length > 1) {
      let x = x1;
      for (let i = 1; i < collisions.length; i += 1) {
        const tmp = collisions[i]!;
        this.addSegment(x, tmp.getStart(), value);
        x = tmp.getStart();
      }
      this.addSegment(x, x2, value);
    } else {
      this.addSingleInternal(x1, x2, value, collisions[0]!);
    }
  }

  /** `StripeFrontier.java:107-121` — only raises the frontier: a segment at
   *  or below the touched stripe's existing value leaves it untouched. */
  private addSingleInternal(x1: number, x2: number, value: number, touch: Stripe): void {
    if (value <= touch.getValue()) return;

    const index = this.stripes.indexOf(touch);
    this.stripes.splice(index, 1);
    const replacement: Stripe[] = [];
    if (touch.getStart() !== x1) replacement.push(new Stripe(touch.getStart(), x1, touch.getValue()));
    replacement.push(new Stripe(x1, x2, value));
    if (x2 !== touch.getEnd()) replacement.push(new Stripe(x2, touch.getEnd(), touch.getValue()));
    this.stripes.splice(index, 0, ...replacement);
  }

  /** `StripeFrontier.java:140-153` — every stripe the range `[x1, x2]`
   *  overlaps, in ascending x order (the array is already sorted, so
   *  appending in iteration order preserves it). */
  private collisionning(x1: number, x2: number): Stripe[] {
    const result: Stripe[] = [];
    for (const stripe of this.stripes) {
      if (x1 >= stripe.getEnd()) continue;
      result.push(stripe);
      if (x2 <= stripe.getEnd()) return result;
    }
    throw new Error(`StripeFrontier#collisionning: no stripe covers [${x1}, ${x2}]`);
  }
}
