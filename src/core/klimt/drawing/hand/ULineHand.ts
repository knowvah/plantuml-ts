import type { ULine } from '../../shape/ULine.js';
import type { UPath } from '../../shape/UPath.js';
import type { JavaRandom } from './JavaRandom.js';
import { HandJiggle } from './HandJiggle.js';

/** `new HandJiggle(0, 0, 2.0, rnd)` — ULineHand.java:50. */
const LINE_VARIATION = 2.0;

/**
 * ULineHand — a line becomes a jiggled polyline from `(0,0)` to
 * `(dx,dy)`, variation 2.0, as a
 * `UPath` (`jiggle.toUPath()`, java:53).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/ULineHand.java
 */
export class ULineHand {
  private readonly path: UPath;

  constructor(line: ULine, rnd: JavaRandom) {
    const jiggle = new HandJiggle(0, 0, LINE_VARIATION, rnd);
    jiggle.lineTo(line.getDX(), line.getDY());
    this.path = jiggle.toUPath();
  }

  getHanddrawn(): UPath {
    return this.path;
  }
}
