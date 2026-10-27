/**
 * `TextNavigator` -- a mutable window over a char sequence, optionally read
 * backwards (look-behind). Indices are UTF-16 code units, as in Java.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java
 */
import { Challenge } from './Challenge.js';

/** Java `CharSequence`: a string or a `TextNavigator`. */
export type CharSequence = string | TextNavigator;

/** `CharSequence#length()`. */
export function csLength(cs: CharSequence): number {
  return typeof cs === 'string' ? cs.length : cs.length();
}

/** `CharSequence#charAt(int)` (a string char is bounds-checked like Java). */
export function csCharAt(cs: CharSequence, index: number): string {
  if (typeof cs !== 'string') return cs.charAt(index);
  if (index < 0 || index >= cs.length) {
    throw new RangeError('Index ' + index + ' out of bounds for length ' + cs.length);
  }
  return cs.charAt(index);
}

export class TextNavigator {
  private readonly content: CharSequence;
  private p1: number;
  private p2: number;
  private readonly reversed: boolean;

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public static build(content: CharSequence): TextNavigator {
    return new TextNavigator(content, 0, csLength(content), false);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public reverse(pos: number): TextNavigator {
    if (this.reversed) throw new Error('IllegalStateException');
    return new TextNavigator(this.content, 0, this.p1 + pos, true);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public toString(): string {
    const length = this.length();
    let sb = '';
    for (let i = 0; i < length; i++) sb += this.charAt(i);
    return sb;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public copy(): TextNavigator {
    return new TextNavigator(this.content, this.p1, this.p2, this.reversed);
  }

  private constructor(content: CharSequence, p1: number, p2: number, reversed: boolean) {
    if (p2 < p1) throw new Error('IllegalArgumentException');
    this.content = content;
    this.p1 = p1;
    this.p2 = p2;
    this.reversed = reversed;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public indexOf(ch: string): number {
    for (let i = 0; i < this.length(); i++) if (this.charAt(i) === ch) return i;
    return -1;
  }

  /** `CharSequence#subSequence`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public subSequence(beginIndex: number, endIndex: number): TextNavigator {
    if (beginIndex < 0 || endIndex > this.length() || beginIndex > endIndex) {
      throw new RangeError(
        'subSequence(' + beginIndex + ', ' + endIndex + ') out of bounds for length ' + this.length(),
      );
    }
    if (this.reversed) return new TextNavigator(this.content, this.p2 - endIndex, this.p2 - beginIndex, this.reversed);
    return new TextNavigator(this.content, this.p1 + beginIndex, this.p1 + endIndex, this.reversed);
  }

  /** `CharSequence#length()`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public length(): number {
    return this.p2 - this.p1;
  }

  /** `CharSequence#charAt`; throws `RangeError` out of bounds. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public charAt(index: number): string {
    if (index < 0 || index >= this.length()) {
      throw new RangeError('Index ' + index + ' out of bounds for length ' + this.length());
    }
    if (this.reversed) return csCharAt(this.content, this.p2 - index - 1);
    return csCharAt(this.content, this.p1 + index);
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public jump(step: number): void {
    if (this.reversed) this.p2 -= step;
    else this.p1 += step;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public startsWith(searched: string, ahead: number): boolean {
    for (let i = 0; i < searched.length; i++) if (searched.charAt(i) !== this.charAt(ahead + i)) return false;
    return true;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public search(searched: string, ahead: number): number {
    for (let i = ahead; i < this.length() - searched.length + 1; i++) if (this.startsWith(searched, i)) return i;
    return -1;
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/TextNavigator.java */
  public searchPattern(pattern: Challenge, ahead: number): number {
    for (let i = ahead; i < this.length(); i++) if (pattern.runChallenge(this, i).getFullCaptureLength() >= 0) return i;
    return Challenge.NO_MATCH;
  }
}
