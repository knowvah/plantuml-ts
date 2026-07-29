/**
 * Parser — small static line-classification helpers `CreoleParser` (T9a)
 * needs to dispatch a raw display line to the code/latex/tree/table
 * branches, plus two pure `<style>`-attribute readers unrelated to that
 * dispatch but part of the same upstream file.
 *
 * Upstream: klimt/creole/Parser.java (92 lines). Ported in full — every
 * member has a TS counterpart:
 *  - `MONOSPACED` (java:43) — the font-family name `CreoleParser`'s
 *    `isCodeStart` branch switches to.
 *  - `isLatexStart`/`isLatexEnd`/`isCodeStart`/`isCodeEnd` (java:45-59) —
 *    exact-string sentinels (`<latex>`, `</latex>`, `<code>`, `</code>`).
 *  - `isTreeStart` (java:61-65) — `line.charAt(0)=='|' && line.charAt(1)=='_'`.
 *  - `getScale`/`getColor` (java:69-91) — attribute-value scanners used by
 *    embedded-diagram/image sizing elsewhere upstream; ported for
 *    completeness of this small, self-contained, additive file (same
 *    precedent as T8's Sea/Position/PortGeometry: an upstream sibling this
 *    task's target class cannot be faithful without, reported here rather
 *    than silently widened — see `.agent-notes/T9a-creoleparser.md`).
 *
 * Added beyond T9a's literal write-set (`SheetBuilder.ts`/`CreoleParser.ts`/
 * `ISkinSimple.ts`) because `CreoleParser.java:101-106` calls
 * `Parser.isTreeStart`/`isCodeStart`/`isLatexStart`/`MONOSPACED` directly —
 * genuinely required for `CreoleParser`'s own dispatch to be faithful, not
 * "might be needed later".
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Parser.java
 */

/** java:43. */
export const MONOSPACED = 'monospaced';

/** java:45-47. */
export function isLatexStart(line: string): boolean {
  return line === '<latex>';
}

/** java:49-51. */
export function isLatexEnd(line: string): boolean {
  return line === '</latex>';
}

/** java:53-55. */
export function isCodeStart(line: string): boolean {
  return line === '<code>';
}

/** java:57-59. */
export function isCodeEnd(line: string): boolean {
  return line === '</code>';
}

/** java:61-65. Takes a plain `string` here (this port has no `CharSequence`
 *  abstraction distinct from `string`). */
export function isTreeStart(line: string): boolean {
  if (line.length < 2) return false;
  return line.charAt(0) === '|' && line.charAt(1) === '_';
}

const SCALE_PATTERN = /(?:scale=|\*)([0-9.]+)/;

/** java:69-78. `def` is returned when `s` is `null`/`undefined` or the
 *  pattern does not match — TS has no `Double.parseDouble` throw-on-bad-
 *  input equivalent needed here since the regex already constrains the
 *  captured group to `[0-9.]+`. */
export function getScale(s: string | null | undefined, def: number): number {
  if (s == null) return def;
  const m = SCALE_PATTERN.exec(s);
  if (m !== null) return Number.parseFloat(m[1] as string);
  return def;
}

const COLOR_PATTERN = /color[= :](#[0-9a-fA-F]{1,6}|\w+)/;

/** java:80-91. */
export function getColor(s: string | null | undefined): string | null {
  if (s == null) return null;
  const m = COLOR_PATTERN.exec(s);
  if (m !== null) return m[1] as string;
  return null;
}
