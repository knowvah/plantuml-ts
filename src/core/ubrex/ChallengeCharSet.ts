/**
 * `ChallengeCharSet` -- one char in (or, with `〤`, not in) a set.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharSet.java
 */
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import { CharClassRaw } from './CharClassRaw.js';
import { CharSet } from './CharSet.js';
import { csLength, csCharAt, TextNavigator } from './TextNavigator.js';
import type { CharSequence } from './TextNavigator.js';

export class ChallengeCharSet implements Challenge {
  /** Java `EnumSet<CharClassRaw>`. */
  private readonly charClasses: Set<CharClassRaw> = new Set<CharClassRaw>();
  private readonly charSet: CharSet = new CharSet();
  private reversed = false;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharSet.java */
  public static build(pattern: CharSequence): ChallengeCharSet {
    if (csLength(pattern) === 0) throw new Error('Empty!');
    if (csCharAt(pattern, csLength(pattern) - 1) === '〜') {
      throw new Error("Range operator '〜' must be followed by a character.");
    }
    const result = new ChallengeCharSet();
    // for (int i = 0; i < pattern.length(); i++) {
    for (const nav = TextNavigator.build(pattern); nav.length() > 0; nav.jump(1)) {
      const ch = nav.charAt(0);
      if (/* i == 0 && */ ch === '〤') {
        result.reversed = true;
        continue;
      }
      if (ch === ' ') continue;
      if (ch === '〴') {
        nav.jump(1);
        const charClass = CharClassRaw.fromDefinition(nav);
        result.charClasses.add(charClass);
        nav.jump(charClass.getDefinitionLength() - 1);
      } else if (nav.length() > 2 && nav.charAt(1) === '〜') {
        nav.jump(2);
        const end = nav.charAt(0);
        result.addRange(ch, end);
      } else if (ch === '〃') {
        result.addChar('"');
      } else if (ch === '∙') {
        result.addChar(' ');
      } else {
        result.addChar(ch);
      }
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharSet.java */
  public addChar(ch: string): void {
    this.charSet.addChar(ch);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharSet.java */
  public addRange(start: string, end: string): void {
    this.charSet.addRange(start, end);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeCharSet.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    if (string.length() === position) return ChallengeResult.NO_MATCH;
    const ch = string.charAt(position);
    if ((this.charSet.contains(ch) || CharClassRaw.internalMatchesAny(this.charClasses, ch)) !== this.reversed) {
      return ChallengeResult.ONE;
    }
    return ChallengeResult.NO_MATCH;
  }
}
