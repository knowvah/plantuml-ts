import { UPolygon } from '../../shape/UPolygon.js';
import type { JavaRandom } from './JavaRandom.js';
import { polygonHand } from './shapes.js';

/**
 * UPolygonHand — jiggle between the points and back to the first,
 * variation 1.5 (`shapes.ts#polygonHand`, the same body). An empty source
 * yields an empty polygon WITHOUT the source's shadow (java:50-53).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/UPolygonHand.java
 */
export class UPolygonHand {
  private readonly poly: UPolygon;

  constructor(source: UPolygon, rnd: JavaRandom) {
    const pt = source.getPoints();
    if (pt.length === 0) {
      this.poly = new UPolygon();
      return;
    }
    this.poly = new UPolygon(polygonHand(pt, rnd));
    this.poly.setDeltaShadow(source.getDeltaShadow());
  }

  getHanddrawn(): UPolygon {
    return this.poly;
  }
}
