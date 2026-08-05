import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { XDimension2D } from './XDimension2D.js';
import { XPoint2D } from './XPoint2D.js';
import { AbstractPlacementStrategy } from './AbstractPlacementStrategy.js';

/**
 * PlacementStrategyVisibility — the visibility-icon member layout used
 * by `MethodsOrFieldsArea` (SI1/T8): blocks arrive as (icon, member)
 * PAIRS. Per pair, the icon sits at `x = 0` with a `+2` y bias, the
 * member text at `x = col2`; both are vertically centered against the
 * pair's max height, and the cursor advances by that max height.
 *
 * Upstream: klimt/geom/PlacementStrategyVisibility.java. The Java
 * two-`it.next()`-per-iteration walk assumes an even block count and
 * throws `NoSuchElementException` on a dangling icon; this port throws
 * an `Error` at the same point.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyVisibility.java
 */
export class PlacementStrategyVisibility extends AbstractPlacementStrategy {
  /** @see klimt/geom/PlacementStrategyVisibility.java#col2 */
  private readonly col2: number;

  constructor(stringBounder: StringBounder, col2: number) {
    super(stringBounder);
    this.col2 = col2;
  }

  /** @see klimt/geom/PlacementStrategyVisibility.java#getPositions */
  getPositions(_width: number, _height: number): Map<TextBlock, XPoint2D> {
    const result = new Map<TextBlock, XPoint2D>();
    let y = 0;
    const it = this.getDimensions().entries();
    for (let first = it.next(); !(first.done ?? false); first = it.next()) {
      const ent1: [TextBlock, XDimension2D] = first.value;
      const second = it.next();
      if (second.done ?? false) {
        // Java: it.next() past the end -> NoSuchElementException.
        throw new Error('PlacementStrategyVisibility: odd number of blocks');
      }
      const ent2: [TextBlock, XDimension2D] = second.value;

      const height1 = ent1[1].getHeight();
      const height2 = ent2[1].getHeight();
      const maxHeight12 = Math.max(height1, height2);

      result.set(ent1[0], new XPoint2D(0, 2 + y + (maxHeight12 - height1) / 2));
      result.set(ent2[0], new XPoint2D(this.col2, y + (maxHeight12 - height2) / 2));
      y += maxHeight12;
    }
    return result;
  }
}
