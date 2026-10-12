import { trin } from '../../core/style/parser/StyleParser.js';
import type { DataSource } from './DataSource.js';
import { Terminated } from './Terminated.js';
import { Terminator } from './Terminator.js';

/**
 * `Pattern2.cmpile(...)` of the string below. `Pattern2.compileInternal`
 * compiles with `Pattern.CASE_INSENSITIVE` (Pattern2.java:114), hence `i`
 * (jar probe: `{s-` and `{si` split like `{S-`/`{SI`); `transform` is the
 * identity here (no `%pLN|%s|%q|%g`). `g` drives the `find()` loop.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/DataSourceImpl.java:48
 */
const STRUCTURED_BLOCK_START_PATTERN = '\\{(?:[-+^#!*/]|S-|SI|S)?';

/** Private Use Area stand-ins for `\|`, `\{`, `\}`. @see DataSourceImpl.java:62-64 */
const ESCAPED_PIPE = '\uE000';
/** @see DataSourceImpl.java:63 */
const ESCAPED_OPEN = '\uE001';
/** @see DataSourceImpl.java:64 */
const ESCAPED_CLOSE = '\uE002';

/** The `StringTokenizer` delimiters. @see DataSourceImpl.java:74 */
const DELIMITERS = '|}';
/** The column delimiter the tokenizer loop skips. @see DataSourceImpl.java:77 */
const PIPE = '|';
/** `"$$$"`, `toString`'s drained marker. @see DataSourceImpl.java:135 */
const DRAINED = '$$$';

/**
 * `new StringTokenizer(s, delims, true)` drained to a list: maximal runs of
 * non-delimiter chars, and every delimiter char as its own one-char token.
 * With `returnDelims` true, `hasMoreTokens()` is "any char left", i.e. "any
 * token left" here.
 * @see java.util.StringTokenizer (returnDelims = true)
 */
function stringTokenizerReturnDelims(s: string, delims: string): string[] {
  const tokens: string[] = [];
  let pos = 0;
  while (pos < s.length) {
    let end = pos;
    if (delims.includes(s.charAt(pos))) end++;
    else while (end < s.length && !delims.includes(s.charAt(end))) end++;
    tokens.push(s.substring(pos, end));
    pos = end;
  }
  return tokens;
}

/**
 * DataSourceImpl — splits salt body lines into `Terminated<String>` tokens on
 * `|` and `}` and before every structured-block opener (`{`, `{+`, `{#`,
 * `{S-`, …), each tagged `NEWCOL` when more of its line follows, `NEWLINE`
 * when it ends the line. A backslash-escaped `\|`, `\{`, `\}` survives as a
 * literal (DataSourceImpl.java:50-61).
 *
 * `peek`/`next` past the end throw as `ArrayList.get` does
 * (`IndexOutOfBoundsException`, message as the JDK's).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/DataSourceImpl.java:46-138
 */
export class DataSourceImpl implements DataSource {
  /** @see DataSourceImpl.java:66 */
  private i = 0;
  /** @see DataSourceImpl.java:67 */
  private readonly data: Terminated<string>[] = [];

  /** @see DataSourceImpl.java:69-106 */
  constructor(data: readonly string[]) {
    for (const rawLine of data) {
      const s = rawLine
        .replaceAll('\\|', ESCAPED_PIPE)
        .replaceAll('\\{', ESCAPED_OPEN)
        .replaceAll('\\}', ESCAPED_CLOSE);
      const st = stringTokenizerReturnDelims(s, DELIMITERS);
      for (let k = 0; k < st.length; k++) {
        const token = trin(st[k] as string);
        if (token === PIPE) continue;

        const terminator = k + 1 < st.length ? Terminator.NEWCOL : Terminator.NEWLINE;
        this.addToken(token, terminator);
      }
    }
  }

  /**
   * The constructor's per-token body (java:80-103), split out only to keep
   * the constructor inside the complexity limit; statement order unchanged.
   * @see DataSourceImpl.java:80-103
   */
  private addToken(token: string, terminator: Terminator): void {
    const m = new RegExp(STRUCTURED_BLOCK_START_PATTERN, 'gi');
    let found = m.exec(token);
    if (found === null) {
      this.addInternal(token, terminator);
      return;
    }

    let lastStart = 0;
    let end = 0;
    do {
      const start = found.index;
      if (start > lastStart) this.addInternal(token.substring(lastStart, start), Terminator.NEWCOL);

      end = start + found[0].length;
      const t = end === token.length ? terminator : Terminator.NEWCOL;
      this.addInternal(token.substring(start, end), t);
      lastStart = end;
      found = m.exec(token);
    } while (found !== null);

    if (end < token.length) this.addInternal(token.substring(end), terminator);
  }

  /** @see DataSourceImpl.java:108-114 */
  private addInternal(s: string, t: Terminator): void {
    s = trin(s);
    s = s.replaceAll(ESCAPED_PIPE, '|').replaceAll(ESCAPED_OPEN, '{').replaceAll(ESCAPED_CLOSE, '}');
    if (s.length > 0) this.data.push(new Terminated(s, t));
  }

  /** `ArrayList.get` with its bounds check. @see DataSourceImpl.java:117,125 */
  private get(index: number): Terminated<string> {
    const result = this.data[index];
    if (result === undefined)
      throw new Error(`IndexOutOfBoundsException: Index ${index} out of bounds for length ${this.data.length}`);
    return result;
  }

  /** @see DataSourceImpl.java:116-118 */
  peek(nb: number): Terminated<string> {
    return this.get(this.i + nb);
  }

  /** @see DataSourceImpl.java:120-122 */
  hasNext(): boolean {
    return this.i < this.data.length;
  }

  /** @see DataSourceImpl.java:124-128 */
  next(): Terminated<string> {
    const result = this.get(this.i);
    this.i++;
    return result;
  }

  /** @see DataSourceImpl.java:130-132 */
  remove(): void {
    throw new Error('UnsupportedOperationException');
  }

  /**
   * `super.toString() + " " + (hasNext() ? peek(0) : "$$$")`. `Object#toString`
   * is `<class name>@<identity hash>`; the identity hash has no deterministic
   * counterpart, so the simple class name stands for `super.toString()`. No
   * upstream caller reads it.
   * @see DataSourceImpl.java:134-136
   */
  toString(): string {
    return 'DataSourceImpl' + ' ' + (this.hasNext() ? this.peek(0).toString() : DRAINED);
  }
}
