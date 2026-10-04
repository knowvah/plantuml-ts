/**
 * CommandCreoleUrl — `[[url]]` / `[[url label]]` / `[[url {tooltip}]]` /
 * `[[url {tooltip} label]]` link atom-splitting: the jar draws the
 * resolved LABEL as its own text atom, in the hyperlink color (blue,
 * `SkinParamUtils.getFontHyperlinkColor` — `#0000FF` in every jar-verified
 * sample) with an underline, wrapped in an `<a href>` element.
 *
 * Upstream: klimt/creole/command/CommandCreoleUrl.java, built on
 * `UrlBuilder`/`Url` (`net/url/`) — NOT ported symbol-for-symbol (a whole
 * URL-mode/topurl-prefix subsystem, out of this iteration's directive-atom
 * charter); this command instead resolves the visible label directly
 * (strip an optional `{tooltip}`, first whitespace-run is the url, the
 * REST is the label, defaulting to the url itself when nothing follows —
 * `Url(String,String,String)`'s label-defaulting ctor, java) and applies
 * the jar's own OBSERVED text styling (jar-verified 2026-07-15,
 * `usecase/bivira-53-boja685`: `fill="#0000FF"` +
 * `text-decoration="underline"`).
 *
 * G2 N40: the `<a href>` SVG wrapper element itself LANDED (class-diagram
 * call site only, `renderer-classifier-box.ts#renderRowAtoms` -- see that
 * function's own doc comment) via `StripeBuilder#analyzeAndAddInlineWithUrl`
 * (`atom/Atom.ts#CreoleAtomUrl`, threaded onto the produced `'text'` atom(s)
 * rather than a NEW atom kind, so nested creole markup inside the label
 * keeps working exactly as before). `url`/`tooltip` resolution mirrors
 * `resolveLabel`'s own algorithm exactly (same tooltip-strip + first-
 * whitespace-run split, just keeping the PARTS `resolveLabel` throws away)
 * -- jar-verified `dasagu-52-vani172`'s classifier/member-level url grammar
 * is a SEPARATE mechanism (`class-url.ts#parseUrlBracket`'s full 5-way
 * `UrlBuilder` port); this file's own simplified grammar is intentionally
 * NOT unified with it (`core/klimt` must not depend on `diagrams/class`).
 * `entity-level `url of X is [[...]]` hyperlink wrapping remains a
 * SEPARATE, still-missing mechanism (`EntityImageDescription.ts`'s own
 * pre-existing "entity hyperlinks (Url) are not supported" gap) — out of
 * this directive's scope.
 */
import type { Command, StripeBuilder } from './Command.js';
import { FontStyle, type FontConfiguration } from '../../shape/UText.js';

// `UrlBuilder.getRegexp()`'s shape (bracket-delimited, no nested `]]`
// inside) — ported as a source string (never a regex literal, the `[`/`]`
// complexity-hook precedent already established by `creole-atoms.ts`).
//
// BOTH brackets are excluded from the capture, not just `]`. Every one of the
// five alternatives `getRegexp()` composes excludes the pair — the link arm is
//
// ```java
// private static final String S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL =
//         START_PART + "([^%s%g\\[\\]]+?)" + ...
// ```
// @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:76-80
//
// The `[` matters whenever a COMPONENT wraps a display in literal brackets of
// its own — `ComponentRoseGroupingHeader.java:89` does exactly that to a
// group's comment, so the drawn string is `[[[url]]]`. Admitting `[` made this
// port match at position 0 and emit one linked run reading `[https://…`, a
// broken href; upstream cannot start there and matches at position 1, giving
// the jar's three runs `[` / linked url / `]` (`cedeti-10-bufu072`).
const URL_TAG_SOURCE = '\\[\\[([^\\[\\]]*(?:\\][^\\[\\]]+)*)\\]\\]';

const HYPERLINK_COLOR = '#0000FF';

/**
 * add2 T2d (laxibe-66-teme800): a `{tooltip}` is only a tooltip when
 * nothing but the label/end follows its closing brace -- upstream's
 * `S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL` requires the Link to
 * stop, THEN `(?:[%s]*\{([^{}]*)\})?` (optional tooltip), THEN
 * `(?:[%s]([^%s\{\}\[\]][^\[\]]*))?` (optional label, which always starts
 * with REQUIRED whitespace), THEN `END_PART` --
 * `~/git/plantuml/.../url/UrlBuilder.java:76-80`:
 * ```java
 * private static final String S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL = START_PART + //
 *         "([^%s%g\\[\\]]+?)" + // Link
 *         "(?:[%s]*\\{([^{}]*)\\})?" + // Optional tooltip
 *         "(?:[%s]([^%s\\{\\}\\[\\]][^\\[\\]]*))?" + // Optional label
 *         END_PART;
 * ```
 * So a `}` immediately glued to more non-whitespace text (`{dd}sss`) can
 * never satisfy either the label branch (needs LEADING whitespace) or
 * `END_PART` (needs `]]` right there) -- the lazy Link group is forced to
 * keep growing PAST the brace pair instead, swallowing it as literal link
 * text. Mirrored here as a lookahead: a `{...}` only counts as the tooltip
 * when followed by whitespace or the end of `inner` (`$` -- `inner` is
 * already everything between the `[[`/`]]` delimiters, so "end of inner"
 * IS "immediately before `]]`"). `[^{}]*` matches the Java capture
 * (`[^{}]*`) exactly.
 */
const TOOLTIP_RE = /\{([^{}]*)\}(?=\s|$)/;

/** Finds the (at most one) upstream-recognized tooltip in `inner` and
 *  returns `inner` with it excised -- shared by {@link resolveLabel} and
 *  {@link resolveUrlAndTooltip} so both read the SAME boundary rule. */
function extractTooltip(inner: string): { withoutTooltip: string; tooltip: string | undefined } {
  const m = TOOLTIP_RE.exec(inner);
  if (m === null) return { withoutTooltip: inner, tooltip: undefined };
  return { withoutTooltip: inner.slice(0, m.index) + inner.slice(m.index + m[0].length), tooltip: m[1] };
}

/** Upstream: `Url`'s label-defaulting ctor -- strip an optional
 *  `{tooltip}`, the first whitespace-run is the url, everything after is
 *  the label; falls back to the url itself when nothing remains. */
function resolveLabel(inner: string): string {
  const withoutTooltip = extractTooltip(inner)
    .withoutTooltip.replace(/\s+/g, ' ')
    .trim();
  const spaceIdx = withoutTooltip.indexOf(' ');
  return spaceIdx === -1 ? withoutTooltip : withoutTooltip.slice(spaceIdx + 1).trim();
}

/** G2 N40: `resolveLabel`'s own tooltip-strip + first-whitespace-run split,
 *  keeping the url (part BEFORE the split) and tooltip (the `{...}`
 *  capture, defaulting to the url itself when absent -- `Url.java`'s own
 *  tooltip-defaulting ctor rule, same precedent `class-url.ts#buildUrl`
 *  already applies for the classifier-level grammar). */
function resolveUrlAndTooltip(inner: string): { url: string; tooltip: string } {
  const { withoutTooltip: stripped, tooltip } = extractTooltip(inner);
  const withoutTooltip = stripped.replace(/\s+/g, ' ').trim();
  const spaceIdx = withoutTooltip.indexOf(' ');
  const url = spaceIdx === -1 ? withoutTooltip : withoutTooltip.slice(0, spaceIdx);
  return { url, tooltip: tooltip ?? url };
}

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

function applyHyperlinkStyleAndPush(label: string, url: string, tooltip: string, stripe: StripeBuilder): void {
  const saved: FontConfiguration = stripe.getActualFontConfiguration();
  stripe.setActualFontConfiguration({
    ...saved,
    color: resolveHyperlinkColor(saved),
    styles: new Set(saved.styles).add(FontStyle.UNDERLINE),
  });
  stripe.analyzeAndAddInlineWithUrl(label, url, tooltip);
  stripe.setActualFontConfiguration(saved);
}

/** Upstream: `CommandCreoleUrl.create()`. */
export function createUrlCommand(): Command {
  const re = new RegExp('^' + URL_TAG_SOURCE);
  return {
    starters: ['[['],
    matchingSize(line, pos) {
      const m = re.exec(line.slice(pos));
      return m === null ? 0 : m[0].length;
    },
    executeAndAdvance(line, pos, stripe) {
      const m = re.exec(line.slice(pos));
      if (m === null) return 0;
      const inner = m[1]!;
      const { url, tooltip } = resolveUrlAndTooltip(inner);
      applyHyperlinkStyleAndPush(resolveLabel(inner), url, tooltip, stripe);
      return m[0].length;
    },
  };
}
