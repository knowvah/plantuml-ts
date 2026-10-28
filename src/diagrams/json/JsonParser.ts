/**
 * A port of minimal-json's `JsonParser` driving `Json.DefaultHandler`: a
 * strict JSON reader, plus the one extension PlantUML added -- `//` comments
 * between object members. Replaces the `jsonc-parser` call this port used,
 * which accepted trailing commas, comments anywhere and parsed numbers to
 * IEEE doubles (the jar rejects the first, keeps the number's text and
 * confines the second).
 *
 * The streaming `JsonHandler` events collapse into return values: `readValue`
 * returns what `DefaultHandler#value` ends up holding after each `end*` event
 * (`Json.java:379-428`) -- an object `add`s every member in source order,
 * duplicates included (`endObjectValue`, `Json.java:377-378`).
 *
 * `Reader`/`buffer` bookkeeping (`read()`, `startCapture`, `pauseCapture`,
 * `endCapture`, `bufferOffset`, `fill`) exists only to stream a `Reader`; over
 * a string it reduces to an index, so {@link JsonParser#current} reads
 * `text.charAt(index)` and yields {@link END_OF_TEXT} past the end exactly as
 * `read()` does at `JsonParser.java:447-452`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/JsonParser.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/Json.java
 */
import { JsonNumber } from './JsonNumber.js';
import { JsonObject } from './JsonObject.js';

/** `JsonParser.java:36`. */
const END_OF_TEXT = '\u0003';
/** `JsonParser.java:38`. */
const MAX_NESTING_LEVEL = 1000;
/** `JsonParser#isWhiteSpace` (`JsonParser.java:524-526`). */
const WHITESPACE = new Set([' ', '\t', '\n', '\r']);
/** `JsonParser#readEscape` single-character escapes (`JsonParser.java:333-358`). */
const SIMPLE_ESCAPES: Readonly<Record<string, string>> = {
  '"': '"',
  '/': '/',
  '\\': '\\',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};
const HEX_DIGITS = /^[0-9a-fA-F]$/u;
/** `JsonParser#readString` rejects a raw control character (`:319-320`). */
const FIRST_PRINTABLE = 0x20;
const UNICODE_ESCAPE_LENGTH = 4;
const HEX_RADIX = 16;
/** Literal tails `readNull`/`readTrue`/`readFalse` demand char by char. */
const NULL_TAIL = 'ull';
const TRUE_TAIL = 'rue';
const FALSE_TAIL = 'alse';

/**
 * `ParseException` (`ParseException.java`): the one failure `Json.parse`
 * reports. `JsonDiagramFactory` catches exactly this and draws the "does not
 * sound like JSON" page (`JsonDiagramFactory.java:93-96`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/ParseException.java
 */
export class ParseException extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(`${message} at offset ${offset}`);
    this.name = 'ParseException';
  }
}

/**
 * `Json.DefaultHandler#endNumber` builds `new JsonNumber(string)`
 * (`Json.java:403-405`). A literal whose `String(Number(literal))` is the
 * literal itself is held as that `number` (its display is the same text);
 * any other -- `1e10`, `-12.5e3`, `12345678901234567890`, `-0` -- keeps its
 * text in a {@link JsonNumber}.
 */
function numberValue(literal: string): number | JsonNumber {
  const parsed = Number(literal);
  return String(parsed) === literal ? parsed : new JsonNumber(literal);
}

class JsonParser {
  private index = 0;
  private nestingLevel = 0;

  constructor(private readonly text: string) {}

  /** `JsonParser#parse(Reader, int)` (`JsonParser.java:125-146`). */
  parse(): unknown {
    this.skipWhiteSpace();
    const value = this.readValue();
    this.skipWhiteSpace();
    if (!this.isEndOfText()) throw this.error('Unexpected character');
    return value;
  }

  private get current(): string {
    return this.index < this.text.length ? this.text.charAt(this.index) : END_OF_TEXT;
  }

  private read(): void {
    this.index++;
  }

  /** `JsonParser#readValue` (`:148-185`). */
  private readValue(): unknown {
    const c = this.current;
    if (c === 'n') return this.readLiteral(NULL_TAIL, null);
    if (c === 't') return this.readLiteral(TRUE_TAIL, true);
    if (c === 'f') return this.readLiteral(FALSE_TAIL, false);
    if (c === '"') return this.readStringInternal();
    if (c === '[') return this.readArray();
    if (c === '{') return this.readObject();
    if (c === '-' || (c >= '0' && c <= '9')) return this.readNumber();
    throw this.expected('value');
  }

  /** `JsonParser#readArray` (`:187-212`). */
  private readArray(): unknown[] {
    const array: unknown[] = [];
    this.read();
    this.enter();
    this.skipWhiteSpace();
    if (this.readChar(']')) {
      this.nestingLevel--;
      return array;
    }
    do {
      this.skipWhiteSpace();
      array.push(this.readValue());
      this.skipWhiteSpace();
    } while (this.readChar(','));
    if (!this.readChar(']')) throw this.expected("',' or ']'");
    this.nestingLevel--;
    return array;
  }

  /** `JsonParser#readObject` (`:214-252`). */
  private readObject(): JsonObject {
    const object = new JsonObject();
    this.read();
    this.enter();
    this.skipWhiteSpace();
    if (this.readChar('}')) {
      this.nestingLevel--;
      return object;
    }
    do {
      this.skipWhiteSpace();
      if (this.readChar('/')) this.skipComment();
      const name = this.readName();
      this.skipWhiteSpace();
      if (!this.readChar(':')) throw this.expected("':'");
      this.skipWhiteSpace();
      object.add(name, this.readValue());
      this.skipWhiteSpace();
      if (this.readChar('/')) this.skipComment();
    } while (this.readChar(','));
    if (!this.readChar('}')) throw this.expected("',' or '}'");
    this.nestingLevel--;
    return object;
  }

  /** The `++nestingLevel > MAX_NESTING_LEVEL` guard (`:190-192`, `:217-219`). */
  private enter(): void {
    if (++this.nestingLevel > MAX_NESTING_LEVEL) throw this.error('Nesting too deep');
  }

  /**
   * `JsonParser#skipComment` (`:254-263`): the first `/` is already consumed
   * by the caller; a second one is required, then the rest of the line goes.
   * Upstream loops on `current` until a line break, which past the end of the
   * text re-reads stale buffer; the factory always terminates the payload with
   * a newline (`JsonDiagramFactory.java:90-91`), so that is unreachable and
   * the end of text is a plain parse failure here.
   */
  private skipComment(): void {
    if (!this.readChar('/')) throw this.expected('Error in comment');
    while (this.current !== '\n' && this.current !== '\r') {
      if (this.isEndOfText()) throw this.expected('end of comment');
      this.read();
    }
    this.skipWhiteSpace();
  }

  /** `JsonParser#readName` (`:265-270`). */
  private readName(): string {
    if (this.current !== '"') throw this.expected('name');
    return this.readStringInternal();
  }

  /** `readNull`/`readTrue`/`readFalse` (`:272-299`): the lead char is current. */
  private readLiteral(tail: string, value: null | boolean): null | boolean {
    this.read();
    for (const ch of tail) this.readRequiredChar(ch);
    return value;
  }

  private readRequiredChar(ch: string): void {
    if (!this.readChar(ch)) throw this.expected(`'${ch}'`);
  }

  /** `JsonParser#readStringInternal` (`:311-328`). */
  private readStringInternal(): string {
    this.read();
    let captured = '';
    while (this.current !== '"') {
      if (this.current === '\\') {
        captured += this.readEscape();
      } else if (this.current.charCodeAt(0) < FIRST_PRINTABLE) {
        throw this.expected('valid string character');
      } else {
        captured += this.current;
        this.read();
      }
    }
    this.read();
    return captured;
  }

  /** `JsonParser#readEscape` (`:330-368`); consumes the backslash and the escape. */
  private readEscape(): string {
    this.read();
    const c = this.current;
    const simple = SIMPLE_ESCAPES[c];
    if (simple !== undefined) {
      this.read();
      return simple;
    }
    if (c !== 'u') throw this.expected('valid escape sequence');
    let hex = '';
    for (let i = 0; i < UNICODE_ESCAPE_LENGTH; i++) {
      this.read();
      if (!HEX_DIGITS.test(this.current)) throw this.expected('hexadecimal digit');
      hex += this.current;
    }
    this.read();
    return String.fromCharCode(Number.parseInt(hex, HEX_RADIX));
  }

  /** `JsonParser#readNumber` (`:370-384`): captures the literal's text. */
  private readNumber(): number | JsonNumber {
    const start = this.index;
    this.readChar('-');
    const firstDigit = this.current;
    if (!this.readDigit()) throw this.expected('digit');
    if (firstDigit !== '0') while (this.readDigit());
    this.readFraction();
    this.readExponent();
    return numberValue(this.text.slice(start, this.index));
  }

  /** `JsonParser#readFraction` (`:386-398`). */
  private readFraction(): void {
    if (!this.readChar('.')) return;
    if (!this.readDigit()) throw this.expected('digit');
    while (this.readDigit());
  }

  /** `JsonParser#readExponent` (`:400-412`). */
  private readExponent(): void {
    if (!this.readChar('e') && !this.readChar('E')) return;
    if (!this.readChar('+')) this.readChar('-');
    if (!this.readDigit()) throw this.expected('digit');
    while (this.readDigit());
  }

  private readChar(ch: string): boolean {
    if (this.current !== ch) return false;
    this.read();
    return true;
  }

  private readDigit(): boolean {
    const c = this.current;
    if (c < '0' || c > '9') return false;
    this.read();
    return true;
  }

  private skipWhiteSpace(): void {
    while (WHITESPACE.has(this.current)) this.read();
  }

  private isEndOfText(): boolean {
    return this.current === END_OF_TEXT;
  }

  /** `JsonParser#expected` (`:505-510`). */
  private expected(what: string): ParseException {
    return this.isEndOfText() ? this.error('Unexpected end of input') : this.error(`Expected ${what}`);
  }

  private error(message: string): ParseException {
    return new ParseException(message, this.index);
  }
}

/**
 * `Json.parse(String)` (`Json.java:300-307`): the value `text` denotes, or a
 * {@link ParseException} when it is not valid JSON.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/Json.java
 */
export function jsonParse(text: string): unknown {
  return new JsonParser(text).parse();
}
