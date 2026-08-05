import { UTranslate } from '../UTranslate.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { PlacementStrategy } from './PlacementStrategy.js';
import type { XPoint2D } from './XPoint2D.js';
import type { XRectangle2D } from './XRectangle2D.js';

/**
 * ULayoutGroup — drives a `PlacementStrategy`: blocks are `add`ed, then
 * `drawU` draws each one translated to its computed position, and
 * `getInnerPosition` locates a named member's rectangle inside whichever
 * placed block claims it (translated to group coordinates).
 * `MethodsOrFieldsArea` (SI1/T8) is the consumer.
 *
 * Upstream: klimt/geom/ULayoutGroup.java. Upstream's `tryOne` calls
 * `block.getInnerPosition(...)` (a `TextBlock` default member that
 * throws when unimplemented) and treats `null` as "not here"; this
 * port's `TextBlock.ts` deliberately carries no `getInnerPosition`
 * member (T3 scope reduction), so `tryOne` duck-types the optional
 * capability and treats `undefined` as "not here" — the exact idiom
 * `TextBlockLineBefore.ts#getInnerPosition` established.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/ULayoutGroup.java
 */
export class ULayoutGroup {
  private readonly placementStrategy: PlacementStrategy;

  constructor(placementStrategy: PlacementStrategy) {
    this.placementStrategy = placementStrategy;
  }

  /** @see klimt/geom/ULayoutGroup.java#drawU */
  drawU(ug: UGraphic, width: number, height: number): void {
    for (const [block, pos] of this.placementStrategy.getPositions(width, height)) {
      block.drawU(ug.apply(UTranslate.point(pos)));
    }
  }

  /** @see klimt/geom/ULayoutGroup.java#add */
  add(block: TextBlock): void {
    this.placementStrategy.add(block);
  }

  /** @see klimt/geom/ULayoutGroup.java#getInnerPosition */
  getInnerPosition(
    member: string,
    width: number,
    height: number,
    stringBounder: StringBounder,
  ): XRectangle2D | undefined {
    const all = this.placementStrategy.getPositions(width, height);
    return this.tryOne(all, member, stringBounder);
  }

  /** @see klimt/geom/ULayoutGroup.java#tryOne */
  private tryOne(
    all: Map<TextBlock, XPoint2D>,
    member: string,
    stringBounder: StringBounder,
  ): XRectangle2D | undefined {
    for (const [block, pos] of all) {
      const candidate = block as Partial<{
        getInnerPosition(m: string, sb: StringBounder): XRectangle2D | undefined;
      }>;
      const result = candidate.getInnerPosition?.(member, stringBounder);
      if (result !== undefined) {
        const translate = UTranslate.point(pos);
        return translate.apply(result);
      }
    }
    return undefined;
  }
}
