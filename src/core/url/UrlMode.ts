/**
 * UrlMode — how `UrlBuilder#getUrl` matches its patterns against the
 * input: `STRICT` requires the whole string to be a `[[...]]` form
 * (`Matcher#matches`), `ANYWHERE` accepts one embedded anywhere in the
 * string (`Matcher#find`).
 *
 * Upstream: url/UrlMode.java — ported in full (a bare 2-value enum).
 * As-const object + string union per project convention
 * (`src/core/abel/GroupType.ts`'s own stated rule).
 *
 * SI1/T7 closure pull (Member.java:115 constructs
 * `new UrlBuilder(null, UrlMode.STRICT)`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlMode.java:38-40
 */
export const UrlMode = {
  STRICT: 'STRICT',
  ANYWHERE: 'ANYWHERE',
} as const;
export type UrlMode = (typeof UrlMode)[keyof typeof UrlMode];
