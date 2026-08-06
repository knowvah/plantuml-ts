import type { TextBlock } from './TextBlock.js';
import type { UGraphic } from '../UGraphic.js';
import { UTranslate } from '../UTranslate.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import type { XRectangle2D } from '../geom/XRectangle2D.js';
import type { ClockwiseTopRightBottomLeft } from '../geom/ClockwiseTopRightBottomLeft.js';
import type { Ports } from '../../svek/Ports.js';
import type { WithPorts } from '../../svek/WithPorts.js';
import { UEmpty } from './UEmpty.js';

/**
 * TextBlockMarged — wraps a `TextBlock` with a fixed (top, right,
 * bottom, left) margin, padding its measured dimension and offsetting
 * its draw position. `TextBlockUtils.withMargin` is the public factory.
 *
 * Upstream: klimt/shape/TextBlockMarged.java. Ported: both constructors
 * (4 loose numbers + the `ClockwiseTopRightBottomLeft` quad overload),
 * `calculateDimension`, `drawU`, and (SI1/T9 closure pull —
 * `BodyEnhanced1#getPorts`/`getInnerPosition` reach these through every
 * `decorate`d compartment) `getInnerPosition` + `getPorts`.
 *
 * `getPorts`'s upstream body casts the inner block UNCONDITIONALLY
 * (`((WithPorts) textBlock).getPorts` — a `ClassCastException` on a
 * non-`WithPorts` inner); the equivalent here is the runtime `TypeError`
 * when the member is absent (`MethodsOrFieldsArea.ts#contains`'s
 * documented CCE-equivalent convention).
 */
export class TextBlockMarged implements TextBlock {
  private readonly textBlock: TextBlock;
  private readonly top: number;
  private readonly right: number;
  private readonly bottom: number;
  private readonly left: number;

  constructor(textBlock: TextBlock, top: number, right: number, bottom: number, left: number) {
    this.textBlock = textBlock;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
  }

  static fromMargins(textBlock: TextBlock, margins: ClockwiseTopRightBottomLeft): TextBlockMarged {
    return new TextBlockMarged(textBlock, margins.getTop(), margins.getRight(), margins.getBottom(), margins.getLeft());
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const dim = this.textBlock.calculateDimension(stringBounder);
    return dim.delta(this.left + this.right, this.top + this.bottom);
  }

  drawU(ug: UGraphic): void {
    const dim = this.calculateDimension(ug.getStringBounder());
    if (dim.getWidth() > 0) {
      ug.draw(UEmpty.create(dim));
      const translate = new UTranslate(this.left, this.top);
      this.textBlock.drawU(ug.apply(translate));
    }
  }

  /** Inner rectangle translated by `(left, top)`; `getInnerPosition` is
   *  not on this port's `TextBlock` interface, so the inner lookup is
   *  duck-typed (`TextBlockLineBefore.ts`'s documented convention — the
   *  absent case mirrors upstream's `null` return).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:89-97 */
  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    const candidate = this.textBlock as Partial<{
      getInnerPosition(m: string, sb: StringBounder): XRectangle2D | undefined;
    }>;
    const parent = candidate.getInnerPosition?.(member, stringBounder);
    if (parent === undefined) return undefined;

    const translate = new UTranslate(this.left, this.top);
    return translate.apply(parent);
  }

  /** Unconditional inner cast preserved as its runtime-`TypeError`
   *  equivalent — see the class doc comment.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:99-102 */
  getPorts(stringBounder: StringBounder): Ports {
    return (this.textBlock as unknown as WithPorts).getPorts(stringBounder).translateY(this.top);
  }
}
