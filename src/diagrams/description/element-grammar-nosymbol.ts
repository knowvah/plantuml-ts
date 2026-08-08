/**
 * `CommandCreateElementFull`'s declaration alternatives with the leading
 * SYMBOL keyword OMITTED (`getRegexConcat:84`, `(?:(ALL_TYPES|\(\))[%s]+)?`
 * — the group is optional). Split out of `element-grammar.ts` to stay under
 * the project's 500-line file cap; every pattern here is a keyword-less line
 * shape, and they must be read together because upstream's ONE regex
 * alternation decides between them by ORDER:
 *
 * | # | java | shape | this module |
 * | - | ---- | ----- | ----------- |
 * | 1 | :88 CODE1 | `"quoted"` / bare CODE | {@link RE_BARE_QUOTED_DECL}, {@link RE_BARE_DECORATED_DECL} |
 * | 2 | :89-94 DISPLAY2 as CODE2 | decorated/quoted LHS, UNQUOTED alias | rules 11/11b, `command-table-containers.ts` |
 * | 3 | :95-100 CODE3 as DISPLAY3 | CODE, then a decorated or QUOTED display | {@link RE_BARE_AS_DECORATED}, {@link RE_CODE_AS_QUOTED_DISPLAY} |
 *
 * Pure logic only; `parser.ts` and the command table own all state mutation.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandCreateElementFull.java
 */

import type { USymbol } from '../../core/descriptive-keywords.js';
import { cleanId, finalizeDisplay } from './parse-helpers.js';
import { classifyEndpointShape } from './link-grammar.js';

// ---------------------------------------------------------------------------
// Shared decoration vocabulary (TAGS1/STEREOTYPE/TAGS2/URL/color,
// java:108-115) — trailing on every alternative above.
// ---------------------------------------------------------------------------

/** ONE `#color` / `<<stereotype>>` / `$tag` / `[[url]]` decoration token,
 *  with the whitespace that may precede it. */
const DECORATION =
  '(?:\\s*(?:#[\\w:;.#\\\\/|-]+|<<[^>]+>>|\\$[^\\s{}"\'<>$]+|' +
  '\\[\\[[^\\]]*(?:\\][^\\]]+)*\\]\\]))';

/** Trailing `#color` / `<<stereotype>>` / `$tag` / `[[url]]` decorations,
 *  repeated -- shared by both sides of RE_BARE_QUOTED_DECL's `as` clause. */
const DECORATIONS = DECORATION + '*';

/** `%g` -- the quote characters PlantUML's regex dialect accepts around a
 *  quoted CODE/DISPLAY (`Pattern2.QUOTED_REPLACEMENTS`, regex/Pattern2
 *  .java:59). Mirrors `parse-helpers.ts`'s own module-private `QUOTE_CHARS`
 *  (the same three-plus-sentinel set); duplicated rather than imported
 *  because that constant is not exported. */
const QUOTE_CHARS = '"\\u201c\\u201d\\ue121';

// ---------------------------------------------------------------------------
// Bare id, decorated display: `Admin as :Main Admin:` / `Use as (Use the
// application)` — CommandCreateElementFull's "CODE3 as DISPLAY3" alternative
// (no leading SYMBOL keyword; getRegexConcat:95-100).
// ---------------------------------------------------------------------------

/**
 * Matches the whole line: a genuinely BARE CODE (letters/digits/underscore/
 * dot only — CODE_CORE's bare alternative; NOT `(`/`:`/`[`/quote-decorated,
 * which would instead satisfy upstream's "DISPLAY2 as CODE2" alternative,
 * tried BEFORE this one — see {@link parseBareAsDecorated}), `as`, then a
 * `:...:` or `(...)` DISPLAY (each with the optional business-variant
 * trailing `/`).
 */
export const RE_BARE_AS_DECORATED = /^([\p{L}\p{N}_.]+)\s+as\s+(:[^:]+:\/?|\([^)]+\)\/?)\s*$/iu;

export interface BareAsDecorated {
  id: string;
  display: string;
  symbol: USymbol;
}

/**
 * No leading SYMBOL keyword is present in this form, so the symbol is
 * sniffed from the DISPLAY token's decoration — exactly like
 * {@link classifyEndpointShape} does for a link endpoint (both are
 * `CommandLinkElement.getDummy`'s codeChar sniff / `DescriptionDiagram
 * .cleanId`, the same normalizer upstream applies everywhere).
 *
 * Deliberately NOT extended to the reverse "DISPLAY2 as CODE2" alternative
 * (a decorated LHS, e.g. `(Application) as (App)`) — that shape is
 * ambiguous with a bare/quoted alias and needs its own drill-down; ledgered
 * rather than guessed at (see phase-2-description/ledger.md).
 */
export function parseBareAsDecorated(idToken: string, decoratedToken: string): BareAsDecorated {
  const id = cleanId(idToken.trim());
  const decorated = classifyEndpointShape(decoratedToken.trim());
  return { id, display: decorated.id, symbol: decorated.symbol };
}

// ---------------------------------------------------------------------------
// Bare quoted declaration, no keyword: CommandCreateElementFull's CODE1
// branch (CODE_WITH_QUOTE, java:88) and its DISPLAY2 `as` CODE2 branch
// (java:89-94), both with the SYMBOL group entirely omitted (java:84,
// optional). executeArg (java:236-268) finds no paren/colon/bracket
// decoration on the quoted CODE/DISPLAY, so symbol stays null, defaulting to
// LeafType.DESCRIPTION / actorStyle().toUSymbol() (java:273-275) -- the plain
// STICKMAN actor rendering (renderer-symbol.ts's documented ActorStyle
// default). isForbidden (java:134-138) declines a PURE bare token, so a bare
// unquoted identifier ALONE is never a declaration upstream -- but the same
// token followed by a decoration is (see RE_BARE_DECORATED_DECL below).
// Trailing TAGS/STEREOTYPE/URL/color (java:108-115) are permitted after the
// close-quote and stripped by parseNameSection exactly as elsewhere. Built
// via new RegExp (Lizard-safe: literal angle-bracket/brace chars in a
// /regex/ literal desync lizard's brace-depth counting for this file's
// functions).
//
// The `as` alias is restricted to CODE_CORE's undecorated branch
// (`[%pLN_.]+`, java:126) -- spelt here as a negated class so non-ASCII
// identifiers still match without forcing the /u flag onto the rest of this
// pattern. A DECORATED alias (`as (uc4)` / `as :a:` / `as [c]`) is NOT this
// branch: the decoration overrides the symbol per executeArg's codeChar
// dispatch, and rule 11b in command-table-containers.ts consumes those first.
// The decoration group is repeated on both sides of the `as` clause because
// upstream permits STEREOTYPE2 before it (java:91) and TAGS/STEREOTYPE/URL/
// color after it (java:108-115); parseNameSection strips either position.
// ---------------------------------------------------------------------------

/** CODE_CORE's undecorated alias branch (`[%pLN_.]+`, java:126). */
const PLAIN_ALIAS = '[^\\s#<>$\\[\\]"]+';

export const RE_BARE_QUOTED_DECL = new RegExp(
  '^"[^"]+"' + DECORATIONS + '(?:\\s+as\\s+' + PLAIN_ALIAS + ')?' +
    DECORATIONS + '\\s*$',
);

// ---------------------------------------------------------------------------
// Bare UNQUOTED declaration, no keyword: CommandCreateElementFull's CODE1
// branch again (CODE_WITH_QUOTE, java:88), this time on CODE_CORE's plain
// `[%pLN_.]+` alternative (java:126,:128) rather than the quoted one --
// `User << Human >>`. `isForbidden` (FORBIDDEN_PATTERN `^[\p{L}0-9_.]+$`,
// java:134-138) tests the WHOLE line, so a line that is ENTIRELY a bare token
// is refused outright while the same token followed by any decoration is a
// real declaration; that whole-line test is what the `DECORATION + '+'`
// (one-or-more, not zero-or-more) below reproduces.
//
// Symbol: executeArg finds no paren/colon/bracket decoration on a bare CODE
// and no SYMBOL keyword, so `symbol == null` and java:271-274 resolves it to
// LeafType.DESCRIPTION + `actorStyle().toUSymbol()` -- the same plain
// STICKMAN actor RE_BARE_QUOTED_DECL's rule already emits for the quoted
// form. This leaf is NOT STILL_UNKNOWN (jar-probed: `User << Human >>` alone
// in a diagram draws a stickman, not the INTERFACE circle `makeDiagramReady`
// would mute an unresolved leaf to) -- STILL_UNKNOWN is `CommandLinkElement
// .getDummy`'s business, never this command's.
// ---------------------------------------------------------------------------

export const RE_BARE_DECORATED_DECL = new RegExp(
  '^[\\p{L}\\p{N}_.]+' + DECORATION + '+\\s*$',
  'u',
);

// ---------------------------------------------------------------------------
// `CODE as "quoted DISPLAY"`, no keyword: CommandCreateElementFull's THIRD
// alternative, `CODE3 [STEREOTYPE3] as DISPLAY3` (java:95-100).
//
// The role flip is the whole point. `DISPLAY` admits a quoted string
// (DISPLAY_CORE, java:130) but `CODE` does not (CODE_CORE, java:126), so a
// QUOTED right-hand side can only be satisfied by alternative 3 -- where the
// LEFT token is the CODE (the id) and the quoted RIGHT token is the DISPLAY.
// That is the exact reverse of the ordinary `DISPLAY2 as CODE2` alias form
// (java:89-94), which alternation order tries FIRST and which therefore still
// owns every UNQUOTED right-hand side (`(Use) as UC1` stays id `UC1`,
// display `Use`). Widening an existing alias alternation to admit a quoted
// token instead of adding this separate branch produces the roles backwards.
// ---------------------------------------------------------------------------

/** `CODE_CORE` (java:126), in upstream's own alternation order. Deliberately
 *  has NO quoted alternative -- that is `CODE_WITH_QUOTE`'s addition
 *  (java:128) and belongs to CODE1, not CODE3, which is why `"a" as "b"`
 *  matches nothing at all upstream. */
const CODE_CORE =
  '[\\p{L}\\p{N}_.]+|\\(\\)\\s*[\\p{L}\\p{N}_.]+|' +
  `\\(\\)\\s*[${QUOTE_CHARS}][^${QUOTE_CHARS}]+[${QUOTE_CHARS}]|` +
  ':[^:]+:/?|\\([^()]+\\)/?|\\[[^\\[\\]]+\\]';

/** `StereotypePattern.optional("STEREOTYPE3")` -- the guillemet run upstream
 *  permits BETWEEN the CODE and `as` (java:96), captured so the command can
 *  fold it in with the trailing decoration run. */
const STEREOTYPE_BEFORE_AS = '((?:\\s*<<[^>]+>>)?)';

/**
 * Groups: 1 = CODE, 2 = STEREOTYPE3 (may be empty), 3 = the quoted DISPLAY
 * *including* its quotes (upstream strips them in `executeArg:311`, which
 * {@link finalizeDisplay} reproduces), 4 = the trailing decoration run.
 *
 * `\s*\bas` rather than `\s+as`: alternative 3's `new RegexLeaf("as")` has no
 * leading-space requirement, so `(Use)as "x"` is legal; the word boundary
 * still refuses `Adminas "x"`, which upstream's own greedy `[%pLN_.]+` CODE
 * also refuses, having swallowed the `as` into the identifier.
 */
export const RE_CODE_AS_QUOTED_DISPLAY = new RegExp(
  `^(${CODE_CORE})${STEREOTYPE_BEFORE_AS}\\s*\\bas\\s*` +
    `([${QUOTE_CHARS}].+?[${QUOTE_CHARS}])(${DECORATIONS})\\s*$`,
  'iu',
);

export interface CodeAsQuotedDisplay {
  id: string;
  display: string;
  symbol: USymbol;
}

/**
 * `executeArg`'s codeChar dispatch (java:237-266), restricted to the
 * alternative-3 shape: DISPLAY is always quoted here, so `codeDisplay` can
 * never be `(`/`:`/`[` and only the CODE's own notation decides the symbol.
 * A bare CODE leaves `symbol == null`, which java:271-274 resolves to
 * LeafType.DESCRIPTION + `actorStyle().toUSymbol()`.
 */
function codeSymbol(code: string): USymbol {
  if (code.startsWith('()')) return 'interface';
  if (code.startsWith('(')) return code.endsWith(')/') ? 'usecase-business' : 'usecase';
  if (code.startsWith(':')) return code.endsWith(':/') ? 'actor-business' : 'actor';
  if (code.startsWith('[')) return 'component';
  return 'actor';
}

/**
 * The role-flipping half of {@link RE_CODE_AS_QUOTED_DISPLAY}: the LEFT token
 * becomes the id (through {@link cleanId}, the shared CODE normalizer that
 * also strips `()` / `(x)/` / `:x:/`) and the quoted RIGHT token becomes the
 * display (through {@link finalizeDisplay}, upstream's unconditional
 * quote-strip + `Display.getWithNewlines`). Contrast
 * {@link parseBareAsDecorated}, which handles the same alternative's
 * *decorated* DISPLAY forms (`Admin as :Main Admin:`) and sniffs the symbol
 * from the DISPLAY instead -- there the CODE is always bare, so it carries no
 * notation of its own.
 */
export function parseCodeAsQuotedDisplay(
  code: string,
  quotedDisplay: string,
): CodeAsQuotedDisplay {
  const raw = code.trim();
  return { id: cleanId(raw), display: finalizeDisplay(quotedDisplay), symbol: codeSymbol(raw) };
}
