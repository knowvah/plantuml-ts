/**
 * `CharClass` -- a raw class plus NORMAL/NEGATIVE polarity.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClass.java
 */
import { CharClassRaw } from './CharClassRaw.js';
import { CharClassType } from './CharClassType.js';
import type { TextNavigator } from './TextNavigator.js';

const UPPERCASE_RE = /^\p{Uppercase}$/u;

export class CharClass {
  private readonly charClassRaw: CharClassRaw;
  private readonly type: CharClassType;

  public constructor(charClassRaw: CharClassRaw, type: CharClassType) {
    this.charClassRaw = charClassRaw;
    this.type = type;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClass.java */
  public matches(ch: string): boolean {
    const rawMatch = this.charClassRaw.internalMatches(ch);
    if (this.type === CharClassType.NORMAL) return rawMatch;
    return !rawMatch;
  }

  /**
   * `Character.isUpperCase(char)` = UPPERCASE_LETTER or Other_Uppercase =
   * `\p{Uppercase}`.
   *
   * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClass.java
   */
  public static fromDefinition(nav: TextNavigator): CharClass {
    const type = UPPERCASE_RE.test(nav.charAt(0)) ? CharClassType.NEGATIVE : CharClassType.NORMAL;
    const raw = CharClassRaw.fromDefinition(nav);
    return new CharClass(raw, type);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClass.java */
  public name(): string {
    return this.charClassRaw.name() + '-' + this.type;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClass.java */
  public getDefinitionLength(): number {
    return this.charClassRaw.getDefinitionLength();
  }
}
