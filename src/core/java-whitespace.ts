/**
 * `Character.isWhitespace(char)`, enumerated.
 *
 * Upstream skips leading whitespace with this predicate in several places
 * that decide whether a line is a directive at all — `DiagramType
 * #findStartTypes` (`:73-74`) and every `StartUtils` probe
 * (`startsWithDirectiveKeyword`, `isStartDirective`, `isExit`). JS's `\s` is
 * NOT the same predicate and disagrees in BOTH directions: it matches the
 * three non-breaking spaces Java excludes (U+00A0, U+2007, U+202F) and
 * U+FEFF, while missing the four ASCII information separators U+001C-U+001F
 * that Java accepts. A line opening with U+00A0 before `@startuml` is a start
 * directive here and is not one in the jar.
 *
 * The set is `{Zs, Zl, Zp} \ {U+00A0, U+2007, U+202F}` plus the nine control
 * characters the javadoc lists — closed, so enumerating it is exact rather
 * than approximate.
 *
 * Lives in its own module because two unrelated callers need it and a second,
 * differently-wrong copy is how the `\s` divergence survived in the first
 * place.
 *
 * @see java.lang.Character#isWhitespace(char)
 */
const JAVA_WHITESPACE: ReadonlySet<number> = new Set([
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, // TAB, LF, VT, FF, CR
  0x1c, 0x1d, 0x1e, 0x1f, // FILE, GROUP, RECORD, UNIT SEPARATOR
  0x20, // SPACE
  0x1680, // OGHAM SPACE MARK
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, // Zs run, minus
  0x2008, 0x2009, 0x200a, //                              U+2007 (non-breaking)
  0x2028, 0x2029, // LINE / PARAGRAPH SEPARATOR
  0x205f, // MEDIUM MATHEMATICAL SPACE
  0x3000, // IDEOGRAPHIC SPACE
]);

/** True iff `text`'s code unit at `i` is whitespace by Java's definition. */
export function isJavaWhitespaceAt(text: string, i: number): boolean {
  return JAVA_WHITESPACE.has(text.charCodeAt(i));
}
