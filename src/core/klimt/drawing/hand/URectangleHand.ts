import type { URectangle } from '../../shape/URectangle.js';
import type { UPolygon } from '../../shape/UPolygon.js';
import { HandJiggle } from './HandJiggle.js';
import type { JavaRandom } from './JavaRandom.js';

/** `new HandJiggle(…, 1.5, rnd)` — URectangleHand.java:55,61. */
const RECTANGLE_VARIATION = 1.5;

/**
 * URectangleHand — a (rounded) rectangle becomes a jiggled POLYGON, in the
 * rectangle's own frame. `rx`/`ry` are `getRx()/2`, `getRy()/2` each
 * clamped to half the side (java:51-52): `URectangle#rounded` stores the
 * un-halved corner.
 *
 * Written against `HandJiggle` rather than `shapes.ts#rectangleHand`,
 * which takes ONE corner for both axes; upstream reads `getRx` and
 * `getRy` separately.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/URectangleHand.java
 */
export class URectangleHand {
  private readonly poly: UPolygon;

  constructor(rectangle: URectangle, rnd: JavaRandom) {
    const width = rectangle.getWidth();
    const height = rectangle.getHeight();
    const rx = Math.min(rectangle.getRx() / 2, width / 2);
    const ry = Math.min(rectangle.getRy() / 2, height / 2);
    const jiggle = rx === 0 && ry === 0 ? square(width, height, rnd) : rounded(width, height, rx, ry, rnd);
    this.poly = jiggle.toUPolygon();
    this.poly.setDeltaShadow(rectangle.getDeltaShadow());
  }

  getHanddrawn(): UPolygon {
    return this.poly;
  }
}

/** java:54-59 */
function square(width: number, height: number, rnd: JavaRandom): HandJiggle {
  const jiggle = new HandJiggle(0, 0, RECTANGLE_VARIATION, rnd);
  jiggle.lineTo(width, 0);
  jiggle.lineTo(width, height);
  jiggle.lineTo(0, height);
  jiggle.lineTo(0, 0);
  return jiggle;
}

/** java:60-69 */
function rounded(width: number, height: number, rx: number, ry: number, rnd: JavaRandom): HandJiggle {
  const jiggle = new HandJiggle(rx, 0, RECTANGLE_VARIATION, rnd);
  jiggle.lineTo(width - rx, 0);
  jiggle.arcTo(-Math.PI / 2, 0, width - rx, ry, rx, ry);
  jiggle.lineTo(width, height - ry);
  jiggle.arcTo(0, Math.PI / 2, width - rx, height - ry, rx, ry);
  jiggle.lineTo(rx, height);
  jiggle.arcTo(Math.PI / 2, Math.PI, rx, height - ry, rx, ry);
  jiggle.lineTo(0, ry);
  jiggle.arcTo(Math.PI, (3 * Math.PI) / 2, rx, ry, rx, ry);
  return jiggle;
}
