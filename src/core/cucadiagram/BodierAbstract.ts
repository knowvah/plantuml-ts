import type { Entity } from '../abel/Entity.js';
import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import type { FontConfiguration } from '../abel/FontConfiguration.js';
import type { Bodier } from './Bodier.js';

/**
 * BodierAbstract — the shared base of every `Bodier` implementation:
 * owns the mutable `rawBody` line list, the `leaf` back-reference, and
 * the `getBestMatch` scoring used to resolve a member reference (e.g. a
 * Kal arrow target) to its closest raw body line.
 *
 * Upstream: cucadiagram/BodierAbstract.java — ported in full. Java's
 * `List<CharSequence> rawBody` is `string[]` per the `Bodier` interface's
 * T5 translation (`List<CharSequence>` → `readonly string[]`); the
 * class is package-private upstream, exported here because subclasses
 * live in their own modules. `Collections.unmodifiableList` (a live
 * read-only VIEW) → returning the array under a `readonly` type.
 *
 * SI1/T7.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java
 */
export abstract class BodierAbstract implements Bodier {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:47 */
  protected readonly rawBody: string[] = [];
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:48 */
  protected leaf: Entity | undefined;

  abstract getFieldsToDisplay(): Display;
  abstract getMethodsToDisplay(): Display;
  abstract addFieldOrMethod(s: string): boolean;
  abstract getBody(
    skinParam: ISkinParam,
    showMethods: boolean,
    showFields: boolean,
    stereotype: Stereotype | undefined,
    style: Style,
    fontConfiguration: FontConfiguration,
  ): TextBlock | null;
  abstract muteClassToObject(): void;
  abstract hasUrl(): boolean;

  /** `Objects.requireNonNull` → explicit NPE throw (project convention).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:50-53 */
  setLeaf(leaf: Entity): void {
    if (leaf == null) throw new Error('NullPointerException');
    this.leaf = leaf;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:55-58 */
  getRawBody(): readonly string[] {
    return this.rawBody;
  }

  /** `Character.isAlphabetic(c) || Character.isDigit(c) || c == '_'`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:60-62 */
  private static isAlphanum(c: string): boolean {
    return /[\p{Alphabetic}\p{Nd}_]/u.test(c);
  }

  /** `Character.isAlphabetic(c)`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:64-66 */
  private static isOnlyLetter(c: string): boolean {
    return /\p{Alphabetic}/u.test(c);
  }

  /** Upstream returns `null` when `rawBody` is empty (no line ever beats
   *  the `Long.MAX_VALUE` starting score) — `undefined` here.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:68-86 */
  getBestMatch(candidate: string): string | undefined {
    if (candidate == null || candidate.length === 0) throw new Error('candidate must not be empty');

    let best: string | undefined = undefined;
    let bestScore = LONG_MAX_VALUE;
    for (const line of this.rawBody) {
      const score = BodierAbstract.matchScore(line, candidate);
      if (score < bestScore) {
        best = line;
        bestScore = score;
        if (bestScore === 0) return best;
      }
    }

    return best;
  }

  /** Package-private static upstream (unit-tested there); public static
   *  here for the same reason.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:93-127 */
  static matchScore(fullString: string, candidate: string): number {
    if (fullString == null || candidate == null) throw new Error('IllegalArgumentException');
    if (candidate.length === 0) throw new Error('candidate must not be empty');

    const lenFull = fullString.length;
    const lenCand = candidate.length;

    let score = 0;
    for (let i = 0; i <= lenFull - lenCand; i++) {
      if (BodierAbstract.startsWith(fullString, i, candidate)) {
        let separatorSeen = false;
        for (let j = i + lenCand; j < lenFull; j++) {
          const ch = fullString.charAt(j);
          if (separatorSeen === false && BodierAbstract.isAlphanum(ch)) {
            score += WEIGHT_TRAILING_LETTERS;
          } else {
            separatorSeen = true;
            score += WEIGHT_AFTER_SEPARATOR;
          }
        }
        return score;
      }

      const ch = fullString.charAt(i);
      if (BodierAbstract.isOnlyLetter(ch)) score += WEIGHT_BEFORE_MATCH_LETTER_STEP;
      else score += WEIGHT_BEFORE_MATCH_STEP;
    }

    return LONG_MAX_VALUE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:129-150 */
  static startsWith(fullString: string, startIdx: number, candidate: string): boolean {
    if (fullString == null || candidate == null) return false;

    const lenFull = fullString.length;
    const lenCandidate = candidate.length;

    if (lenCandidate === 0) throw new Error('IllegalArgumentException');

    if (startIdx < 0 || startIdx > lenFull) return false;

    if (startIdx + lenCandidate > lenFull) return false;

    for (let i = 0; i < lenCandidate; i++) if (fullString.charAt(startIdx + i) !== candidate.charAt(i)) return false;

    return true;
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierAbstract.java:88-91 */
const WEIGHT_BEFORE_MATCH_STEP = 1;
const WEIGHT_AFTER_SEPARATOR = 1_000;
const WEIGHT_TRAILING_LETTERS = 1_000_000;
const WEIGHT_BEFORE_MATCH_LETTER_STEP = 1_000_000_000;

/** `Long.MAX_VALUE` sentinel — scores here stay far below 2^53 for any
 *  realistic line (≤ ~9e6 chars), so `Number` precision is safe. */
const LONG_MAX_VALUE = Number.MAX_SAFE_INTEGER;
