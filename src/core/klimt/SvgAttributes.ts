/**
 * SvgAttributes — the literal SVG attributes a `<text name=value …>…</text>`
 * creole tag attaches to the `<text>` elements drawn inside it.
 *
 * Upstream: klimt/SvgAttributes.java — an immutable wrapper over a
 * `TreeMap<String, String>`. The map is SORTED by `String#compareTo`
 * (UTF-16 code units), which is what `SvgGraphics#text` iterates when it
 * writes the entries on the element (SvgGraphics.java:737-738), so the
 * attribute order on the wire is the key order, not the source order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/SvgAttributes.java:44-100
 */
import { transform } from '../url/UrlBuilder.js';
import { eventuallyRemoveStartingAndEndingDoubleQuote } from '../url/Url.js';

/** `SvgAttributes.p` (java:61): `(\w+)\s*=\s*([%g][^%g]*[%g]|(?:\w+))`, after
 *  `Pattern2`'s `%g` transform; `CASE_INSENSITIVE` is irrelevant to it.
 *  Java's `\s` is `[ \t\n\x0B\f\r]` (no NBSP). */
const ATTRIBUTE_PATTERN = new RegExp(
  transform('(\\w+)[ \\t\\n\\x0B\\f\\r]*=[ \\t\\n\\x0B\\f\\r]*([%g][^%g]*[%g]|(?:\\w+))'),
  'gi',
);

/** `StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote(String)`'s
 *  one-argument form passes this format (StringUtils.java:86-91). */
const QUOTE_FORMAT = '"([:';

/** A `TreeMap`'s order: ascending `String#compareTo`, i.e. UTF-16 code units
 *  (what `<` compares on JS strings). */
function sortedByKey(entries: Iterable<readonly [string, string]>): ReadonlyMap<string, string> {
  return new Map([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export class SvgAttributes {
  private readonly map: ReadonlyMap<string, string>;

  private constructor(map: ReadonlyMap<string, string>) {
    this.map = map;
  }

  /** @see SvgAttributes.java:57-59 */
  static empty(): SvgAttributes {
    return new SvgAttributes(new Map());
  }

  /** `SvgAttributes.build(String)` (java:63-73): every `name=value` pair of
   *  `args`, a later duplicate replacing an earlier one (`TreeMap#put`). */
  static build(args: string): SvgAttributes {
    const found = new Map<string, string>();
    for (const m of args.matchAll(ATTRIBUTE_PATTERN))
      found.set(m[1]!, eventuallyRemoveStartingAndEndingDoubleQuote(m[2]!, QUOTE_FORMAT) as string);
    return new SvgAttributes(sortedByKey(found));
  }

  /** The entries in key order (java:75-77: an unmodifiable view). */
  attributes(): ReadonlyMap<string, string> {
    return this.map;
  }

  /** `add(String, String)` (java:79-83) and `add(SvgAttributes)` (java:85-89):
   *  a copy with the pair(s) put over this one's; the receiver is unchanged. */
  add(key: string, value: string): SvgAttributes;
  add(toBeAdded: SvgAttributes): SvgAttributes;
  add(keyOrOther: string | SvgAttributes, value?: string): SvgAttributes {
    const merged = new Map(this.map);
    if (typeof keyOrOther === 'string') merged.set(keyOrOther, value as string);
    else for (const [k, v] of keyOrOther.map) merged.set(k, v);
    return new SvgAttributes(sortedByKey(merged));
  }
}
