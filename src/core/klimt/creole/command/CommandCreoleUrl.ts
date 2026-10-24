/**
 * CommandCreoleUrl — the `[[...]]` creole command: matches
 * `Pattern2.cmpile("^(" + UrlBuilder.getRegexp() + ")")` at the scan
 * position and builds the link through `UrlBuilder#getUrl` in STRICT mode,
 * then draws the resulting `Url`'s LABEL in the hyperlink font, wrapped in
 * an `<a href>` (`StripeSimple#addUrl` -> `AtomTextUtils.createUrl`, which
 * applies `FontConfiguration#hyperlink()`).
 *
 * ```java
 * final UrlBuilder urlBuilder = new UrlBuilder(stripe.getSkinParam().getValue("topurl"), UrlMode.STRICT);
 * final Url url = urlBuilder.getUrl(m.group(1));
 * stripe.addUrl(url);
 * return m.group(1).length();
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleUrl.java:56,73-82
 *
 * The five `UrlBuilder` arms (QUOTED, ONLY_TOOLTIP, ONLY_TOOLTIP_AND_LABEL,
 * LINK_TOOLTIP_NOLABEL, LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL) and
 * `Url`'s tooltip/label defaulting (`Url.java:51-66`) are the port's
 * `core/url/UrlBuilder.ts` / `core/url/Url.ts`, used here unchanged.
 *
 * Port seams (recorded, not fitted):
 *  - `topurl`: this port's `StripeBuilder` carries no skin param, so the
 *    builder is constructed with `topurl = null` (no `skinparam topurl`
 *    prefix on a creole link) — the `withTopUrl` arm is inert here.
 *  - each label line is drawn through `analyzeAndAddInlineWithUrl` (the
 *    port's recursive creole engine, G2 N40) rather than `AtomTextUtils
 *    .createAtomTextForUrl`'s sprite/openicon/img/emoji-only split. The
 *    `Display.getWithNewlines` line split IS mirrored: more than one line
 *    stacks via `addUrlLines` (`atom/AtomVerticalTexts.ts`,
 *    AtomTextUtils.java:79-92).
 *
 * The `<a href>` wrapper element: `StripeBuilder#analyzeAndAddInlineWithUrl`
 * threads `atom/Atom.ts#CreoleAtomUrl` onto the produced `'text'` atom(s).
 */
import type { Command, StripeBuilder } from './Command.js';
import { FontStyle, type FontConfiguration } from '../../shape/UText.js';
import { getRegexp, transform, UrlBuilder } from '../../../url/UrlBuilder.js';
import { UrlMode } from '../../../url/UrlMode.js';
import type { Url } from '../../../url/Url.js';
import { Display } from '../Display.js';
import { Pragma } from '../../../skin/Pragma.js';

/** `Pattern2.cmpile("^(" + UrlBuilder.getRegexp() + ")")` — `%`-token
 *  transform + CASE_INSENSITIVE (Pattern2.java:109-121; `iu`, as
 *  `UrlBuilder.ts#cmpile`). `matcher(line, pos)` sets the region at `pos`
 *  with anchoring bounds (Matcher2.java:56-62), so `^` is the scan position:
 *  mirrored by matching `line.slice(pos)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleUrl.java:56 */
const PATTERN = new RegExp(`^(${transform(getRegexp())})`, 'iu');

/** Upstream's `blue` hyperlink default (`plantuml.skin:7,565`). */
export const HYPERLINK_COLOR = '#0000FF';

/**
 * D3 (cdd6 T1b): upstream `FontConfiguration#hyperlink()`'s `withHyperlink()`
 * (`FontConfiguration.java:253-256`) sets `currentColor = hyperlinkColor` --
 * the field populated at THIS FontConfiguration's own construction time from
 * `style.value(PName.HyperLinkColor)` (java:213-219, `Style.java:265`), a
 * per-classifier/`<style>`-cascade value. `undefined` means no override
 * reached construction, matching upstream's own `blue` default
 * (`plantuml.skin:7,565`, `SkinParam.java:305-311`).
 */
function resolveHyperlinkColor(saved: FontConfiguration): string {
  return saved.hyperlinkColor ?? HYPERLINK_COLOR;
}

/** `StripeSimple#addUrl` (java:224-226) -> `AtomTextUtils.createUrl`
 *  (java:79-91): `fontConfiguration.hyperlink()` then the label atom(s). */
function applyHyperlinkStyleAndPush(url: Url, stripe: StripeBuilder): void {
  const saved: FontConfiguration = stripe.getActualFontConfiguration();
  // `FontConfiguration#hyperlink()` (`FontConfiguration.java:335-340`):
  // `add(FontStyle.UNDERLINE)` only when `hyperlinkUnderlineStroke != null`.
  const styles = new Set(saved.styles);
  if (saved.hyperlinkUnderlineStroke !== null) styles.add(FontStyle.UNDERLINE);
  stripe.setActualFontConfiguration({ ...saved, color: resolveHyperlinkColor(saved), styles });
  // `AtomTextUtils#createUrl` (java:79-92): `Display.getWithNewlines(pragma,
  // label)` -- more than one line stacks one url text per line.
  const lines = Display.getWithNewlines(Pragma.createEmpty(), url.getLabel()).asList().map(String);
  if (lines.length > 1) stripe.addUrlLines(lines, url.getUrl(), url.getTooltip());
  else stripe.analyzeAndAddInlineWithUrl(url.getLabel(), url.getUrl(), url.getTooltip());
  stripe.setActualFontConfiguration(saved);
}

/** Upstream: `CommandCreoleUrl.create()`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleUrl.java:58-83 */
export function createUrlCommand(): Command {
  return {
    starters: ['[['],
    matchingSize(line, pos) {
      const m = PATTERN.exec(line.slice(pos));
      return m === null ? 0 : m[1]!.length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = PATTERN.exec(line.slice(pos));
      if (m === null) throw new Error('IllegalStateException');
      // `m.group(1)` matched one of the five arms in `getRegexp()` order, so
      // the same-order STRICT cascade in `getUrl` matches it whole: never null.
      const url = new UrlBuilder(null, UrlMode.STRICT).getUrl(m[1]!)!;
      applyHyperlinkStyleAndPush(url, stripe);
      return m[1]!.length;
    },
  };
}
