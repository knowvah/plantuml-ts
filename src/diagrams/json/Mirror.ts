/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/Mirror.java
 *
 * Upstream lays a json diagram out on a TRANSPOSED graph and rotates the
 * answer back. `SmetanaForJson#createNode` hands graphviz each node's height
 * as its width and vice versa (`SmetanaForJson.java:236-244`) and sets no
 * `rankdir`, so the graph is solved top-to-bottom in a swapped frame; every
 * coordinate read back out is then passed through `invAndXYSwitch` to become
 * the left-to-right diagram a user sees.
 *
 * `max` is the extent of that transposed frame along the axis being flipped.
 *
 * Ported faithfully, including the out-of-range guard: upstream PRINTS a
 * diagnostic and returns the value anyway rather than throwing, so a bad input
 * degrades to a misplaced point, never a failed render. This port keeps that
 * shape — see `onBadValue`.
 */
import { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';

/** Upstream writes `System.err.println("BAD VALUE IN Mirror")`. This port is a
 *  browser-safe library and must not write to a stream, so the hook is a
 *  no-op by default and exists to be observed by tests. Deliberately NOT a
 *  throw: upstream continues, and so must this. */
let onBadValue: (v: number, max: number) => void = () => {
  /* no-op — see this module's doc comment */
};

/** Test seam for the `BAD VALUE IN Mirror` diagnostic. Returns the previous
 *  handler so a caller can restore it. */
export function setMirrorBadValueHandler(
  handler: (v: number, max: number) => void,
): (v: number, max: number) => void {
  const previous = onBadValue;
  onBadValue = handler;
  return previous;
}

export class Mirror {
  private readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  /** `max - v`, with upstream's range diagnostic. */
  inv(v: number): number {
    if (v < 0 || v > this.max) onBadValue(v, this.max);
    return this.max - v;
  }

  /** The transpose: `x` comes from the flipped `y`, `y` from the raw `x`. */
  invAndXYSwitch(pt: XPoint2D): XPoint2D {
    const x = this.inv(pt.getY());
    const y = pt.getX();
    return new XPoint2D(x, y);
  }

  /** Flip `y` only, leaving `x` alone (upstream's git-diagram variant). */
  invGit(pt: XPoint2D): XPoint2D {
    return new XPoint2D(pt.getX(), this.inv(pt.getY()));
  }
}
