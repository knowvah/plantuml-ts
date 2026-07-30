/**
 * DisplayEquality — `Display#equals`/`#hashCode` (java:105-115), split out
 * of `Display.ts` to stay under this project's per-file size cap (that
 * file's own module doc comment). Built on `Display`'s public surface
 * (`isNull`/`asList`) rather than raw private-field access.
 *
 * `equals` is ported VERBATIM including its unguarded null case: upstream
 * calls `this.displayData.equals(...)` with no `isNull` check, so calling
 * `equals` on `Display.NULL` throws a `NullPointerException` — this port
 * throws explicitly for the same case (preserved rather than defensively
 * guarded, "don't refactor while porting").
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { Display, DisplayElement } from './Display.js';

/** `CharSequence`-element equality: a plain `string` compares by value; a
 *  `Stereotype`/`MessageNumber` compares by IDENTITY, matching Java's own
 *  default `Object#equals` (neither class overrides `equals()` upstream). */
function elementEquals(a: DisplayElement, b: DisplayElement): boolean {
  return a === b;
}

/** `Display#equals` (java:112-115). */
export function displayEquals(display: Display, other: Display): boolean {
  if (display.isNull) throw new Error('NullPointerException');
  const mine = display.asList();
  const theirs = other.isNull ? null : other.asList();
  if (theirs === null) return false;
  if (mine.length !== theirs.length) return false;
  return mine.every((e, i) => elementEquals(e, theirs[i] as DisplayElement));
}

/** `Display#hashCode` (java:105-110) -- `42` when `isNull` (matching
 *  upstream's own sentinel), else a Java-`String#hashCode`-style rolling
 *  hash over `cacheKey()`'s already content-faithful string form (no
 *  caller in this port keys a hash-bucket collection off `Display`,
 *  unlike `cacheKey()` itself, which `CreoleParser`'s cache needs). */
export function displayHashCode(display: Display, cacheKey: string): number {
  if (display.isNull) return 42;
  let h = 0;
  for (let i = 0; i < cacheKey.length; i++) h = (Math.imul(31, h) + cacheKey.charCodeAt(i)) | 0;
  return h;
}
