/**
 * minimal-json's `JsonNumber`: a number is kept as the TEXT it was written
 * with, never as a parsed value -- `JsonNumber(String string)` stores the
 * literal and `toString()` returns it (`JsonNumber.java:32-44`), and
 * `TextBlockJson#getShortString` draws that text (`value.toString()`), so
 * `-12.5e3`, `1e10` and `12345678901234567890` reach the page as written.
 *
 * Only a literal a JS `number` cannot reproduce through `String(n)` is held as
 * one of these (see `JsonParser.ts#numberValue`); every other literal is the
 * plain `number` it denotes, whose `String()` IS the literal.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/json/JsonNumber.java
 */
export class JsonNumber {
  constructor(readonly literal: string) {}

  /** `JsonNumber#toString` (`JsonNumber.java:41-44`). */
  toString(): string {
    return this.literal;
  }
}
