import { FontConfiguration } from '../../../core/abel/FontConfiguration.js';
import { Back } from '../../../core/klimt/Back.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import { Fore } from '../../../core/klimt/Fore.js';
import { bridgeFontConfiguration } from '../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { UEllipse } from '../../../core/klimt/shape/UEllipse.js';
import { UPolygon } from '../../../core/klimt/shape/UPolygon.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../core/klimt/UStroke.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { atomOpsFor } from '../SaltDictionary.js';
import { AbstractElement } from './AbstractElement.js';

/** The checkbox square's side. @see ElementRadioCheckbox.java:58 */
const RECTANGLE = 10;
/** The radio circle's diameter. @see ElementRadioCheckbox.java:59 */
const ELLIPSE = 10;
/** The checked radio dot's diameter. @see ElementRadioCheckbox.java:60 */
const ELLIPSE2 = 4;

/**
 * ElementRadioCheckbox — `()`/`(X)` and `[]`/`[X]`: a 10 px circle or
 * square at the left, the creole text at `margin`, and when checked a dot
 * or tick filled with the ink.
 *
 * `HColors.changeBack(ug)` is `new Back(ug.getParam().getColor())`, as in
 * `ElementDroplist.ts`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementRadioCheckbox.java:56-120
 */
export class ElementRadioCheckbox extends AbstractElement {
  /** @see ElementRadioCheckbox.java:61 */
  private readonly block: TextBlock;
  /** @see ElementRadioCheckbox.java:62 */
  private readonly margin = 20;
  /** @see ElementRadioCheckbox.java:63 */
  private readonly stroke = 1.5;
  /** @see ElementRadioCheckbox.java:64 */
  private readonly radio: boolean;
  /** @see ElementRadioCheckbox.java:65 */
  private readonly checked: boolean;

  /**
   * `FontConfiguration.blackBlueTrue(font)` bridged to the creole
   * `FontConfiguration`, and ADR-9's `atomOps`, as in `ElementText.ts`.
   *
   * @see ElementRadioCheckbox.java:67-73
   */
  constructor(text: readonly string[], font: UFont, radio: boolean, checked: boolean, spriteContainer: ISkinSimple) {
    super();
    const config = bridgeFontConfiguration(FontConfiguration.blackBlueTrue(font));
    const ctx = { fontConfiguration: config, spriteContainer, atomOps: atomOpsFor(spriteContainer, config) };
    this.block = Display.create(text).create(ctx, HorizontalAlignment.LEFT);
    this.radio = radio;
    this.checked = checked;
  }

  /** @see ElementRadioCheckbox.java:75-78 */
  getPreferredDimension(stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    const dim = this.block.calculateDimension(stringBounder);
    return dim.delta(this.margin, 0);
  }

  /** @see ElementRadioCheckbox.java:80-96 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D | null): void {
    if (zIndex !== 0) return;

    ug = ug.apply(new Fore(this.getBlack()));
    this.block.drawU(ug.apply(UTranslate.dx(this.margin)));

    const dim = this.getPreferredDimension(ug.getStringBounder(), 0, 0);
    const height = dim.getHeight();

    ug = ug.apply(UStroke.withThickness(this.stroke));
    if (this.radio) {
      this.drawRadio(ug, height);
    } else {
      this.drawOther(ug, height);
    }
  }

  /** @see ElementRadioCheckbox.java:98-110 */
  private drawOther(ug: UGraphic, height: number): void {
    ug.apply(new UTranslate(2, (height - RECTANGLE) / 2)).draw(URectangle.build(RECTANGLE, RECTANGLE));
    if (this.checked) {
      const poly = new UPolygon();
      poly.addPoint(0, 0);
      poly.addPoint(3, 3);
      poly.addPoint(10, -6);
      poly.addPoint(3, 1);
      ug = ug.apply(new Back(ug.getParam().getColor()));
      ug = ug.apply(new UTranslate(3, 6));
      ug.draw(poly);
    }
  }

  /** @see ElementRadioCheckbox.java:112-119 */
  private drawRadio(ug: UGraphic, height: number): void {
    ug.apply(new UTranslate(2, (height - ELLIPSE) / 2)).draw(UEllipse.build(ELLIPSE, ELLIPSE));
    if (this.checked) {
      ug = ug.apply(new Back(ug.getParam().getColor()));
      // Java int division: `(ELLIPSE - ELLIPSE2) / 2` on two `int` constants.
      ug = ug.apply(new UTranslate(2 + Math.trunc((ELLIPSE - ELLIPSE2) / 2), (height - ELLIPSE2) / 2));
      ug.draw(UEllipse.build(ELLIPSE2, ELLIPSE2));
    }
  }
}
