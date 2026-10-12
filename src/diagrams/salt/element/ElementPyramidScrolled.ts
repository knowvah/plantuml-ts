import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { UPath } from '../../../core/klimt/shape/UPath.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { ScrollStrategy } from '../factory/ScrollStrategy.js';
import type { Positionner2 } from '../Positionner2.js';
import { ElementPyramid } from './ElementPyramid.js';
import { TableStrategy } from './TableStrategy.js';

/** What a scroll bar adds to the pyramid's preferred dimension, per bar.
 *  @see ElementPyramidScrolled.java:65, 68, 70 */
const SCROLL_DELTA = 30;
/** The gap between the pyramid and a bar. @see ElementPyramidScrolled.java:79, 82 */
const BAR_GAP = 4;
/** An arrow's inset inside its bar end. @see ElementPyramidScrolled.java:130-131, 138-139 */
const ARROW_INSET = 4;

/**
 * ElementPyramidScrolled — a `{S` (both bars), `{SI` (vertical only) or
 * `{S-` (horizontal only) pyramid: a `DRAW_OUTSIDE` untitled pyramid with
 * scroll bars 4 px right of and/or below it, drawn at every z-index. Each
 * bar is a 15 px-thick box with 12 px end caps holding a filled arrow.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementPyramidScrolled.java:49-142
 */
export class ElementPyramidScrolled extends ElementPyramid {
  /** The bar thickness. @see ElementPyramidScrolled.java:51 */
  private readonly v1 = 15;
  /** The end-cap length. @see ElementPyramidScrolled.java:52 */
  private readonly v2 = 12;
  /** @see ElementPyramidScrolled.java:53 */
  private readonly scrollStrategy: ScrollStrategy;

  /** @see ElementPyramidScrolled.java:55-59 */
  constructor(positionner: Positionner2, spriteContainer: ISkinSimple, scrollStrategy: ScrollStrategy) {
    super(positionner, TableStrategy.DRAW_OUTSIDE, null, spriteContainer);
    this.scrollStrategy = scrollStrategy;
  }

  /** @see ElementPyramidScrolled.java:61-71 */
  override getPreferredDimension(stringBounder: StringBounder, x: number, y: number): XDimension2D {
    const result = super.getPreferredDimension(stringBounder, x, y);
    if (this.scrollStrategy === ScrollStrategy.HORIZONTAL_ONLY) return result.delta(0, SCROLL_DELTA);

    if (this.scrollStrategy === ScrollStrategy.VERTICAL_ONLY) return result.delta(SCROLL_DELTA, 0);

    return result.delta(SCROLL_DELTA);
  }

  /** `ug.apply(getBlack())` sets the foreground (`Fore`). @see ElementPyramidScrolled.java:73-84 */
  override drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D | null): void {
    super.drawU(ug, zIndex, dimToUse);
    ug = ug.apply(new Fore(this.getBlack().asPaint()));
    const dim = super.getPreferredDimension(ug.getStringBounder(), 0, 0);
    if (this.scrollStrategy === ScrollStrategy.BOTH || this.scrollStrategy === ScrollStrategy.VERTICAL_ONLY)
      this.drawV(ug.apply(UTranslate.dx(dim.getWidth() + BAR_GAP)), this.v1, dim.getHeight());

    if (this.scrollStrategy === ScrollStrategy.BOTH || this.scrollStrategy === ScrollStrategy.HORIZONTAL_ONLY)
      this.drawH(ug.apply(UTranslate.dy(dim.getHeight() + BAR_GAP)), dim.getWidth(), this.v1);
  }

  /** The up arrow. @see ElementPyramidScrolled.java:86-94 */
  private getTr0(): UPath {
    const poly = UPath.none();
    poly.moveTo(3, 0);
    poly.lineTo(6, 5);
    poly.lineTo(0, 5);
    poly.lineTo(3, 0);
    poly.closePath();
    return poly;
  }

  /** The down arrow. @see ElementPyramidScrolled.java:96-104 */
  private getTr180(): UPath {
    const poly = UPath.none();
    poly.moveTo(3, 5);
    poly.lineTo(6, 0);
    poly.lineTo(0, 0);
    poly.lineTo(3, 5);
    poly.closePath();
    return poly;
  }

  /** The left arrow. @see ElementPyramidScrolled.java:106-114 */
  private getTr90(): UPath {
    const poly = UPath.none();
    poly.moveTo(0, 3);
    poly.lineTo(5, 6);
    poly.lineTo(5, 0);
    poly.lineTo(0, 3);
    poly.closePath();
    return poly;
  }

  /** The right arrow. @see ElementPyramidScrolled.java:116-124 */
  private getTr270(): UPath {
    const poly = UPath.none();
    poly.moveTo(5, 3);
    poly.lineTo(0, 6);
    poly.lineTo(0, 0);
    poly.lineTo(5, 3);
    poly.closePath();
    return poly;
  }

  /** `getBlack().bg()` is `Back`. @see ElementPyramidScrolled.java:126-132 */
  private drawV(ug: UGraphic, width: number, height: number): void {
    const black = new Back(this.getBlack().asPaint());
    ug.draw(URectangle.build(width, height));
    ug.apply(UTranslate.dy(this.v2)).draw(ULine.hline(width));
    ug.apply(UTranslate.dy(height - this.v2)).draw(ULine.hline(width));
    ug.apply(new UTranslate(ARROW_INSET, ARROW_INSET)).apply(black).draw(this.getTr0());
    ug.apply(new UTranslate(ARROW_INSET, height - this.v2 + ARROW_INSET))
      .apply(black)
      .draw(this.getTr180());
  }

  /** `getBlack().bg()` is `Back`. @see ElementPyramidScrolled.java:134-140 */
  private drawH(ug: UGraphic, width: number, height: number): void {
    const black = new Back(this.getBlack().asPaint());
    ug.draw(URectangle.build(width, height));
    ug.apply(UTranslate.dx(this.v2)).draw(ULine.vline(height));
    ug.apply(UTranslate.dx(width - this.v2)).draw(ULine.vline(height));
    ug.apply(new UTranslate(ARROW_INSET, ARROW_INSET)).apply(black).draw(this.getTr90());
    ug.apply(new UTranslate(width - this.v2 + ARROW_INSET, ARROW_INSET))
      .apply(black)
      .draw(this.getTr270());
  }
}
