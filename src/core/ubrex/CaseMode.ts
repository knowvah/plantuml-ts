/**
 * `CaseMode` -- case sensitivity of a ubrex matcher. Char convention for the
 * whole `ubrex` package: a Java `char` is a string holding exactly one UTF-16
 * code unit.
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaseMode.java
 */
export const CaseMode = {
  CASE_SENSITIVE: 'CASE_SENSITIVE',
  CASE_INSENSITIVE: 'CASE_INSENSITIVE',
} as const;
export type CaseMode = (typeof CaseMode)[keyof typeof CaseMode];

/**
 * `CaseMode.ensureLowercase(char)`: ASCII `A`-`Z` only (`CaseMode.java:41-45`).
 *
 * @see ~/git/plantuml/src/main/java/com/plantuml/ubrex/CaseMode.java
 */
export function ensureLowercase(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(code - 65 + 97);
  return ch;
}
