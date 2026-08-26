/**
 * Shared regex fragments behind the sequence-diagram arrow commands.
 *
 * Upstream builds `CommandArrow`, `CommandExoArrowLeft` and
 * `CommandExoArrowRight` out of the SAME `RegexLeaf`/`RegexOr` fragments
 * (`CommandExoArrowLeft.java:59,65` and `CommandExoArrowRight.java:59,67`
 * reference `CommandArrow.ANCHOR` / `CommandArrow.getColorOrStylePattern()`
 * directly). This module ports those fragments so the three commands share
 * what upstream shares instead of keeping diverging hand-rolled copies.
 *
 * Composition rules, mirrored from upstream's regex combinators:
 * - `RegexConcat` is plain concatenation (`regex/RegexConcat.java:160-166`).
 * - `RegexOr` WITH a name emits a capturing group `(a|b|...)`; without a name
 *   `(?:a|b|...)` (`regex/RegexOr.java:57-70`).
 * - `RegexOptional` emits `(?:X)?` (`regex/RegexOptional.java:46-52`).
 *
 * Group naming: upstream addresses a leaf's groups as `arg.get(NAME, i)` --
 * e.g. `CommandArrow.java:166-167` reads `PART1LONGCODE` at index 0 AND at
 * index 1. JavaScript has no per-leaf group numbering, so a leaf's group 0
 * takes upstream's bare name and group i>0 takes that name with `i` appended:
 * `PART1LONGCODE` / `PART1LONGCODE1`.
 *
 * Every compiled form carries the `i` flag because upstream compiles every
 * command pattern with `Pattern.CASE_INSENSITIVE`
 * (`regex/Pattern2.java:114`), and the `u` flag because `%pLN` expands to the
 * Unicode property classes `\p{L}\p{N}`.
 *
 * Nothing consumes this module yet; `CommandArrow` and the two exo commands
 * are ported on top of it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:76-133
 */

import { LINE_STYLE } from '../description/link-grammar-regex.js';

// ---------------------------------------------------------------------------
// Pattern2's `%` expansions
// ---------------------------------------------------------------------------

/**
 * `%s` -- normal or non-breaking space.
 *
 * JS `\s` is a superset of Java's (it already includes U+00A0 and the other
 * Unicode space separators); the explicit ` ` is kept so the expansion
 * reads as upstream's.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:57
 */
const S = '[\\s\\u00A0]';

/**
 * `%pLN` -- Unicode letter or digit.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:56
 */
const PLN = '\\p{L}\\p{N}';

/**
 * `%g` -- the quote characters: ASCII double quote, the two curly double
 * quotes, and `Jaws.BLOCK_E1_INVISIBLE_QUOTE` (U+E121).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:59
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java:55
 */
const G_CHARS = '"\\u201c\\u201d\\uE121';

/** `[%g]` -- one quote character. */
const G_IN = `[${G_CHARS}]`;

/** `[^%g]` -- one non-quote character. */
const G_OUT = `[^${G_CHARS}]`;

/**
 * `[%pLN_.@]` -- the participant-code character class. Deliberately NOT `\S`:
 * `\S+` backtracks into the arrow's own dashes, so `C-->B` parses as a
 * participant `C-`, and swallows `[`, inventing a participant named `[`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:93
 */
const CODE = `[${PLN}_.@]`;

// ---------------------------------------------------------------------------
// ANCHOR
// ---------------------------------------------------------------------------

/**
 * `ANCHOR` verbatim, with upstream's two unnamed groups: group 1 is the whole
 * `{name}` plus its trailing spaces, group 2 is the anchor name itself (the
 * one `CommandArrow.java:420` reads as `arg.get("ANCHOR", 1)`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:78
 */
export const ANCHOR = `(\\{([${PLN}_]+)\\}${S}+)?`;

/**
 * {@link ANCHOR} with its two groups named. Upstream instantiates the same
 * constant under three different leaf names -- `ANCHOR`, `PART1ANCHOR`,
 * `PART2ANCHOR` -- so the name is a parameter here too.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:91
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:97
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:124
 */
export function anchor(name: string): string {
  return `(?<${name}>\\{(?<${name}1>[${PLN}_]+)\\}${S}+)?`;
}

// ---------------------------------------------------------------------------
// Colour / line style
// ---------------------------------------------------------------------------

/**
 * `getColorOrStylePattern()` verbatim -- an optional bracketed
 * `CommandLinkElement.LINE_STYLE`, with upstream's single unnamed group.
 * `LINE_STYLE` is imported rather than re-spelled because upstream imports it
 * too (`CommandArrow.java:49`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:84-86
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandLinkElement.java:77-78
 */
export const COLOR_OR_STYLE_PATTERN = `(?:\\[(${LINE_STYLE})\\])?`;

/**
 * {@link COLOR_OR_STYLE_PATTERN} with its group named. Upstream uses the same
 * pattern under `ARROW_STYLE1` and `ARROW_STYLE2`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:106
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:110
 */
export function colorOrStylePattern(name: string): string {
  return `(?:\\[(?<${name}>${LINE_STYLE})\\])?`;
}

// ---------------------------------------------------------------------------
// Arrow dressings
// ---------------------------------------------------------------------------

/**
 * `RegexOptional(RegexOr("ARROW_DRESSING1", ...))` -- the tail-side dressing:
 * a bare `o`/`x` decoration, a `<`/`<<`/`<_` head (optionally preceded by an
 * `o`/`x` decoration or by an `(n)` inclination), or a `/`/`//`/`\`/`\\`
 * half-arrow head. The `o`/`x` decoration is `[%s][ox]` -- it REQUIRES the
 * leading space, which is why `A->oB` names a participant `oB` while
 * `A ->o B` decorates the arrow.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:99-103
 */
export const ARROW_DRESSING1 =
  `(?:(?<ARROW_DRESSING1>${S}[ox]` +
  `|(?:${S}[ox]|\\(\\d+\\))?<<?_?` +
  `|(?:${S}[ox])?//?` +
  `|(?:${S}[ox])?\\\\\\\\?))?`;

/**
 * `RegexOptional(RegexOr("ARROW_DRESSING2", ...))` -- the head-side dressing,
 * the mirror of {@link ARROW_DRESSING1}: `>`/`>>`/`_>` (optionally followed by
 * an `o`/`x` decoration or an `(n)` inclination), a half-arrow head, or a bare
 * `o`/`x` decoration. The trailing decoration is `[ox][%s]` -- again the space
 * is required.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:112-116
 */
export const ARROW_DRESSING2 =
  `(?:(?<ARROW_DRESSING2>_?>>?(?:[ox]${S}|\\(\\d+\\))?` +
  `|//?(?:[ox]${S})?` +
  `|\\\\\\\\?(?:[ox]${S})?` +
  `|[ox]${S}))?`;

// ---------------------------------------------------------------------------
// Arrow body
// ---------------------------------------------------------------------------

/**
 * The unnamed `RegexOr` of two `RegexConcat` bodies: dashes-then-optional-
 * style-then-optional-dashes, or optional-dashes-then-optional-style-then-
 * dashes. Two spellings so that the bracketed style may sit at either end of
 * the dashes (`-[#red]->` and `<-[#red]-`) while at least one dash is always
 * required. Being unnamed, the `RegexOr` emits a NON-capturing group.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:104-111
 */
export const ARROW_BODY_OR =
  `(?:(?<ARROW_BODYA1>-+)${colorOrStylePattern('ARROW_STYLE1')}(?<ARROW_BODYB1>-*)` +
  `|(?<ARROW_BODYA2>-*)${colorOrStylePattern('ARROW_STYLE2')}(?<ARROW_BODYB2>-+))`;

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * One endpoint's named `RegexOr` and its four alternatives, in upstream's
 * order: bare code, quoted display, quoted display + `as` code, code + `as`
 * quoted display. Upstream writes the same four twice, once per side, and
 * reads them back by `n + "CODE"` etc. (`CommandArrow.java:159-170`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:92-96
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:118-122
 */
function part(n: 'PART1' | 'PART2'): string {
  return (
    `(?<${n}>(?<${n}CODE>${CODE}+)` +
    `|${G_IN}(?<${n}LONG>${G_OUT}+)${G_IN}` +
    `|${G_IN}(?<${n}LONGCODE>${G_OUT}+)${G_IN}${S}*as${S}+(?<${n}LONGCODE1>${CODE}+)` +
    `|(?<${n}CODELONG>${CODE}+)${S}+as${S}*${G_IN}(?<${n}CODELONG1>${G_OUT}+)${G_IN})`
  );
}

/**
 * The tail endpoint: `PART1CODE` / `PART1LONG` / `PART1LONGCODE` /
 * `PART1CODELONG`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:92-96
 */
export const PART1 = part('PART1');

/**
 * The head endpoint: `PART2CODE` / `PART2LONG` / `PART2LONGCODE` /
 * `PART2CODELONG`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:118-122
 */
export const PART2 = part('PART2');

// ---------------------------------------------------------------------------
// Exo-arrow supplementary circles
// ---------------------------------------------------------------------------

/**
 * `CommandExoArrowLeft`'s `ARROW_SUPPCIRCLE2` -- the LEADING border token
 * (`[`, `]` or `?`) with an optional `o`/`x` decoration after it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandExoArrowLeft.java:60
 */
export const ARROW_SUPPCIRCLE2_LEFT = '(?<ARROW_SUPPCIRCLE2>[?\\[\\]][ox]?)?';

/**
 * `CommandExoArrowLeft`'s `ARROW_SUPPCIRCLE1` -- the decoration sitting
 * against the participant, which must be followed by whitespace.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandExoArrowLeft.java:73
 */
export const ARROW_SUPPCIRCLE1_LEFT = `(?<ARROW_SUPPCIRCLE1>[ox]${S}+)?`;

/**
 * `CommandExoArrowRight`'s `ARROW_SUPPCIRCLE1` -- the mirror of
 * {@link ARROW_SUPPCIRCLE1_LEFT}: whitespace first, then the decoration.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandExoArrowRight.java:62
 */
export const ARROW_SUPPCIRCLE1_RIGHT = `(?<ARROW_SUPPCIRCLE1>${S}+[ox])?`;

/**
 * `CommandExoArrowRight`'s `ARROW_SUPPCIRCLE2` -- the TRAILING border token,
 * with the optional `o`/`x` decoration before it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandExoArrowRight.java:75
 */
export const ARROW_SUPPCIRCLE2_RIGHT = '(?<ARROW_SUPPCIRCLE2>[ox]?[?\\]\\[])?';

// ---------------------------------------------------------------------------
// Trailing modifiers
// ---------------------------------------------------------------------------

/**
 * Additional `& participant` recipients appended to the head endpoint. Always
 * participates (the `*` permits an empty match); upstream splits the captured
 * text on `&` (`CommandArrow.java:137-142`). Upstream spells the separator
 * spaces `\s`, not `[%s]`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:123
 */
export const MULTICAST = `(?<MULTICAST>(?:\\s&\\s${CODE}+)*)`;

/**
 * The activation spec. Upstream's alternation order is preserved verbatim --
 * `--` precedes `--\+\+`, so the shorter token is tried first and the engine
 * backtracks into the longer one only if the rest of the line fails.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:126
 */
export const ACTIVATION = '(?:(?<ACTIVATION>\\+\\+|\\*\\*|!!|--|--\\+\\+|\\+\\+--)?)';

/**
 * The lifeline colour applied by the activation.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:128
 */
export const LIFECOLOR = '(?:(?<LIFECOLOR>#\\w+)?)';

// ---------------------------------------------------------------------------
// Composed skeleton
// ---------------------------------------------------------------------------

/**
 * `CommandArrow.getRegexConcat()` composed from the fragments above, MINUS
 * `StereotypePattern.optional("STEREOTYPE")` and `UrlBuilder.OPTIONAL`
 * (`:129-130`), which are fragments owned by other upstream classes and are
 * not part of this module. Everything else appears in upstream's order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:89-133
 */
export const ARROW_SKELETON_SOURCE =
  `^(?<PARALLEL>&${S}*)?` +
  anchor('ANCHOR') +
  PART1 +
  anchor('PART1ANCHOR') +
  `${S}*` +
  ARROW_DRESSING1 +
  ARROW_BODY_OR +
  ARROW_DRESSING2 +
  `${S}*` +
  PART2 +
  MULTICAST +
  anchor('PART2ANCHOR') +
  `${S}*` +
  ACTIVATION +
  `${S}*` +
  LIFECOLOR +
  `${S}*` +
  `(?::${S}*(?<MESSAGE>.*))?$`;

/**
 * {@link ARROW_SKELETON_SOURCE} compiled. `i` because upstream compiles every
 * command pattern with `Pattern.CASE_INSENSITIVE`; `u` for `\p{L}`/`\p{N}`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/regex/Pattern2.java:114
 */
export const ARROW_SKELETON_RE = new RegExp(ARROW_SKELETON_SOURCE, 'iu');
