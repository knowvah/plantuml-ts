import { FontConfiguration } from '../../../core/abel/FontConfiguration.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import { bridgeFontConfiguration } from '../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import type { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { atomOpsFor } from '../SaltDictionary.js';
import { AbstractElement } from './AbstractElement.js';

/** The cell text that measures but never draws. @see ElementText.java:60 */
const HIDDEN_TEXT = '.';

/**
 * ElementText — a plain creole text cell. The text `.` keeps its measured
 * size but draws nothing (a grid spacer).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/ElementText.java:50-80
 */
export class ElementText extends AbstractElement {
  /** @see ElementText.java:53 */
  private readonly block: TextBlock;
  /** @see ElementText.java:54 */
  private readonly show: boolean;
  /** @see ElementText.java:55 */
  private readonly text: string;

  /**
   * `FontConfiguration.blackBlueTrue(font)` (`abel/FontConfiguration.ts`),
   * bridged to the creole `FontConfiguration` as in
   * `AbstractElement#blackBlueTrue`; `atomOps` is ADR-9's, as in
   * `AbstractElementText`.
   * `text.get(0)` on an empty list is Java's `IndexOutOfBoundsException`.
   *
   * @see ElementText.java:57-62
   */
  constructor(text: readonly string[], font: UFont, spriteContainer: ISkinSimple) {
    super();
    const config = bridgeFontConfiguration(FontConfiguration.blackBlueTrue(font));
    const ctx = { fontConfiguration: config, spriteContainer, atomOps: atomOpsFor(spriteContainer, config) };
    this.block = Display.create(text).create(ctx, HorizontalAlignment.LEFT);
    const first = text[0];
    if (first === undefined) throw new Error('IndexOutOfBoundsException: Index 0 out of bounds for length 0');
    this.show = first !== HIDDEN_TEXT;
    this.text = first;
  }

  /** @see ElementText.java:64-66 */
  getPreferredDimension(stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    return this.block.calculateDimension(stringBounder);
  }

  /** @see ElementText.java:68-75 */
  drawU(ug: UGraphic, zIndex: number, _dimToUse: XDimension2D | null): void {
    if (zIndex !== 0) {
      return;
    }
    if (this.show) {
      this.block.drawU(ug);
    }
  }

  /** @see ElementText.java:77-79 */
  getText(): string {
    return this.text;
  }
}
