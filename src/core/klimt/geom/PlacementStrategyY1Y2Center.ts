import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { XPoint2D } from './XPoint2D.js';
import { AbstractPlacementStrategy } from './AbstractPlacementStrategy.js';

/**
 * PlacementStrategyY1Y2Center — vertical stack with each block
 * horizontally centered. Upstream's body is character-identical to
 * `PlacementStrategyY1Y2`; both classes exist upstream and both are
 * ported (do-not-refactor-while-porting: the duplication is upstream's).
 *
 * Upstream: klimt/geom/PlacementStrategyY1Y2Center.java.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyY1Y2Center.java
 */
export class PlacementStrategyY1Y2Center extends AbstractPlacementStrategy {
  constructor(stringBounder: StringBounder) {
    super(stringBounder);
  }

  /** @see klimt/geom/PlacementStrategyY1Y2Center.java#getPositions */
  getPositions(width: number, height: number): Map<TextBlock, XPoint2D> {
    const usedHeight = this.getSumHeight();

    const space = (height - usedHeight) / (this.getDimensions().size + 1);
    const result = new Map<TextBlock, XPoint2D>();
    let y = space;
    for (const [block, dim] of this.getDimensions()) {
      const x = (width - dim.getWidth()) / 2;
      result.set(block, new XPoint2D(x, y));
      y += dim.getHeight() + space;
    }
    return result;
  }
}
