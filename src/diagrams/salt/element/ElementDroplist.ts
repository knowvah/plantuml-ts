import { Back } from '../../../core/klimt/Back.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import { UPolygon } from '../../../core/klimt/shape/UPolygon.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { atomOpsFor } from '../SaltDictionary.js';
import { AbstractElementText } from './AbstractElementText.js';
import type { Element } from './Element.js';

/** The head / open-list separator. @see ElementDroplist.java:63, 79 */
const SEPARATOR = '^';

/**
 * `new StringTokenizer(text, "^")` drained into a list: the maximal non-empty
 * runs between separators (empty tokens are skipped).
 *
 * @see ElementDroplist.java:63-67
 */
function tokenize(text: string): string[] {
  return text.split(SEPARATOR).filter((token) => token.length > 0);
}

/**
 * ElementDroplist — `^head^entry^…^`: a `#EEE` box holding the head, a
 * divider `box` px from the right with a filled arrow, and — when there are
 * entries — the open list below it. The open list draws at every z-index
 * (java:110-116 is outside the `zIndex == 0` guard), so `PSystemSalt` draws
 * it twice.
 *
 * `HColors.changeBack(ug)` (HColors.java:148-154) is
 * `new Back(ug.getParam().getColor())`, the port's idiom for it
 * (`ExtremityTriangle.ts`, ExtremityTriangle.java:77): the port's colour is
 * never null, so the `HColors.none().bg()` branch has no counterpart.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementDroplist.java:56-118
 */
export class ElementDroplist extends AbstractElementText implements Element {
  /** @see ElementDroplist.java:58 */
  private readonly box = 12;
  /** `null` upstream when there is no entry. @see ElementDroplist.java:59 */
  private readonly openDrop: TextBlock | undefined;

  /** @see ElementDroplist.java:61-76 */
  constructor(text: string, font: UFont, spriteContainer: ISkinSimple) {
    super(ElementDroplist.extract(text), font, true, spriteContainer);
    const drop = tokenize(text);
    if (drop.length > 0) {
      drop.splice(0, 1);
    }
    if (drop.length === 0) {
      this.openDrop = undefined;
    } else {
      const config = this.getConfig();
      const ctx = { fontConfiguration: config, spriteContainer, atomOps: atomOpsFor(spriteContainer, config) };
      this.openDrop = Display.create(drop).create(ctx, HorizontalAlignment.LEFT);
    }
  }

  /** @see ElementDroplist.java:78-84 */
  private static extract(text: string): string {
    const idx = text.indexOf(SEPARATOR);
    if (idx === -1) {
      return text;
    }
    return text.substring(0, idx);
  }

  /** @see ElementDroplist.java:86-89 */
  getPreferredDimension(stringBounder: StringBounder, x: number, _y: number): XDimension2D {
    const dim = this.getTextDimensionAt(stringBounder, x + 2);
    return dim.delta(4 + this.box, 4);
  }

  /** @see ElementDroplist.java:91-117 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D): void {
    const dim = this.getPreferredDimension(ug.getStringBounder(), 0, 0);
    ug = ug.apply(new Fore(this.getBlack().asPaint()));

    if (zIndex === 0) {
      this.drawClosed(ug, dim);
    }

    if (this.openDrop !== undefined) {
      const dimOpen = this.openDrop.calculateDimension(ug.getStringBounder()).atLeast(dim.getWidth() - 1, 0);
      ug = ug.apply(UTranslate.dy(dim.getHeight() - 1));
      ug.apply(new Back(this.getColorEE().asPaint())).draw(
        URectangle.build(dimOpen.getWidth() - 1, dimOpen.getHeight() - 1),
      );
      this.openDrop.drawU(ug);
    }
  }

  /** The `zIndex == 0` block, split out for the complexity limit.
   *  @see ElementDroplist.java:95-108 */
  private drawClosed(ug: UGraphic, dim: XDimension2D): void {
    ug.apply(new Back(this.getColorEE().asPaint())).draw(URectangle.build(dim.getWidth() - 1, dim.getHeight() - 1));
    this.drawText(ug, 2, 2);
    const xline = dim.getWidth() - this.box;
    ug.apply(UTranslate.dx(xline)).draw(ULine.vline(dim.getHeight() - 1));

    const poly = new UPolygon();
    poly.addPoint(0, 0);
    poly.addPoint(this.box - 6, 0);
    const dimText = this.getPureTextDimension(ug.getStringBounder());
    // Java int division: `(box - 6) / 2` with `int box`.
    poly.addPoint(Math.trunc((this.box - 6) / 2), dimText.getHeight() - 8);

    ug.apply(new Back(ug.getParam().getColor()))
      .apply(new UTranslate(xline + 3, 6))
      .draw(poly);
  }
}
