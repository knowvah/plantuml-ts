/**
 * `Guillemet` — the `<<x>>` -> `«x»` display-text substitution.
 *
 * Faithful port of `net/sourceforge/plantuml/text/Guillemet.java`. Upstream
 * applies this in the CREOLE PARSER, per line, before stripes are built
 * (`CreoleParser.java:175`: `createStripes(skinParam.guillemet()
 * .manageGuillemet(cs.toString()), …)`) — so it affects DISPLAY TEXT, not
 * just the stereotype block that `EntityImageDescriptionDelegates.ts`
 * already wraps in guillemets itself.
 *
 * This port previously applied it only to stereotypes, so guillemets written
 * INSIDE a quoted display (`rectangle "<<something>>\nplain"`) were measured
 * and drawn as the four literal characters `<<`/`>>` instead of the two
 * glyphs `«`/`»` — 17.3px too wide on nenedo-78-fiva569's node 4
 * (jar-verified: that node's box is 100.150px and its text is drawn as
 * `«something»`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/text/Guillemet.java
 */

/** The pair a `<<…>>` run is rewritten to. `DOUBLE_COMPARATOR` (`<<`/`>>`,
 *  i.e. `skinparam guillemet false`) is the identity — upstream short-
 *  circuits on it — and `none` maps to the empty pair. */
export interface GuillemetPair {
  readonly start: string;
  readonly end: string;
}

/** Upstream's `Guillemet.GUILLEMET`, the default when the skinparam is unset. */
export const GUILLEMET_DEFAULT: GuillemetPair = { start: '«', end: '»' };

/** `\<\<\s?((?:\<&\w+\>|[^<>])+?)\s?\>\>` (java:76). The inner alternation
 *  lets an OpenIconic atom (`<&name>`) sit inside the guillemets without its
 *  own angle brackets ending the run. Built via `new RegExp` per this repo's
 *  complexity-hook convention for angle-bracket-bearing patterns. */
const GUILLEMET_PATTERN = new RegExp('<<\\s?((?:<&\\w+>|[^<>])+?)\\s?>>', 'g');

/**
 * `Guillemet#manageGuillemet` (java:78-88): rewrite every `<<…>>` run to the
 * configured pair. Identity when the pair IS `<<`/`>>` (upstream's
 * `this == DOUBLE_COMPARATOR` short-circuit) and — matching upstream's own
 * fast path — when the line contains no `<` at all.
 */
export function manageGuillemet(line: string, pair: GuillemetPair = GUILLEMET_DEFAULT): string {
  if (pair.start === '<<' && pair.end === '>>') return line;
  if (!line.includes('<')) return line;
  return line.replace(GUILLEMET_PATTERN, `${pair.start}$1${pair.end}`);
}
