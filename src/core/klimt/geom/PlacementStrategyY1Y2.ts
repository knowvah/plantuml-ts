import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { XPoint2D } from './XPoint2D.js';
import { AbstractPlacementStrategy } from './AbstractPlacementStrategy.js';

/**
 * PlacementStrategyY1Y2 — vertical stack: each block horizontally
 * centered, with the unused height split into equal gaps above, between
 * and below the blocks (`space = (height - usedHeight) / (n + 1)`).
 *
 * Upstream: klimt/geom/PlacementStrategyY1Y2.java. (Upstream keeps this
 * AND the body-identical `PlacementStrategyY1Y2Center` as separate
 * classes; both are ported faithfully — do not merge them.)
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyY1Y2.java
 */
export class PlacementStrategyY1Y2 extends AbstractPlacementStrategy {
  constructor(stringBounder: StringBounder) {
    super(stringBounder);
  }

  /** @see klimt/geom/PlacementStrategyY1Y2.java#getPositions */
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
