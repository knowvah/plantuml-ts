import type { DotPath } from '../../shape/DotPath.js';
import type { UPath } from '../../shape/UPath.js';
import { HandJiggle } from './HandJiggle.js';
import type { JavaRandom } from './JavaRandom.js';

/** `HandJiggle.create(…, 2.0, rnd)` — UDotPathHand.java:49. */
const DOT_PATH_VARIATION = 2.0;

/**
 * UDotPathHand — every bezier of the path jiggled in one run from the
 * start point, as a `UPath`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/UDotPathHand.java
 */
export class UDotPathHand {
  private readonly path: UPath;

  constructor(source: DotPath, rnd: JavaRandom) {
    const jiggle = HandJiggle.create(source.getStartPoint(), DOT_PATH_VARIATION, rnd);
    for (const curve of source.getBeziers()) jiggle.curveTo({ ...curve });
    this.path = jiggle.toUPath();
  }

  getHanddrawn(): UPath {
    return this.path;
  }
}
