import type { UChange } from '../../UChange.js';
import type { UGraphic } from '../../UGraphic.js';
import type { UShape } from '../../UShape.js';
import { DotPath } from '../../shape/DotPath.js';
import { UEllipse } from '../../shape/UEllipse.js';
import { ULine } from '../../shape/ULine.js';
import { UPath } from '../../shape/UPath.js';
import { UPolygon } from '../../shape/UPolygon.js';
import { URectangle } from '../../shape/URectangle.js';
import { UGraphicDelegator } from '../UGraphicDelegator.js';
import { JavaRandom } from './JavaRandom.js';
import { UDotPathHand } from './UDotPathHand.js';
import { UEllipseHand } from './UEllipseHand.js';
import { ULineHand } from './ULineHand.js';
import { UPathHand } from './UPathHand.js';
import { UPolygonHand } from './UPolygonHand.js';
import { URectangleHand } from './URectangleHand.js';

/** `new Random(424242L)` — UGraphicHandwritten.java:54. */
const HANDWRITTEN_SEED = 424242;

/**
 * UGraphicHandwritten — the decorator `TextBlockExporter#exportTo` wraps
 * the export graphic in when the diagram is handwritten
 * (TextBlockExporter.java:174-175): ULine / URectangle / UPolygon / UEllipse /
 * DotPath / UPath are replaced by their jiggled hand shape, anything else
 * (text, images, …) is drawn unchanged.
 *
 * The `Random` is an INSTANCE field (java:54) and `apply` wraps the
 * changed graphic in a NEW decorator (java:114-116), so the sequence
 * restarts at every `apply` and continues only across draws on one
 * instance — the jar's goldens show two links drawn after `apply` opening
 * with the identical jiggle.
 *
 * Not ported: the constructor's `((UGraphicSvg) ug).enlargeClip()`
 * (java:58-61) — it only widens an active `UClip` by 1
 * (AbstractCommonUGraphic.java:131-136), and this port's klimt has no
 * `UClip` (`AbstractCommonUGraphic.ts`'s own scope note).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/UGraphicHandwritten.java
 */
export class UGraphicHandwritten extends UGraphicDelegator {
  private readonly rnd = new JavaRandom(HANDWRITTEN_SEED);

  /** java:64-82 — the `instanceof` chain, in upstream's order. */
  override draw(shape: UShape): void {
    this.getUg().draw(this.handdrawn(shape));
  }

  private handdrawn(shape: UShape): UShape {
    if (shape instanceof ULine) return new ULineHand(shape, this.rnd).getHanddrawn();
    if (shape instanceof URectangle) return new URectangleHand(shape, this.rnd).getHanddrawn();
    if (shape instanceof UPolygon) return new UPolygonHand(shape, this.rnd).getHanddrawn();
    if (shape instanceof UEllipse) return new UEllipseHand(shape, this.rnd).getHanddrawn();
    if (shape instanceof DotPath) return new UDotPathHand(shape, this.rnd).getHanddrawn();
    if (shape instanceof UPath) return new UPathHand(shape, this.rnd).getHanddrawn();
    return shape;
  }

  /** java:114-116 */
  apply(change: UChange): UGraphic {
    return new UGraphicHandwritten(this.getUg().apply(change));
  }
}
