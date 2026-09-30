import type { UEllipse } from '../../shape/UEllipse.js';
import { UPolygon } from '../../shape/UPolygon.js';
import type { JavaRandom } from './JavaRandom.js';
import { ellipseHand } from './shapes.js';

/**
 * UEllipseHand — a full ellipse becomes a POLYGON (`shapes.ts#ellipseHand`,
 * the same two loops); an arc (`start`/`extend` non-zero) is drawn as
 * the source itself (java:55-58).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/UEllipseHand.java
 */
export class UEllipseHand {
  private readonly poly: UPolygon | UEllipse;

  constructor(source: UEllipse, rnd: JavaRandom) {
    if (source.getStart() !== 0 || source.getExtend() !== 0) {
      this.poly = source;
      return;
    }
    const poly = new UPolygon(ellipseHand(source.getWidth(), source.getHeight(), rnd));
    poly.setDeltaShadow(source.getDeltaShadow());
    this.poly = poly;
  }

  getHanddrawn(): UPolygon | UEllipse {
    return this.poly;
  }
}
