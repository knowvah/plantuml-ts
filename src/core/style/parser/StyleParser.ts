import type { AutomaticCounter } from '../AutomaticCounter.js';
import { AutomaticCounterBasic } from '../AutomaticCounterBasic.js';
import { getFromName } from '../PName.js';
import { Style } from '../Style.js';
import { StyleSignatureBasic } from '../StyleSignatureBasic.js';
import { ValueImpl } from '../ValueImpl.js';
import { Context } from './Context.js';
import { CssVariables } from './CssVariables.js';
import { StyleScheme } from './StyleScheme.js';

/**
 * `StyleParsingException` — a style text the parser rejects.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/StyleParsingException.java:38-44
 */
export class StyleParsingException extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'StyleParsingException';
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/StyleTokenType.java:38-47 */
const StyleTokenType = {
  OPEN_BRACKET: 'OPEN_BRACKET',
  CLOSE_BRACKET: 'CLOSE_BRACKET',
  STRING: 'STRING',
  COMMA: 'COMMA',
  STAR: 'STAR',
  NEWLINE: 'NEWLINE',
  SEMICOLON: 'SEMICOLON',
  COLON: 'COLON',
  AROBASE_MEDIA: 'AROBASE_MEDIA',
} as const;

type StyleTokenType = (typeof StyleTokenType)[keyof typeof StyleTokenType];

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/StyleToken.java:38-61 */
class StyleToken {
  constructor(
    readonly type: StyleTokenType,
    readonly data: string,
  ) {}

  /** @see StyleToken.java:48-51 */
  toString(): string {
    return `${this.type}[${this.data}]`;
  }
}

/** `CharInspector`'s end sentinel: `'\0'`. @see CharInspectorImpl.java:54-56 */
const NUL = '\0';

/** `StringUtils.trin`: strip every char `<= ' '` from both ends. @see StringUtils.java:505-533 */
export function trin(arg: string): string {
  let start = 0;
  let end = arg.length - 1;
  while (start <= end && arg.charCodeAt(start) <= 32) start++;
  while (end >= start && arg.charCodeAt(end) <= 32) end--;
  return arg.substring(start, end + 1);
}

/**
 * `CharInspectorImpl` over `BlocLines`: each line trimmed (`getTrimmed`),
 * `'\n'` appended when `insertNewlines`; empty lines are skipped on `jump`.
 * Mutable cursor.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/CharInspectorImpl.java:38-83
 */
class CharInspectorImpl {
  private line = 0;
  private pos = 0;

  constructor(
    private readonly data: readonly string[],
    private readonly insertNewlines: boolean,
  ) {}

  /** @see CharInspectorImpl.java:50-58 */
  peek(ahead: number): string {
    if (this.line === -1) return NUL;
    const currentLine = this.getCurrentLine();
    if (this.pos + ahead >= currentLine.length) return NUL;
    return currentLine.charAt(this.pos + ahead);
  }

  /** @see CharInspectorImpl.java:60-64 */
  private getCurrentLine(): string {
    const trimmed = trin(this.data[this.line]!);
    return this.insertNewlines ? `${trimmed}\n` : trimmed;
  }

  /** @see CharInspectorImpl.java:66-80 */
  jump(): void {
    if (this.line === -1) throw new Error('IllegalStateException');
    this.pos++;
    if (this.pos >= this.getCurrentLine().length) {
      this.line++;
      this.pos = 0;
    }
    while (this.line < this.data.length && this.getCurrentLine().length === 0) this.line++;
    if (this.line >= this.data.length) this.line = -1;
  }
}

/** `PeekerUtils.peeker(list)`: `undefined` past the end. @see PeekerUtils.java:47-68 */
class Peeker {
  private pos = 0;

  constructor(private readonly list: readonly StyleToken[]) {}

  peek(ahead: number): StyleToken | undefined {
    return this.list[this.pos + ahead];
  }

  jump(): void {
    this.pos++;
  }
}

/** `peeker.peek(n).getType()`: upstream dereferences without a null check. */
function typeAt(peeker: Peeker, ahead: number): StyleTokenType {
  const token = peeker.peek(ahead);
  if (token === undefined) throw new Error('NullPointerException');
  return token.type;
}

/** The one-char tokens of `parse(CharInspector)`. @see StyleParser.java:245-266 */
const SINGLE_CHAR_TOKENS: ReadonlyMap<string, StyleToken> = new Map([
  [',', new StyleToken(StyleTokenType.COMMA, ',')],
  [';', new StyleToken(StyleTokenType.SEMICOLON, ';')],
  ['\n', new StyleToken(StyleTokenType.NEWLINE, 'NEWLINE')],
  ['\r', new StyleToken(StyleTokenType.NEWLINE, 'NEWLINE')],
  ['*', new StyleToken(StyleTokenType.STAR, StyleSignatureBasic.STAR)],
  [':', new StyleToken(StyleTokenType.COLON, ':')],
  ['{', new StyleToken(StyleTokenType.OPEN_BRACKET, '{')],
  ['}', new StyleToken(StyleTokenType.CLOSE_BRACKET, '}')],
]);

/** Chars that end an unquoted string (besides `' '`). @see StyleParser.java:343-344 */
const STRING_BREAKS = new Set(['\n', '\r', '{', '}', ';', ',', ':', '\t']);

/**
 * StyleParser — the CSS-like `<style>` / `.skin` grammar: a tokenizer
 * (`parse(CharInspector)`) and a selector/value reader (`parseNow`) that
 * turns every closed block into `Style`s (via `Context.toStyles`), each
 * value taking the next priority from the counter.
 *
 * Mutable, as upstream: the css variables, the scheme (`@media` switches
 * to DARK for the REST of the text, never back) and the open context
 * persist across `parse` calls on one instance.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/parser/StyleParser.java:58-361
 */
export class StyleParser {
  /** @see StyleParser.java:60 */
  private readonly variables = new CssVariables();
  /** @see StyleParser.java:61 */
  private scheme: StyleScheme = StyleScheme.REGULAR;
  /** @see StyleParser.java:62 */
  private context = Context.empty();

  /** @see StyleParser.java:65-71 */
  constructor(private readonly counter: AutomaticCounter = new AutomaticCounterBasic()) {}

  /** One line, no inserted newlines; its values on an empty signature. @see StyleParser.java:73-77 */
  parseSingleLine(s: string): Style {
    const tokens = this.tokenize(new CharInspectorImpl([s], false));
    this.parseNow(tokens);
    return new Style(StyleSignatureBasic.empty(), this.context.getInternalMap());
  }

  /** `parse(BlocLines)`: the lines are a `BlocLines`' strings. @see StyleParser.java:79-86 */
  parse(lines: readonly string[]): Style[] {
    if (lines.length === 0) return [];
    return this.parseNow(this.tokenize(new CharInspectorImpl(lines, true)));
  }

  /** @see StyleParser.java:88-176 */
  private parseNow(tokens: readonly StyleToken[]): Style[] {
    const result: Style[] = [];
    for (const peeker = new Peeker(tokens); peeker.peek(0) !== undefined;) {
      const token = peeker.peek(0)!;
      peeker.jump();
      if (this.isSkipped(token)) continue;

      if (typeAt(peeker, 0) === StyleTokenType.COMMA) this.pushWithComma(token, peeker);
      else if (token.type === StyleTokenType.STRING) this.parseStringToken(token, peeker);
      else if (token.type === StyleTokenType.CLOSE_BRACKET) this.closeContext(result);
      else if (token.type === StyleTokenType.AROBASE_MEDIA) this.scheme = StyleScheme.DARK;
      else if (!this.pushColonSelector(token, peeker)) {
        if (token.type === StyleTokenType.OPEN_BRACKET) throw new StyleParsingException('Invalid open bracket');
        throw new Error(`IllegalStateException: ${token.toString()}`);
      }
    }
    return result;
  }

  /** NEWLINE, SEMICOLON, and the `<style>` / `</style>` strings. @see StyleParser.java:93-99 */
  private isSkipped(token: StyleToken): boolean {
    if (token.type === StyleTokenType.NEWLINE || token.type === StyleTokenType.SEMICOLON) return true;
    if (token.type !== StyleTokenType.STRING) return false;
    const lower = token.data.toLowerCase();
    return lower === '<style>' || lower === '</style>';
  }

  /** `a, b {`: one context over the joined selectors. @see StyleParser.java:101-109 */
  private pushWithComma(token: StyleToken, peeker: Peeker): void {
    const full = token.data + this.readWithComma(peeker);
    this.skipNewLines(peeker);
    if (typeAt(peeker, 0) !== StyleTokenType.OPEN_BRACKET) throw new Error('IllegalStateException');
    this.context = this.context.push(full);
    peeker.jump();
  }

  /** A selector (`name [*] {`), a css variable, or a `key value`. @see StyleParser.java:110-142 */
  private parseStringToken(token: StyleToken, peeker: Peeker): void {
    let full = token.data;
    if (typeAt(peeker, 0) === StyleTokenType.STAR) {
      peeker.jump();
      full += StyleSignatureBasic.STAR;
    }
    this.skipNewLines(peeker);
    if (typeAt(peeker, 0) === StyleTokenType.OPEN_BRACKET) {
      this.context = this.context.push(full);
      peeker.jump();
      return;
    }
    this.skipColon(peeker);
    if (token.data.startsWith('--')) this.variables.learn(token.data, this.readValue(peeker));
    else if (typeAt(peeker, 0) === StyleTokenType.STRING) this.putValue(token.data, this.readValue(peeker));
    else throw new StyleParsingException('parsing');
  }

  /** An unknown key consumes no priority. @see StyleParser.java:126-137 */
  private putValue(keyString: string, readValue: string): void {
    const valueString = this.variables.value(readValue);
    const key = getFromName(keyString, this.scheme);
    if (key === undefined) return;
    const value =
      this.scheme === StyleScheme.REGULAR
        ? ValueImpl.regular(valueString, this.counter)
        : ValueImpl.dark(valueString, this.counter);
    this.context.putInContext(key, value);
  }

  /** `}`: emit the context's styles, then pop unless it is the root. @see StyleParser.java:143-148 */
  private closeContext(result: Style[]): void {
    for (const st of this.context.toStyles()) result.push(st);
    if (!this.context.isEmpty()) this.context = this.context.pop();
  }

  /** `:name {` and `:name * {` (`:depth(n)`). @see StyleParser.java:153-169 */
  private pushColonSelector(token: StyleToken, peeker: Peeker): boolean {
    if (token.type !== StyleTokenType.COLON || typeAt(peeker, 0) !== StyleTokenType.STRING) return false;
    if (typeAt(peeker, 1) === StyleTokenType.OPEN_BRACKET) {
      this.context = this.context.push(token.data + peeker.peek(0)!.data);
      peeker.jump();
      peeker.jump();
      return true;
    }
    if (typeAt(peeker, 1) === StyleTokenType.STAR && typeAt(peeker, 2) === StyleTokenType.OPEN_BRACKET) {
      this.context = this.context.push(token.data + peeker.peek(0)!.data + peeker.peek(1)!.data);
      peeker.jump();
      peeker.jump();
      peeker.jump();
      return true;
    }
    return false;
  }

  /** @see StyleParser.java:178-188 */
  private readWithComma(ins: Peeker): string {
    let result = '';
    for (let current = ins.peek(0); current !== undefined; current = ins.peek(0)) {
      if (current.type !== StyleTokenType.STRING && current.type !== StyleTokenType.COMMA) return result;
      result += current.data;
      ins.jump();
    }
    return result;
  }

  /** STRINGs joined by one space; `,` and `:x` appended bare. @see StyleParser.java:190-226 */
  private readValue(ins: Peeker): string {
    let result = '';
    for (let current = ins.peek(0); current !== undefined; current = ins.peek(0)) {
      const type = current.type;
      if (type === StyleTokenType.NEWLINE || type === StyleTokenType.SEMICOLON || type === StyleTokenType.CLOSE_BRACKET)
        return result;
      ins.jump();
      if (type === StyleTokenType.STRING) result += (result.length > 0 ? ' ' : '') + current.data;
      else if (type === StyleTokenType.COMMA) result += current.data;
      else if (type === StyleTokenType.COLON) result += current.data + this.readColonTail(ins);
      else throw new StyleParsingException('bad definition');
    }
    return result;
  }

  /** The STRING a value's `:` must be followed by. @see StyleParser.java:213-220 */
  private readColonTail(ins: Peeker): string {
    if (typeAt(ins, 0) !== StyleTokenType.STRING) throw new StyleParsingException('bad definition');
    const data = ins.peek(0)!.data;
    ins.jump();
    return data;
  }

  /** @see StyleParser.java:228-235 */
  private skipNewLines(ins: Peeker): void {
    while (ins.peek(0)?.type === StyleTokenType.NEWLINE) ins.jump();
  }

  /** @see StyleParser.java:237-244 */
  private skipColon(ins: Peeker): void {
    while (ins.peek(0)?.type === StyleTokenType.COLON) ins.jump();
  }

  /** The tokenizer: upstream's private `parse(CharInspector)`. @see StyleParser.java:246-290 */
  private tokenize(ins: CharInspectorImpl): StyleToken[] {
    const result: StyleToken[] = [];
    for (let current = ins.peek(0); current !== NUL; current = ins.peek(0)) {
      if (this.skipBlankOrComment(ins, current)) continue;
      result.push(this.readToken(ins, current));
    }
    return result;
  }

  /** Blanks and the `//`, `/' '/`, `/* *\/` comments. @see StyleParser.java:252-259 */
  private skipBlankOrComment(ins: CharInspectorImpl, current: string): boolean {
    if (current === ' ' || current === '\t') {
      ins.jump();
      return true;
    }
    if (current !== '/') return false;
    const next = ins.peek(1);
    if (next === '/') this.jumpUntil(ins, '\n');
    else if (next === "'") this.jumpUntil(ins, "'", '/');
    else if (next === '*') this.jumpUntil(ins, '*', '/');
    else return false;
    return true;
  }

  /** @see StyleParser.java:260-286 */
  private readToken(ins: CharInspectorImpl, current: string): StyleToken {
    const single = SINGLE_CHAR_TOKENS.get(current);
    if (single !== undefined) {
      ins.jump();
      return single;
    }
    if (current === '@') return new StyleToken(StyleTokenType.AROBASE_MEDIA, this.readArobaseMedia(ins));
    if (current === '"') return new StyleToken(StyleTokenType.STRING, this.readQuotedString(ins));
    return new StyleToken(StyleTokenType.STRING, this.readString(ins));
  }

  /** Both overloads: past `ch1`, or past `ch1 ch2`. @see StyleParser.java:292-312 */
  private jumpUntil(ins: CharInspectorImpl, ch1: string, ch2?: string): void {
    while (ins.peek(0) !== NUL) {
      if (ins.peek(0) === ch1 && (ch2 === undefined || ins.peek(1) === ch2)) {
        ins.jump();
        if (ch2 !== undefined) ins.jump();
        return;
      }
      ins.jump();
    }
  }

  /** `@...` up to and including the first `{`, `}` or `;`. @see StyleParser.java:314-328 */
  private readArobaseMedia(ins: CharInspectorImpl): string {
    if (ins.peek(0) !== '@') throw new Error('IllegalStateException');
    ins.jump();
    let result = '';
    while (ins.peek(0) !== NUL) {
      const ch = ins.peek(0);
      ins.jump();
      if (ch === '{' || ch === '}' || ch === ';') break;
      result += ch;
    }
    return result;
  }

  /** @see StyleParser.java:330-343 */
  private readQuotedString(ins: CharInspectorImpl): string {
    if (ins.peek(0) !== '"') throw new Error('IllegalStateException');
    ins.jump();
    let result = '';
    while (ins.peek(0) !== NUL && ins.peek(0) !== '"') {
      result += ins.peek(0);
      ins.jump();
    }
    if (ins.peek(0) === '"') ins.jump();
    return result;
  }

  /** A `.stereotype` keeps its spaces, then is trimmed. @see StyleParser.java:345-360 */
  private readString(ins: CharInspectorImpl): string {
    let result = '';
    for (let ch = ins.peek(0); ch !== NUL; ch = ins.peek(0)) {
      if (STRING_BREAKS.has(ch)) break;
      if (ch === ' ' && result.charAt(0) !== '.') break;
      ins.jump();
      result += ch;
    }
    if (result.charAt(0) === '.') return trin(result);
    return result;
  }
}

/**
 * `BufferedReader.readLine` over `text`: `\n`, `\r\n` and `\r` end a line;
 * a final terminator adds no empty line; `''` has no line.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/BlocLines.java:108-118
 */
export function readLines(text: string): string[] {
  if (text.length === 0) return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * `new StyleParser(builder).parse(BlocLines.load(text))`: every style the
 * text declares, priorities drawn from `builder`'s counter.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleLoader.java:97-98
 */
export function parseStyles(text: string, builder: AutomaticCounter): Style[] {
  return new StyleParser(builder).parse(readLines(text));
}
