import { FontConfiguration } from '../../../core/abel/FontConfiguration.js';
import type { HColorSimple } from '../../../core/klimt/color/HColorSimple.js';
import { Back } from '../../../core/klimt/Back.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import { bridgeFontConfiguration } from '../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { Fore } from '../../../core/klimt/Fore.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { atomOpsFor } from '../SaltDictionary.js';
import { AbstractElement } from './AbstractElement.js';

/** The entry text that measures as a separator. @see ElementMenuEntry.java:64 */
const SEPARATOR = '-';
/** A separator's width. @see ElementMenuEntry.java:65 */
const SEPARATOR_WIDTH = 10;
/** A separator's height. @see ElementMenuEntry.java:65 */
const SEPARATOR_HEIGHT = 5;

/**
 * ElementMenuEntry — one menu-bar or popup entry: a creole text, an optional
 * background and the x its bar placed it at (`setX`, read back when the bar
 * draws its popups).
 *
 * The background is typed `HColorSimple` (upstream: `HColor`), the class
 * `AbstractElement#getColorBB` builds, so it can be painted
 * (`HColorSimple#asPaint`) where upstream applies `background.bg()`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementMenuEntry.java:50-98
 */
export class ElementMenuEntry extends AbstractElement {
  /** @see ElementMenuEntry.java:52 */
  private readonly block: TextBlock;
  /** @see ElementMenuEntry.java:53 */
  private readonly text: string;
  /** @see ElementMenuEntry.java:54 */
  private background: HColorSimple | undefined;
  /** @see ElementMenuEntry.java:55 */
  private xxx = 0;

  /**
   * `FontConfiguration.blackBlueTrue(font)` (`abel/FontConfiguration.ts`),
   * bridged to the creole `FontConfiguration` and given ADR-9's `atomOps`,
   * as in `ElementText`.
   *
   * @see ElementMenuEntry.java:57-61
   */
  constructor(text: string, font: UFont, spriteContainer: ISkinSimple) {
    super();
    const config = bridgeFontConfiguration(FontConfiguration.blackBlueTrue(font));
    const ctx = { fontConfiguration: config, spriteContainer, atomOps: atomOpsFor(spriteContainer, config) };
    this.block = Display.create(text).create(ctx, HorizontalAlignment.LEFT);
    this.text = text;
  }

  /** @see ElementMenuEntry.java:63-68 */
  getPreferredDimension(stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    if (this.text === SEPARATOR) {
      return new XDimension2D(SEPARATOR_WIDTH, SEPARATOR_HEIGHT);
    }
    return this.block.calculateDimension(stringBounder);
  }

  /** Draws at every z-index (no zIndex test upstream). @see ElementMenuEntry.java:70-77 */
  drawU(ug: UGraphic, _zIndex: number, _dimToUse: XDimension2D): void {
    ug = ug.apply(new Fore(this.getBlack().asPaint()));
    if (this.background !== undefined) {
      const dim = this.getPreferredDimension(ug.getStringBounder(), 0, 0);
      ug.apply(new Back(this.background.asPaint())).draw(URectangle.build(dim.getWidth(), dim.getHeight()));
    }
    this.block.drawU(ug);
  }

  /** @see ElementMenuEntry.java:79-81 */
  getX(): number {
    return this.xxx;
  }

  /** @see ElementMenuEntry.java:83-85 */
  setX(x: number): void {
    this.xxx = x;
  }

  /** @see ElementMenuEntry.java:87-89 */
  getText(): string {
    return this.text;
  }

  /** @see ElementMenuEntry.java:91-93 */
  getBackground(): HColorSimple | undefined {
    return this.background;
  }

  /** @see ElementMenuEntry.java:95-97 */
  setBackground(background: HColorSimple): void {
    this.background = background;
  }
}
