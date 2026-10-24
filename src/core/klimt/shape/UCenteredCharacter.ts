import type { UShape } from '../UShape.js';
import type { UFont } from '../font/UFont.js';

/**
 * UCenteredCharacter — one glyph centred on the current translate, drawn by
 * `DriverCenteredCharacterSvg`. Immutable.
 *
 * `c` is a one-character string (upstream's `char`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UCenteredCharacter.java:41-60
 */
export class UCenteredCharacter implements UShape {
  /** @see UCenteredCharacter.java:44-50 */
  constructor(
    private readonly c: string,
    private readonly font: UFont,
  ) {}

  /** @see UCenteredCharacter.java:52-54 */
  getChar(): string {
    return this.c;
  }

  /** @see UCenteredCharacter.java:56-58 */
  getFont(): UFont {
    return this.font;
  }
}
