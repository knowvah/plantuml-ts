import { Display } from '../../../core/klimt/creole/Display.js';
import { Splitter } from '../../../core/klimt/creole/command/Splitter.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import type { FontConfiguration } from '../../../core/klimt/shape/UText.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { trin } from '../../../core/style/parser/StyleParser.js';
import type { ISkinSimple } from '../../../core/style/ISkinSimple.js';
import { atomOpsFor } from '../SaltDictionary.js';
import { AbstractElement } from './AbstractElement.js';

/** `<&name>` — an OpenIconic glyph counts as two characters.
 *  @see AbstractElementText.java:69 */
const OPEN_ICONIC_TAG = /<&[-\w]+>/g;
/** @see AbstractElementText.java:69 */
const OPEN_ICONIC_CHARS = '00';
/** `getSingleSpace`'s fixed answer (the commented-out glyph scan above it is
 *  dead upstream). @see AbstractElementText.java:95-109 */
const SINGLE_SPACE = 8;

/**
 * AbstractElementText — a widget built around one creole text block in
 * black ink. With `manageLength` the widget reserves `SINGLE_SPACE` per
 * source character (trailing blanks included) and draws the trimmed text.
 *
 * Package-private upstream; exported because each widget is its own module.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/AbstractElementText.java:51-115
 */
export abstract class AbstractElementText extends AbstractElement {
  /** @see AbstractElementText.java:53 */
  private readonly block: TextBlock;
  /** @see AbstractElementText.java:54 */
  private readonly config: FontConfiguration;
  /** @see AbstractElementText.java:55 */
  private readonly charLength: number;

  /**
   * `atomOps` is the port's creole capability bundle (ADR-9), read off the
   * dictionary `spriteContainer` always is (see `SaltDictionary.ts#atomOpsFor`).
   *
   * @see AbstractElementText.java:57-66
   */
  constructor(text: string, font: UFont, manageLength: boolean, spriteContainer: ISkinSimple) {
    super();
    this.config = this.blackBlueTrue(font);
    if (manageLength) {
      this.charLength = this.getCharNumber(text);
      text = trin(text);
    } else {
      this.charLength = 0;
    }
    const ctx = { fontConfiguration: this.config, spriteContainer, atomOps: atomOpsFor(spriteContainer, this.config) };
    this.block = Display.create(text).create(ctx, HorizontalAlignment.LEFT);
  }

  /** @see AbstractElementText.java:68-72 */
  private getCharNumber(text: string): number {
    text = text.replaceAll(OPEN_ICONIC_TAG, OPEN_ICONIC_CHARS);
    text = Splitter.purgeAllTag(text);
    return text.length;
  }

  /** @see AbstractElementText.java:74-76 */
  protected drawText(ug: UGraphic, x: number, y: number): void {
    this.block.drawU(ug.apply(new UTranslate(x, y)));
  }

  /** @see AbstractElementText.java:78-80 */
  protected getPureTextDimension(stringBounder: StringBounder): XDimension2D {
    return this.block.calculateDimension(stringBounder);
  }

  /** @see AbstractElementText.java:82-93 */
  protected getTextDimensionAt(stringBounder: StringBounder, _x: number): XDimension2D {
    const result = this.block.calculateDimension(stringBounder);
    if (this.charLength === 0) {
      return result;
    }
    const dimSpace = this.getSingleSpace(stringBounder);
    return new XDimension2D(Math.max(result.getWidth(), this.charLength * dimSpace), result.getHeight());
  }

  /** @see AbstractElementText.java:95-109 */
  private getSingleSpace(_stringBounder: StringBounder): number {
    return SINGLE_SPACE;
  }

  /** @see AbstractElementText.java:111-113 */
  protected getConfig(): FontConfiguration {
    return this.config;
  }
}
