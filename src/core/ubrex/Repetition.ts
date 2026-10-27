/**
 * `Repetition` -- a `{1;3-5;7+}` repetition spec: a sorted set of exact counts
 * plus an optional open-ended minimum.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Repetition.java
 */
import type { TextNavigator } from './TextNavigator.js';

const INTEGER_MAX_VALUE = 2147483647;
const INTEGER_MIN_VALUE = -2147483648;
const INT_RE = /^[+-]?[0-9]+$/;

/** `Integer.parseInt(String)` (ASCII digits; NumberFormatException -> Error). */
function parseInt32(s: string): number {
  if (!INT_RE.test(s)) throw new Error('For input string: "' + s + '"');
  const n = Number(s);
  if (n > INTEGER_MAX_VALUE || n < INTEGER_MIN_VALUE) throw new Error('For input string: "' + s + '"');
  return n;
}

export class Repetition {
  private readonly values = new Set<number>();
  private minInclusive = INTEGER_MAX_VALUE;

  /** Consumes up to and including the closing `}`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Repetition.java */
  public static parse(input: TextNavigator): Repetition {
    const result = new Repetition();
    let token = '';
    for (;;) {
      const ch = input.charAt(0);
      if (ch === '}') {
        result.addToken(token);
        input.jump(1);
        return result;
      } else if (ch === ';') {
        result.addToken(token);
        token = '';
      } else {
        token += ch;
      }
      input.jump(1);
    }
  }

  private addToken(token: string): void {
    if (token.length === 0) throw new Error('empty repetition token');
    if (token.endsWith('+')) {
      this.minInclusive = parseInt32(token.substring(0, token.length - 1));
    } else if (token.includes('-')) {
      const dash = token.indexOf('-');
      const min = parseInt32(token.substring(0, dash));
      const max = parseInt32(token.substring(dash + 1));
      for (let i = min; i <= max; i++) this.add(i);
    } else {
      this.add(parseInt32(token));
    }
  }

  private add(nb: number): void {
    this.values.add(nb);
  }

  /** `TreeSet#toString`: sorted, `[1, 2]`. @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Repetition.java */
  public toString(): string {
    return '[' + [...this.values].sort((a, b) => a - b).join(', ') + ']';
  }

  /** @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/Repetition.java */
  public match(nb: number): boolean {
    if (nb >= this.minInclusive) return true;
    return this.values.has(nb);
  }
}
