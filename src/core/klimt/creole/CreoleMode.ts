/**
 * CreoleMode — the creole-parsing mode `Display#create0`/`SheetBuilder`
 * select per call: how much creole markup a display's text is parsed for.
 *
 * Upstream: klimt/creole/CreoleMode.java — a 4-value Java `enum`: FULL,
 * SIMPLE_LINE, NO_CREOLE, FULL_BUT_UNDERSCORE. Ported in full (all 4
 * values; the Java enum has no other members).
 *
 * As-const object, not a TS `enum` (project convention — safer across
 * declaration-file boundaries than `const enum`, see code-principles).
 */
export const CreoleMode = {
  FULL: 'FULL',
  SIMPLE_LINE: 'SIMPLE_LINE',
  NO_CREOLE: 'NO_CREOLE',
  FULL_BUT_UNDERSCORE: 'FULL_BUT_UNDERSCORE',
} as const;

export type CreoleMode = (typeof CreoleMode)[keyof typeof CreoleMode];
