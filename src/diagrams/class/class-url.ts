/**
 * `[[url]]` link grammar — G2 N15 (README item #7, deferred since N6).
 *
 * Byte-exact port of `url/UrlBuilder.java`'s 5-way STRICT-mode regex
 * grammar (`getUrl`, `UrlMode.STRICT` — `Matcher2#matches()`, the WHOLE
 * bracket text must match one alternative, no partial/`find()` fallback;
 * every class-diagram caller constructs `new UrlBuilder(topurl,
 * UrlMode.STRICT)`). Scope this iteration: CLASSIFIER-level urls only
 * (`class Foo [[url]]` inline on a declaration, and the standalone `url
 * [of|for] <Code> [is] [[url]]` statement, `classdiagram/command/
 * CommandUrl.java`) — member-line `[[[url]]]` (triple-bracket) urls are a
 * SEPARATE, not-yet-built mechanism (not named in this iteration's scope;
 * `class-member-parser.ts` already strips a member's `[[...]]`/`[[[...]]]`
 * suffix unparsed, N12).
 *
 * `%g` (upstream's quote-char class: `"`, U+201C, U+201D, plus an
 * invisible-quote codepoint) is narrowed to plain `"` here — matches this
 * port's existing quote-handling convention elsewhere (`class-notes.ts
 * #NOTE_TARGET`'s `"[^"]+"`, `stripQuotes`); smart quotes are an
 * unsupported, pre-existing gap in every other quoted-string grammar in
 * this file, not a new omission.
 *
 * @see ~/git/plantuml/.../url/UrlBuilder.java
 * @see ~/git/plantuml/.../url/Url.java (label/tooltip null-fallback rules)
 * @see ~/git/plantuml/.../classdiagram/command/CommandUrl.java (the
 *      standalone `url of X is [[...]]` statement grammar)
 */

import type { Classifier } from './class-classifier-ast.js';

export interface UrlInfo {
  readonly url: string;
  readonly tooltip: string;
  readonly label: string;
}

/** `Url.java`'s ctor: `tooltip` defaults to `url` when omitted; `label`
 *  defaults to `url` when omitted OR empty. */
function buildUrl(url: string, tooltip: string | undefined, label: string | undefined): UrlInfo {
  return {
    url,
    tooltip: tooltip ?? url,
    label: label !== undefined && label.length > 0 ? label : url,
  };
}

/**
 * cdd-T34 (E14 `topurl`): `UrlBuilder#withTopUrl` (`core/url/UrlBuilder.ts:
 * 190-191`, `UrlBuilder.java:140-146`), applied here rather than imported
 * from that file — this task's own boundary is "only WIRE it in", i.e.
 * `UrlBuilder.ts` itself stays unedited, including not exporting a new
 * surface from it. The rule is one `if`, small enough to cite and apply
 * directly rather than grow that file's public API for a single caller.
 * `topurl === undefined` (no `skinparam topurl` declared) is a no-op,
 * matching upstream's `topurl == null` guard.
 */
export function applyTopUrl(url: string, topurl: string | undefined): string {
  if (topurl === undefined) return url;
  if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:')) return url;
  return topurl + url;
}

// `[[%s]*` / `[%s]*]]` -- START_PART / END_PART.
const START = String.raw`\[\[\s*`;
const END = String.raw`\s*\]\]`;

// 1. `[["quoted link"{tooltip} label]]` -- quoted link, optional tooltip,
//    optional label.
const QUOTED = new RegExp(`^${START}"([^"]+)"(?:\\s*\\{([^{}]*)\\})?(?:\\s([^\\s{}[\\]][^[\\]]*))?${END}$`);
// 2. `[[{tooltip}]]` -- tooltip only, url is empty.
const ONLY_TOOLTIP = new RegExp(`^${START}\\{(.*)\\}${END}$`);
// 3. `[[{tooltip} label]]` -- tooltip + label, url is empty.
const ONLY_TOOLTIP_AND_LABEL = new RegExp(`^${START}\\{([^{}]*)\\}\\s*([^\\s{}[\\]][^[\\]]*)${END}$`);
// 4. `[[link{tooltip}]]` -- bare (unquoted) link, mandatory tooltip, no label.
const LINK_TOOLTIP_NOLABEL = new RegExp(`^${START}([^\\s"{}[\\]]+?)\\s*\\{(.+)\\}${END}$`);
// 5. `[[link{tooltip} label]]` -- bare link, optional tooltip, optional label.
const LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL = new RegExp(
  `^${START}([^\\s"[\\]]+?)(?:\\s*\\{([^{}]*)\\})?(?:\\s([^\\s{}[\\]][^[\\]]*))?${END}$`,
);

/**
 * Parses a `[[...]]` bracket (the FULL bracket text, including the double
 * brackets) into its `{url, tooltip, label}` triple, trying the 5
 * alternatives in upstream's exact order. Returns `undefined` when `raw`
 * matches none of them (malformed bracket content) -- mirrors `UrlBuilder
 * #getUrl` returning `null`.
 *
 * `topurl` (cdd-T34, optional) applies {@link applyTopUrl} to the url
 * capture group of the three alternatives that carry a real (non-empty)
 * url -- `ONLY_TOOLTIP`/`ONLY_TOOLTIP_AND_LABEL` never call it, matching
 * `UrlBuilder#getUrl`'s own two `new Url('', ...)` branches (java:114-116),
 * which never call `withTopUrl` either. Every EXISTING caller passes no
 * second argument (`topurl` stays `undefined`, a no-op via {@link
 * applyTopUrl}) -- this is a pure widening, zero behavior change for
 * member/note/namespace/relationship urls, which have no topurl available
 * at their own (parse-time) call sites in this port's architecture
 * (`layout.ts` applies it to classifier urls once `theme.topurl` is
 * resolved -- see that file's own call site).
 */
export function parseUrlBracket(raw: string, topurl?: string): UrlInfo | undefined {
  let m = QUOTED.exec(raw);
  if (m !== null) return buildUrl(applyTopUrl(m[1]!, topurl), m[2], m[3]);

  m = ONLY_TOOLTIP.exec(raw);
  if (m !== null) return buildUrl('', m[1], undefined);

  m = ONLY_TOOLTIP_AND_LABEL.exec(raw);
  if (m !== null) return buildUrl('', m[1], m[2]);

  m = LINK_TOOLTIP_NOLABEL.exec(raw);
  if (m !== null) return buildUrl(applyTopUrl(m[1]!, topurl), m[2], undefined);

  m = LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL.exec(raw);
  if (m !== null) return buildUrl(applyTopUrl(m[1]!, topurl), m[2], m[3]);

  return undefined;
}

/**
 * Matches a single `[[...]]` bracket occurrence anywhere in a string (no
 * nested-bracket awareness, matching this port's existing pre-N15
 * `extractDecorations` convention) -- callers extract the match text and
 * hand it to {@link parseUrlBracket}.
 */
export const URL_BRACKET_RE = /\[\[[^\]]*\]\]/;

/**
 * cdd-T34 (E14 `topurl`): applies {@link applyTopUrl} to every already-
 * parsed classifier url in `classifiers` — the "thread topurl into
 * parseUrlBracket's call sites" fix, adapted to this port's architecture.
 * `class-declaration-extractors.ts`/`class-url-command.ts` call {@link
 * parseUrlBracket} during PARSING, before `skinparam topurl` has been
 * resolved into a `Theme` (this port resolves skinparam globally, D4's
 * established `scale`/`dpi` pattern — see `theme.ts#topurl`'s own doc
 * comment) — so re-deriving from raw bracket text a second time is not
 * possible (the AST keeps only the parsed {@link UrlInfo}, not the source
 * text) and would be a second grammar besides. Applying the SAME one-line
 * rule directly to the already-parsed `url.url` string is equivalent:
 * `applyTopUrl` only inspects the url string's own prefix, never the raw
 * bracket syntax that produced it. `layout.ts#layoutSinglePage` is the
 * sole caller, once `theme.topurl` is available (mirrors `resolveScaleFactor`'s
 * own "call site, not a stored field" convention).
 *
 * Scoped to classifiers only, matching this file's own documented scope
 * ("CLASSIFIER-level urls only") — namespace/note/member/relationship urls
 * are untouched. Returns `classifiers` unchanged (`===`) when `topurl` is
 * `undefined` (the overwhelming common case, zero allocation).
 *
 * `Url.java`'s ctor defaults `tooltip` to `url` when the bracket carried no
 * explicit `{tooltip}` (`buildUrl`'s own `tooltip ?? url`) — upstream
 * resolves that default AFTER `withTopUrl` prefixes the url (`CommandCreate
 * Class.java:219-221`: `urlBuilder.getUrl(s)` calls `withTopUrl` inside
 * `getUrl`, then constructs `Url` from the already-prefixed string), so an
 * OMITTED tooltip is the PREFIXED url, not the bare one. This port parses
 * before `topurl` is known, so `tooltip === url` (both still unprefixed) is
 * the signal that tooltip was defaulted, not explicit — re-derive it from
 * the newly-prefixed url in that case only, matching jar's own outcome
 * without a second grammar or a "was this explicit" AST flag. `label`
 * defaults identically (`buildUrl`'s own `label.length > 0 ? label : url`)
 * and is fixed up the same way, for the same reason.
 */
export function applyTopUrlToClassifiers(
  classifiers: readonly Classifier[],
  topurl: string | undefined,
): readonly Classifier[] {
  if (topurl === undefined) return classifiers;
  return classifiers.map((c) => {
    if (c.url === undefined) return c;
    const oldUrl = c.url.url;
    const newUrl = applyTopUrl(oldUrl, topurl);
    const tooltip = c.url.tooltip === oldUrl ? newUrl : c.url.tooltip;
    const label = c.url.label === oldUrl ? newUrl : c.url.label;
    return { ...c, url: { url: newUrl, tooltip, label } };
  });
}
