/**
 * `CharClassRaw` -- the raw (un-negated) character classes of ubrex. Singleton
 * instances (Java enum with a per-constant `internalMatches` body).
 *
 * JDK predicates, per `java.lang.Character` javadoc (a `char` is one UTF-16
 * code unit; surrogates are never letters/digits):
 * - `isLetter`: general category UPPERCASE_LETTER, LOWERCASE_LETTER,
 *   TITLECASE_LETTER, MODIFIER_LETTER or OTHER_LETTER = `\p{L}`.
 * - `isDigit`: DECIMAL_DIGIT_NUMBER = `\p{Nd}`.
 * - `isLetterOrDigit`: `isLetter || isDigit`.
 * (Unicode data is the host's, not the JDK's; they agree on every assigned
 * pre-Unicode-15 char.)
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClassRaw.java
 */
import type { TextNavigator } from './TextNavigator.js';

const LETTER_RE = /^\p{L}$/u;
const DIGIT_RE = /^\p{Nd}$/u;

/** `Character.isLetter(char)`. */
export function isLetter(ch: string): boolean {
  return LETTER_RE.test(ch);
}

/** `Character.isLetterOrDigit(char)`. */
export function isLetterOrDigit(ch: string): boolean {
  return LETTER_RE.test(ch) || DIGIT_RE.test(ch);
}

export class CharClassRaw {
  public static readonly ANY: CharClassRaw = new CharClassRaw('ANY', '.', () => true);
  public static readonly SPACE: CharClassRaw = new CharClassRaw('SPACE', 's', (ch) => ch === ' ');
  public static readonly GUILLEMET: CharClassRaw = new CharClassRaw(
    'GUILLEMET',
    'g',
    (ch) => ch === '"' || ch === '“' || ch === '”',
  );
  public static readonly WORD: CharClassRaw = new CharClassRaw(
    'WORD',
    'w',
    (ch) => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_',
  );
  public static readonly DIGIT: CharClassRaw = new CharClassRaw(
    'DIGIT',
    'd',
    (ch) => (ch >= '0' && ch <= '9') || ch === '_',
  );
  public static readonly ALPHA_NUMERIC: CharClassRaw = new CharClassRaw('ALPHA_NUMERIC', 'an', isLetterOrDigit);
  public static readonly LETTER: CharClassRaw = new CharClassRaw('LETTER', 'le', isLetter);

  readonly #name: string;
  readonly #syntax: string;
  readonly #matcher: (ch: string) => boolean;

  private constructor(name: string, syntax: string, matcher: (ch: string) => boolean) {
    this.#name = name;
    this.#syntax = syntax;
    this.#matcher = matcher;
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** Package-private upstream (`abstract boolean internalMatches(char)`). */
  public internalMatches(ch: string): boolean {
    return this.#matcher(ch);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClassRaw.java */
  public getDefinitionLength(): number {
    return this.#syntax.length;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClassRaw.java */
  public static fromDefinition(nav: TextNavigator): CharClassRaw {
    const ch = nav.charAt(0);
    switch (ch) {
      case 'S':
      case 's':
        return CharClassRaw.SPACE;
      case 'G':
      case 'g':
        return CharClassRaw.GUILLEMET;
      case 'D':
      case 'd':
        return CharClassRaw.DIGIT;
      case 'W':
      case 'w':
        return CharClassRaw.WORD;
      case 'A':
      case 'a':
        // Not finished because we don't test the "n" (upstream comment)
        return CharClassRaw.ALPHA_NUMERIC;
      case 'L':
      case 'l':
        // Not finished because we don't test the "e" (upstream comment)
        return CharClassRaw.LETTER;
      case '.':
        return CharClassRaw.ANY;
      default:
        throw new Error('wip01class ' + ch);
    }
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CharClassRaw.java */
  public static internalMatchesAny(set: ReadonlySet<CharClassRaw>, ch: string): boolean {
    for (const charClass of set) if (charClass.internalMatches(ch)) return true;
    return false;
  }
}
