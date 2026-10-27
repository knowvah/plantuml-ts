/**
 * UbrexUrlBuilder -- the ubrex-based sibling of {@link UrlBuilder}: parses
 * the PlantUML `[[...]]` hyperlink syntax into a {@link Url}. The six
 * pattern strings below are upstream's text verbatim.
 *
 * Java `null` for absent URL/tooltip/label is `null` here, matching
 * {@link Url}'s constructor (`Url.ts`) and {@link UrlBuilder}; `getUrl`
 * returns `null` when nothing matches. The commented-out `MANDATORY` /
 * `OPTIONAL` / `getRegexp` upstream (`UbrexUrlBuilder.java:48-49, 85-91`) are
 * comments there and are not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java
 */
import { TextNavigator } from '../ubrex/TextNavigator.js';
import type { Capture } from '../ubrex/Capture.js';
import type { UMatcher } from '../ubrex/UMatcher.js';
import { umatcherFindFirstValueByKey } from '../ubrex/UMatcher.js';
import { UnicodeBracketedExpression } from '../ubrex/UnicodeBracketedExpression.js';
import { Url } from './Url.js';
import { UrlMode } from './UrlMode.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:51-52 */
const START_PART = '[[ 〇*〴s';
const END_PART = '〇*〴s  ]]';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:54-58 */
const S_QUOTED =
  START_PART +
  '〃  〶$URL=〇+「〤〃」 〃' + // Quoted part
  '〇?〘 〇*〴s { 〶$TOOLTIP=〇*「〤{}」 } 〙' + // Optional tooltip
  '〇?〘 〴s 〶$LABEL=〘「〤〴s{}[]」  〇*「〤[]」〙  〙' + // Optional label
  END_PART;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:60-61 */
const S_ONLY_TOOLTIP = START_PART + '{  〶$TOOLTIP=〄>〘 }〇*〴s]]〙'; // Tooltip WARNING!! Not exactly the same

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:63-67 */
const S_ONLY_TOOLTIP_AND_LABEL =
  START_PART +
  '{  〶$TOOLTIP=〇+「〤{}」 }' + // Tooltip
  '〇*〴s' +
  '〶$LABEL=〘「〤〴s[]{}」 〇*「〤[]」〙' + // Label
  END_PART;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:69-72 */
const S_LINK_TOOLTIP_NOLABEL =
  START_PART +
  '〶$URL=〇+「〤〴s〴g{}[]」' + // Link
  '〇*〴s' +
  '{  〶$TOOLTIP=〄>〘 }〇*〴s]]〙'; // Tooltip

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:74-78 */
const S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL =
  START_PART +
  '〶$URL=〇+「〤〴s〴g{}[]」' + // Link
  '〇?〘  〇*〴s  {  〶$TOOLTIP=〇*「〤{}」  } 〙' + // Optional tooltip
  '〇?〘  〴s 〶$LABEL=〘「〤〴s{}[]」 〇*「〤[]」〙  〙' + // Optional label
  END_PART;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:80-84 */
const S_LINK_NOTOOLTIP_WITH_OPTIONAL_LABEL =
  START_PART +
  '〶$URL=〇+「〤〴s〴g[]」' + // Link
  '〇?〘  〴s 〶$LABEL=〘「〤〴s{}[]」 〇*「〤[]」〙  〙' + // Optional label
  END_PART;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:93-102 */
const QUOTED = UnicodeBracketedExpression.build(S_QUOTED);
const ONLY_TOOLTIP = UnicodeBracketedExpression.build(S_ONLY_TOOLTIP);
const ONLY_TOOLTIP_AND_LABEL = UnicodeBracketedExpression.build(S_ONLY_TOOLTIP_AND_LABEL);
const LINK_TOOLTIP_NOLABEL = UnicodeBracketedExpression.build(S_LINK_TOOLTIP_NOLABEL);
const LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL = UnicodeBracketedExpression.build(
  S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL,
);
const LINK_NOTOOLTIP_WITH_OPTIONAL_LABEL = UnicodeBracketedExpression.build(S_LINK_NOTOOLTIP_WITH_OPTIONAL_LABEL);

/** The ubrex keys read back from a match. */
const URL_KEY = 'URL';
const TOOLTIP_KEY = 'TOOLTIP';
const LABEL_KEY = 'LABEL';

/** Java's package-private nested `UMatchNone` (exported = package-private, for tests). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java (UMatchNone, :187-218) */
export class UMatchNone implements UMatcher {
  startMatch(): boolean {
    return false;
  }

  exactMatch(): boolean {
    return false;
  }

  getAcceptedMatch(): string {
    throw new Error('UnsupportedOperationException');
  }

  findValuesByKey(_path: string): string[] {
    throw new Error('UnsupportedOperationException');
  }

  findFirstValuesByKeyPrefix(_keyPrefix: string): string[] | undefined {
    throw new Error('UnsupportedOperationException');
  }

  extractByPrefix(_key: string): Capture {
    throw new Error('UnsupportedOperationException');
  }

  /** Not overridden upstream: the `UMatcher` default (which throws via `findValuesByKey`). */
  findFirstValueByKey(key: string): string | undefined {
    return umatcherFindFirstValueByKey(this, key);
  }
}

export class UbrexUrlBuilder {
  private readonly topurl: string | null;
  private readonly mode: UrlMode;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:107-110 */
  constructor(topurl: string | null, mode: UrlMode) {
    this.topurl = topurl;
    this.mode = mode;
  }

  /** The six-pattern cascade, first match wins. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:112-139 */
  getUrl(s: string): Url | null {
    const cascade = [
      QUOTED,
      ONLY_TOOLTIP,
      ONLY_TOOLTIP_AND_LABEL,
      LINK_TOOLTIP_NOLABEL,
      LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL,
      LINK_NOTOOLTIP_WITH_OPTIONAL_LABEL,
    ];
    for (const ubrex of cascade) {
      const m = this.getMatcher(ubrex, s);
      if (this.matchesOrFind(m)) return this.buildUrl(m);
    }
    return null;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:141-151 */
  private getMatcher(ubrex: UnicodeBracketedExpression, s: string): UMatcher {
    if (this.mode === UrlMode.STRICT) return ubrex.match(s, 0);
    const tn = TextNavigator.build(s);
    for (let i = 0; i < tn.length() - 2; i++) {
      const matcher = ubrex.match(tn, i);
      if (matcher.startMatch()) return matcher;
    }
    return new UMatchNone();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:153-158 */
  private buildUrl(m: UMatcher): Url {
    const url = this.getValue(m, URL_KEY);
    const tooltip = this.getValue(m, TOOLTIP_KEY);
    const label = this.getValue(m, LABEL_KEY);
    return new Url(this.withTopUrl(url), tooltip, label);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:160-165 */
  private getValue(m: UMatcher, key: string): string | null {
    const list = m.findValuesByKey(key);
    if (list.length === 0) return null;
    return list[0] as string;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:167-175 */
  private matchesOrFind(m: UMatcher): boolean {
    if (this.mode === UrlMode.STRICT) return m.exactMatch();
    else if (this.mode === UrlMode.ANYWHERE) return m.startMatch();
    else throw new Error('IllegalStateException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UbrexUrlBuilder.java:177-185 */
  private withTopUrl(url: string | null): string {
    if (url === null) return '';
    if (!url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('file:') && this.topurl !== null)
      return this.topurl + url;

    return url;
  }
}
