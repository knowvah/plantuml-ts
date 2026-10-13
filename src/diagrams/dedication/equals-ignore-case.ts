/**
 * `java.lang.String#equalsIgnoreCase`, as `DedicationSimple#same` calls it
 * (`DedicationSimple.java:74`): equal lengths, and per UTF-16 unit the units
 * are equal, or their upper cases are, or the lower cases of their upper
 * cases are (`String#regionMatches(true, ...)`).
 *
 * A copy of `diagrams/eggs/equals-ignore-case.ts`: layering rule 2
 * (`tests/architecture/layering.test.ts`) forbids importing across diagram
 * packages; a shared core home is a follow-on.
 *
 * `Character.toUpperCase(char)` / `toLowerCase(char)` are the one-unit
 * (simple) case maps; JS's are the full maps. A full upper case longer than
 * one unit (`ß` -> `SS`) has no simple counterpart, so the unit is kept;
 * the one multi-unit full lower case (`İ` -> `i̇`) starts with its
 * simple lower case `i`.
 *
 * @see java/lang/String.java#equalsIgnoreCase
 */

/** `Character.toUpperCase(char)`. */
function toUpperCase(c: string): string {
  const upper = c.toUpperCase();
  return upper.length === 1 ? upper : c;
}

/** `Character.toLowerCase(char)`. */
function toLowerCase(c: string): string {
  return c.toLowerCase().charAt(0);
}

/** `String#equalsIgnoreCase(other)`. */
export function equalsIgnoreCase(s: string, other: string): boolean {
  if (s.length !== other.length) return false;
  for (let i = 0; i < s.length; i++) {
    const c1 = s.charAt(i);
    const c2 = other.charAt(i);
    if (c1 === c2) continue;
    const u1 = toUpperCase(c1);
    const u2 = toUpperCase(c2);
    if (u1 === u2) continue;
    if (toLowerCase(u1) !== toLowerCase(u2)) return false;
  }
  return true;
}
