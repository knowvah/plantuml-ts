/**
 * Inline `[[url label]]` hyperlink-token resolution (`UrlBuilder`/
 * `CommandCreoleUrl`) -- split out of `parse-helpers-strings.ts` purely to
 * stay under the project's 500-line cap. Self-contained (its own regex,
 * no dependency on the rest of that file), so it moves as one cohesive
 * unit; `parse-helpers-strings.ts` re-exports `resolveInlineLinks` so
 * `from './parse-helpers-strings.js'` (and, transitively, `from
 * './parse-helpers.js'`) is unchanged for existing consumers
 * (`link-edge-attrs.ts`, `core/creole-atoms.ts`). Pure move, zero
 * behavior change.
 */

/** UrlBuilder.getRegexp()'s optional tooltip group, `{...}` -- built from a
 *  string (not a `/{...}/` literal) per the lizard brace-counting
 *  workaround used throughout this engine (see buildDecorAlt in
 *  link-grammar.ts). */
const RE_TOOLTIP_BRACES = new RegExp('\\{[^{}]*\\}');

/**
 * Resolve a single `[[...]]` token's INNER text (the part between the
 * double brackets) to its visible label, per `Url.java`'s label-defaulting
 * constructor (`UrlBuilder.getUrl`, `net/sourceforge/plantuml/url/`):
 * an optional `{tooltip}` is stripped first -- it only ever feeds
 * `getTooltip()`, never the visible label -- then, of what remains, the
 * FIRST whitespace-separated run is the url and everything after it is the
 * label; if nothing remains after the url, the label defaults to the url
 * itself (`Url(String url, String tooltip, String label)`:
 * `if (label == null || label.length() == 0) this.label = url;`).
 * Not ported: `UrlBuilder`'s quoted-url grammar (S_QUOTED -- a
 * bracket-wrapped, quote-delimited literal URL) -- no corpus fixture's
 * link/arrow label exercises it; documented scope line, same precedent as
 * I1b's unported `sep==null` global-merge semantic.
 */
function resolveUrlToken(inner: string): string {
  const withoutTooltip = inner.replace(RE_TOOLTIP_BRACES, '').replace(/\s+/g, ' ').trim();
  const spaceIdx = withoutTooltip.indexOf(' ');
  return spaceIdx === -1 ? withoutTooltip : withoutTooltip.slice(spaceIdx + 1).trim();
}

/**
 * Replace every inline `[[...]]` hyperlink token embedded within `text`
 * with its resolved visible label. `CommandCreoleUrl` (klimt/creole/
 * command/CommandCreoleUrl.java) registers `[[` as a creole atom starter
 * and renders a `TextLink` atom whose visible glyphs are `url.getLabel()`
 * (`TextLink.java:50-52`), never the raw markup (brackets and URL
 * included) -- creole processing is generic, applying to ANY rendered
 * text, not just link/arrow labels. Used wherever link/arrow label text is
 * measured for DOT graph-spacing / label-table dimensions
 * (link-edge-attrs.ts) -- the raw markup has no on-diagram width, only the
 * resolved text does.
 */
export function resolveInlineLinks(text: string): string {
  return text.replace(/\[\[([^\]]*(?:\][^\]]+)*)\]\]/g, (_match, inner: string) => resolveUrlToken(inner));
}
