/**
 * The `CommandArrow` regex, fully composed -- split out of `command-arrow.ts`
 * purely to stay under the 500-line file cap (the file's own doc comment on
 * "what T3's skeleton leaves out" is unaffected; this is a location move,
 * not a scope change). `command-arrow.ts` re-exports every symbol here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:87-133
 */

import { ARROW_DRESSING1, ARROW_SKELETON_SOURCE, LIFECOLOR } from './sequence-arrow-regex.js';

// ---------------------------------------------------------------------------
// The two fragments `sequence-arrow-regex.ts` deliberately leaves out
// ---------------------------------------------------------------------------

/**
 * `%s` — normal or non-breaking space, as a bare char list so it can also be
 * spelled inside a NEGATED class (`[^%s…]`, which `UrlBuilder` uses four
 * times). `sequence-arrow-regex.ts` keeps its own copy private.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57
 */
const S_CHARS = '\\s\\u00A0';

/** `[%s]` — one such space. */
const S = `[${S_CHARS}]`;

/**
 * `%g` — the quote characters: ASCII double quote, the two curly double
 * quotes, and `Jaws.BLOCK_E1_INVISIBLE_QUOTE` (U+E121).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:59
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java:55
 */
const G_CHARS = '"\\u201c\\u201d\\uE121';

/**
 * `StereotypePattern.optional("STEREOTYPE")` — `spaceZeroOrMore`, an optional
 * `mandatory` leaf `(\<\<.+?\>\>)`, then `spaceZeroOrMore` again.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/StereotypePattern.java:52-58,67-69
 */
const STEREOTYPE_OPTIONAL = `${S}*(?:(?<STEREOTYPE><<.+?>>))?${S}*`;

/** `UrlBuilder.START_PART` / `END_PART`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:51-52 */
const URL_START = `\\[\\[${S}*`;
const URL_END = `${S}*\\]\\]`;

/** The optional `{tooltip}` and the optional trailing label, shared verbatim
 *  by `S_QUOTED` and `S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:56-57,78-79 */
const URL_OPT_TOOLTIP = `(?:${S}*\\{([^{}]*)\\})?`;
const URL_OPT_LABEL = `(?:${S}([^${S_CHARS}{}\\[\\]][^\\[\\]]*))?`;

/**
 * `UrlBuilder.getRegexp()` — its five alternatives in upstream's order, with
 * upstream's eleven inner groups kept (the twelfth is the `URL` group itself,
 * which is why `MANDATORY` declares `new RegexLeaf(12, URL_KEY, …)`).
 * `executeArg` reads only group 0, the whole `[[…]]` run, and hands it back to
 * `UrlBuilder#getUrl` to re-parse (`CommandArrow.java:133-136`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:48-49,54-87
 */
const URL_REGEXP =
  `${URL_START}[${G_CHARS}]([^${G_CHARS}]+)[${G_CHARS}]${URL_OPT_TOOLTIP}${URL_OPT_LABEL}${URL_END}` +
  `|${URL_START}\\{(.*)\\}${URL_END}` +
  `|${URL_START}\\{([^{}]*)\\}${S}*([^\\[${S_CHARS}{}\\[\\]][^\\[\\]]*)${URL_END}` +
  `|${URL_START}([^\\s${G_CHARS}{}\\[\\]]+?)${S}*\\{(.+)\\}${URL_END}` +
  `|${URL_START}([^${S_CHARS}${G_CHARS}\\[\\]]+?)${URL_OPT_TOOLTIP}${URL_OPT_LABEL}${URL_END}`;

/** `UrlBuilder.OPTIONAL` = `RegexOptional(MANDATORY)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:48-49 */
const URL_OPTIONAL = `(?:(?<URL>${URL_REGEXP}))?`;

// ---------------------------------------------------------------------------
// The composed pattern
// ---------------------------------------------------------------------------

/**
 * `getRegexConcat()` in full: T3's skeleton with STEREOTYPE and URL spliced
 * back in at their upstream position, immediately after LIFECOLOR and before
 * the final `spaceZeroOrMore` + MESSAGE (`CommandArrow.java:128-132`). The
 * splice is anchored on the LIFECOLOR fragment, which occurs exactly once, so
 * the concatenation order stays owned by `sequence-arrow-regex.ts`.
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:87-133
 */
export const ARROW_SOURCE = ARROW_SKELETON_SOURCE.replace(
  LIFECOLOR,
  () => `${LIFECOLOR}${STEREOTYPE_OPTIONAL}${URL_OPTIONAL}`,
);

/**
 * {@link ARROW_SOURCE} with the ARROW_DRESSING1 fragment removed — the
 * "optional group not taken" branch of `RegexOptional`
 * (`regex/RegexOptional.java:46-52`).
 */
export const UNDRESSED_ARROW_SOURCE = ARROW_SOURCE.replace(ARROW_DRESSING1, '');

/**
 * {@link ARROW_SOURCE} with ARROW_DRESSING1 made mandatory — the other branch.
 * The fragment is exactly `(?:…)?`, so dropping its final character is the
 * `RegexOr` inside the `RegexOptional`.
 */
export const DRESSED_ARROW_SOURCE = ARROW_SOURCE.replace(ARROW_DRESSING1, () => ARROW_DRESSING1.slice(0, -1));

/** `i` because upstream compiles every command with `Pattern.CASE_INSENSITIVE`
 *  (`regex/Pattern2.java:114`); `u` for `\p{L}`/`\p{N}`. */
export const UNDRESSED_ARROW_RE = new RegExp(UNDRESSED_ARROW_SOURCE, 'iu');
export const DRESSED_ARROW_RE = new RegExp(DRESSED_ARROW_SOURCE, 'iu');
