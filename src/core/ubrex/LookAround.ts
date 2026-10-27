/**
 * `LookAround` -- look-ahead / look-behind / end-of-text markers. Singleton
 * instances (Java enum with methods).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/LookAround.java
 */
import type { CharSequence } from './TextNavigator.js';
import { csCharAt } from './TextNavigator.js';

export class LookAround {
  public static readonly LOOK_AHEAD_POSITIVE: LookAround = new LookAround('LOOK_AHEAD_POSITIVE', '=');
  public static readonly LOOK_AHEAD_NEGATIVE: LookAround = new LookAround('LOOK_AHEAD_NEGATIVE', '!');
  public static readonly LOOK_BEHIND_POSITIVE: LookAround = new LookAround('LOOK_BEHIND_POSITIVE', '<=');
  public static readonly LOOK_BEHIND_NEGATIVE: LookAround = new LookAround('LOOK_BEHIND_NEGATIVE', '<!');
  public static readonly END_OF_TEXT: LookAround = new LookAround('END_OF_TEXT', '$');

  readonly #name: string;
  readonly #definition: string;

  private constructor(name: string, definition: string) {
    this.#name = name;
    this.#definition = definition;
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** Returns `undefined` where Java returns null. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/LookAround.java */
  public static from(input: CharSequence): LookAround | undefined {
    const ch0 = csCharAt(input, 0);
    if (ch0 === '$') return LookAround.END_OF_TEXT;
    if (ch0 === '=') return LookAround.LOOK_AHEAD_POSITIVE;
    if (ch0 === '!') return LookAround.LOOK_AHEAD_NEGATIVE;
    if (ch0 === '<') {
      const ch1 = csCharAt(input, 1);
      if (ch1 === '=') return LookAround.LOOK_BEHIND_POSITIVE;
      if (ch1 === '!') return LookAround.LOOK_BEHIND_NEGATIVE;
    }
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/LookAround.java */
  public isLookBehind(): boolean {
    return this === LookAround.LOOK_BEHIND_POSITIVE || this === LookAround.LOOK_BEHIND_NEGATIVE;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/LookAround.java */
  public isLookAhead(): boolean {
    return this === LookAround.LOOK_AHEAD_POSITIVE || this === LookAround.LOOK_AHEAD_NEGATIVE;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/LookAround.java */
  public getDefinitionSize(): number {
    return this.#definition.length;
  }
}
