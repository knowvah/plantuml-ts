/**
 * `ChallengeSingleChar` -- one literal char, ASCII case-insensitive.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeSingleChar.java
 */
import { CaseMode, ensureLowercase } from './CaseMode.js';
import type { Challenge } from './Challenge.js';
import { ChallengeResult } from './ChallengeResult.js';
import type { TextNavigator } from './TextNavigator.js';

/** The reserved ubrex operator chars rejected by the constructor (~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeSingleChar.java). */
const RESERVED_CHARS: ReadonlySet<string> = new Set([
  '┇',
  '〴',
  '「',
  '」',
  '〤',
  '〜',
  '〇',
  '〄',
  '〶',
  '〘',
  '〙',
  '【',
  '】',
]);

export class ChallengeSingleChar implements Challenge {
  private readonly mode: CaseMode = CaseMode.CASE_INSENSITIVE;
  private readonly ch: string;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeSingleChar.java */
  public constructor(chIn: string) {
    let ch = chIn;
    if (RESERVED_CHARS.has(ch)) throw new Error('IllegalArgumentException');
    if (this.mode === CaseMode.CASE_INSENSITIVE) ch = ensureLowercase(ch);
    this.ch = ch;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeSingleChar.java */
  public toString(): string {
    return '[' + this.ch + ']';
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/ChallengeSingleChar.java */
  public runChallenge(string: TextNavigator, position: number): ChallengeResult {
    if (string.length() === position) return ChallengeResult.NO_MATCH;
    let extract = string.charAt(position);
    if (this.mode === CaseMode.CASE_INSENSITIVE) extract = ensureLowercase(extract);
    if (extract === this.ch) return ChallengeResult.ONE;
    return ChallengeResult.NO_MATCH;
  }
}
