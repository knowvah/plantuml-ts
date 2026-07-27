/**
 * Pure, stateless STRING-LEVEL primitives for the descriptive-diagram parser:
 * quote/wrap stripping, id cleaning, url/link token resolution, and the
 * stereotype/color/tag extractors that operate on a raw remainder string.
 *
 * Split out of `parse-helpers.ts` (which re-exports everything here) purely
 * to stay under the project's 500-line cap — none of these functions call
 * back into `parse-helpers.ts`, so the dependency is one-way. All regex
 * literals that contain $, " or ' are pre-compiled at module scope — Lizard
 * 1.23.0 miscounts braces when those chars appear inside /regex/ literals
 * inside function bodies.
 */

import { resolveTextEscapes } from '../../core/text-escapes.js';

// ---------------------------------------------------------------------------
// Named return-type interfaces (prevent Lizard brace-counting confusion)
// ---------------------------------------------------------------------------

export interface StereotypeResult {
  /** ALL consecutive `<<tag>>` labels, in source order (see
   *  `DescriptiveNode.stereotype`'s doc comment for the upstream rationale). */
  stereotypes: readonly string[];
  remainder: string;
}

export interface ColorResult {
  color: string;
  remainder: string;
}

export interface LinkStereoResult {
  stereotype: string | undefined;
  label: string | undefined;
}

export interface TagsResult {
  tags: string[];
  remainder: string;
}

interface LeadingQuoteSplit {
  quoted: string;
  tail: string;
}

// ---------------------------------------------------------------------------
// Module-level regex constants
// Lizard 1.23.0 miscounts brace depth when $, " or ' appear inside /regex/
// literals in function bodies, producing false NLOC attribution. Defining
// them here (outside any function) avoids the issue entirely.
// ---------------------------------------------------------------------------

// extractColor
// Color/style token (ColorParser.exp1): `#name`/`#RRGGBB`, optionally with
// `;`- and `:`-separated inline style directives (`#green;line:blue`,
// `#line:blue` style-only, `#red;line.dashed`), and gradients (`#c1\c2`,
// `#c1/c2`, `#c1|c2`, `#c1-c2` — the `[-\\|/]` separator in upstream
// ColorParser.COLOR_REGEXP). None add DOT structure — matched here only so the
// id/display parse cleanly (else the color leaks into the display and inflates
// the node width).
const RE_COLOR = /(#[\w:;.#\\/|-]+)\s*$/;

// extractTags — Stereotag.pattern() (net.sourceforge.plantuml.stereo
// .Stereotag:42-45): a whitespace-separated `$name` token, name excluding
// whitespace/braces/quotes/angle-brackets/'$' itself. Matched whole-token
// (not substring) so a `$var` reference embedded inside other syntax, e.g.
// `%get_json_type($json_object)`, is never mistaken for a tag — Stereotag
// only ever appears as its own token, never glued to surrounding text.
const RE_TAG_TOKEN = new RegExp('^\\$[^\\s{}"\'<>$]+$');

/** `stripTrailingUrl`'s bracket/whitespace regexes -- module-level per the
 *  file doc's lizard brace-counting workaround (a `$` anchor inside a
 *  function-body regex literal trips it the same way `$`/`"`/`'` do). */
const RE_INLINE_URL_TOKEN = /\[\[[^\]]*(?:\][^\]]+)*\]\]/g;
const RE_WHITESPACE_RUN = /\s+/g;
const RE_TRAILING_WHITESPACE = /\s+$/;

/** UrlBuilder.getRegexp()'s optional tooltip group, `{...}` -- built from a
 *  string (not a `/{...}/` literal) per the lizard brace-counting
 *  workaround used throughout this engine (see buildDecorAlt in
 *  link-grammar.ts). */
const RE_TOOLTIP_BRACES = new RegExp('\\{[^{}]*\\}');

// ---------------------------------------------------------------------------
// cleanId — DescriptionDiagram.cleanId / CucaDiagram.cleanId
// ---------------------------------------------------------------------------

/**
 * `isDoubleQuote` (StringUtils.java:90-92): ASCII quote plus the curly and
 * guillemet variants PlantUML also accepts as quote delimiters.
 */
function isDoubleQuoteChar(c: string): boolean {
  return c === '"' || c === '“' || c === '”' || c === '«' || c === '»';
}

/**
 * `StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote(String)`
 * (StringUtils.java:83-88), which delegates to the 2-arg overload
 * (:63-81) with the default `format` `"\"([:"`. Despite the name, this strips
 * ANY fully-wrapping delimiter pair from a string that both starts AND ends
 * with it — not just double quotes: `"x"`, `(x)`, `[x]`, and `:x:` all reduce
 * to `x`. This is `CucaDiagram.cleanId`'s entire body (net/atmp/CucaDiagram
 * .java:194-198) and is also applied (unconditionally) to every declaration's
 * final Display text in CommandCreateElementFull.executeArg.
 */
export function stripFullWrap(s: string): string {
  if (s.length > 1 && isDoubleQuoteChar(s.charAt(0)) && isDoubleQuoteChar(s.charAt(s.length - 1))) {
    return s.slice(1, -1);
  }
  if (s.startsWith('(') && s.endsWith(')')) return s.slice(1, -1);
  if (s.startsWith('[') && s.endsWith(']')) return s.slice(1, -1);
  if (s.startsWith(':') && s.endsWith(':')) return s.slice(1, -1);
  return s;
}

/**
 * `DescriptionDiagram.cleanId` (descdiagram/DescriptionDiagram.java:56-67).
 * Three special cases checked ahead of the generic {@link stripFullWrap}
 * fallback (`super.cleanId`): a leading `()` is always stripped (interface
 * shorthand — it usually doesn't *end* with a matching delimiter, so the
 * generic fallback wouldn't catch it), and the business-actor/business-
 * usecase trailing-slash forms (`:x:/`, `(x)/`) strip both the outer
 * delimiter and the slash in one step (the generic fallback can't catch
 * these either, since the string no longer ends with the bare delimiter
 * once the slash is appended).
 *
 * This is the single shared normalizer for every place upstream computes an
 * entity id from raw source text: a plain keyword declaration's CODE
 * (CommandCreateElementFull.executeArg:302), and a link endpoint's identifier
 * (CommandLinkElement.getDummy:347,358 and its ENT1/ENT2 clean check at
 * :298-299) — so a declaration and a link endpoint that name the same
 * notation MUST resolve to the identical id.
 */
export function cleanId(raw: string): string {
  let id = raw;
  if (id.startsWith('()')) id = id.slice(2).trim();
  if (id.startsWith(':') && id.endsWith(':/')) return id.slice(1, -2);
  if (id.startsWith('(') && id.endsWith(')/')) return id.slice(1, -2);
  return stripFullWrap(id);
}

// ---------------------------------------------------------------------------
// Text-escape resolution — I4c: text CONTENT bugs (textLength/x/y correctly
// derived for the WRONG string). `resolveTextEscapes` moved to
// `core/text-escapes.ts` (G2/N21) — shared with the class engine's note
// text, not description-specific; re-exported here so existing imports of
// `parse-helpers.ts` keep working unchanged.
// ---------------------------------------------------------------------------

export { resolveTextEscapes };

/**
 * Literal `\n`/`\r`/`\l` two-character escapes -> a real embedded newline,
 * mirroring the backslash-escape loop in `Display.getWithNewlines`
 * (klimt/creole/Display.java:259-343), restricted to the branch reachable
 * from raw declaration text (the `BLOCK_E1_*` internal sentinel characters
 * that method also handles are produced by an earlier creole-hiding pass
 * this port never invokes for entity/node display text, so they can't occur
 * here). `\r`/`\l` also carry a natural-horizontal-alignment side effect
 * upstream (RIGHT/LEFT) that this port has no per-entity-text-block wiring
 * for — not evidenced by any I4c corpus sample; only the newline-split
 * itself is reproduced. `\t` becomes a literal tab; a doubled `\\` collapses
 * to one backslash; any other `\`-led pair is copied through verbatim
 * (mirrors the Java `else` branch). Suppressed inside a `[[...]]` inline-
 * link span (`rawMode` upstream) — a `\n` embedded in a URL/label token
 * must survive verbatim for {@link resolveInlineLinks} to resolve later
 * (usecase/vivido-49-nisu863's `[[http://plantuml.com before ...]]`, whose
 * OWN `\n` sits BEFORE the `[[`, outside raw mode, and is correctly split).
 * `<math>`/`<latex>` raw-mode spans are not ported — unreached by any I4c
 * sample; a `<latex>`-bearing fixture is already a separate, deeper gap
 * (see ledger.md).
 */
interface EscapePair {
  text: string;
  consumed: number;
}

/**
 * Resolve a single backslash-escape pair at position `i` — the inner
 * branch of {@link resolveNewlineEscapes}'s loop, split out to keep that
 * function's cyclomatic complexity down. Returns `undefined` when `s[i]`
 * is not a `\` that can start a pair (either not a backslash, or the last
 * character in the string), in which case the caller copies `s[i]`
 * verbatim and advances by one, same as every other plain character.
 */
function resolveEscapePair(s: string, i: number): EscapePair | undefined {
  if (s[i] !== '\\' || i >= s.length - 1) return undefined;
  const c2 = s[i + 1]!;
  if (c2 === 'n' || c2 === 'r' || c2 === 'l') return { text: '\n', consumed: 2 };
  if (c2 === 't') return { text: '\t', consumed: 2 };
  if (c2 === '\\') return { text: '\\', consumed: 2 };
  return { text: s[i], consumed: 1 };
}

export function resolveNewlineEscapes(s: string): string {
  let result = '';
  let rawMode = false;
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('[[', i)) rawMode = true;
    else if (s.startsWith(']]', i)) rawMode = false;
    const pair = rawMode ? undefined : resolveEscapePair(s, i);
    if (pair !== undefined) { result += pair.text; i += pair.consumed; continue; }
    result += s[i]!;
    i++;
  }
  return result;
}

/**
 * Final unconditional post-processing applied to every entity DISPLAY,
 * regardless of which declaration alternative captured it —
 * `CommandCreateElementFull.executeArg:311`
 * (`display = StringUtils.eventuallyRemoveStartingAndEndingDoubleQuote
 * (display)`, unconditional, run AFTER alias-form matching) followed by
 * `Display.getWithNewlines` (java:321/324, the newline-escape split) and,
 * at draw time, `AtomText`'s own unicode/entity-escape resolution
 * ({@link resolveTextEscapes} above). Centralized here (parse time) since
 * this port measures/renders `display` directly rather than through a full
 * Display/Atom pipeline — a single origin point keeps measurement and
 * rendering consistent automatically. Deliberately NOT applied to `id`
 * (upstream's `quark.getName()` is a separately-cleaned value that never
 * passes through `Display.getWithNewlines` — see
 * tests/unit/description/parse-helpers.test.ts's vivido-49-nisu863 case,
 * where `id` keeps its literal `\n` but `display` does not).
 */
export function finalizeDisplay(display: string): string {
  return resolveTextEscapes(resolveNewlineEscapes(stripFullWrap(display)));
}

// ---------------------------------------------------------------------------
// Stereotype and color helpers
// ---------------------------------------------------------------------------

/**
 * Extract angle-bracket stereotype(s) from a node-declaration remainder.
 *
 * `CommandCreateElementFull.java`'s single `StereotypePattern.optional
 * ("STEREOTYPE")` (:110) is anchored against `RegexLeaf.end()` (:115), so
 * regex backtracking lets its non-greedy `.+?` span PAST intervening
 * `>> <<` text and swallow a whole run of consecutive `<<..>>` blocks —
 * `component 3 <<1>> <<2>> <<3>>` only matches AT ALL because nothing may
 * remain unconsumed after STEREOTYPE. Each tag becomes its own line above
 * the entity's label (`Stereotype#getMultipleLabels()`, `Display.create
 * (labels)` — G1 I5b, `DescriptiveNode.stereotype`'s doc comment). Matching
 * just the FIRST `<<..>>` occurrence left the rest glued onto the id/
 * display, so a later bare reference to the real id missed it and
 * auto-created a phantom entity instead (mamase-39-buto560). ALL tags in
 * the run are returned, in source order; the WHOLE run is consumed from
 * the remainder regardless of tag count.
 */
export function extractNodeStereotype(rest: string): StereotypeResult | undefined {
  const run = /(?:<<\s*.+?\s*>>\s*)+/.exec(rest);
  if (run === null) return undefined;
  const stereotypes: string[] = [];
  const tagRe = /<<\s*(.+?)\s*>>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(run[0])) !== null) {
    stereotypes.push(resolveTextEscapes(tagMatch[1]!));
  }
  const before = rest.slice(0, run.index).trimEnd();
  const after = rest.slice(run.index + run[0].length).trimStart();
  // A bare concatenation would fuse adjacent tokens when both sides are
  // non-empty (e.g. a trailing `$tag` after the stereotype getting glued to
  // a leading `#color` before it) — join with a single space in that case.
  const remainder = before.length > 0 && after.length > 0 ? `${before} ${after}` : before + after;
  return { stereotypes, remainder };
}

/** Strip a `[[url]]` / `[[url label]]` hyperlink token (UrlBuilder.OPTIONAL
 *  in CommandCreateElementFull) — it annotates the element but adds no DOT
 *  structure. Returns the remainder with the URL removed. */
export function stripUrl(rest: string): string {
  return rest.replace(/\[\[[^\]]*(?:\][^\]]+)*\]\]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Splits `rest` into a leading quoted span (delimiters + content, BOTH
 * untouched) and everything after it. `undefined` when `rest` does not
 * start with `"` or `'`.
 *
 * `CommandCreateElementFull`'s `CODE_WITH_QUOTE`/`DISPLAY` alternatives are a
 * single lazy-quoted match (`[%g].+?[%g]`) consumed whole as the entity's
 * CODE/DISPLAY text; `UrlBuilder.OPTIONAL` (the top-level `[[url]]`
 * attachment `stripUrl` exists to remove) is positioned strictly AFTER that
 * whole alternation in the regex concat (getRegexConcat, CODE_WITH_QUOTE
 * then TAGS/STEREOTYPE/UrlBuilder.OPTIONAL) -- it can only ever match text
 * OUTSIDE the quotes, never inside them. An inline `[[...]]` link embedded
 * WITHIN the quotes (e.g. `rectangle "text[[url label]]"`) is part of the
 * display/code text itself, resolved later via inline creole
 * (`resolveInlineLinks`) -- it must survive here verbatim, or two labels
 * differing only inside their embedded link collapse to the same entity
 * CODE (`plans/si5b-stdlib/batch-4/overview.md` T9, vivido-49-nisu863).
 */
export function splitLeadingQuote(rest: string): LeadingQuoteSplit | undefined {
  const quoteChar = rest[0];
  if (quoteChar !== '"' && quoteChar !== "'") return undefined;
  const close = rest.indexOf(quoteChar, 1);
  if (close === -1) return undefined;
  return { quoted: rest.slice(0, close + 1), tail: rest.slice(close + 1) };
}

/**
 * `stripUrl` for a quote's TAIL specifically: removes the `[[url]]` token
 * and collapses internal whitespace runs like `stripUrl`, but trims only
 * the TRAILING edge, never the leading one. A single leading space in the
 * tail is the boundary `RE_SQ_AS_ALIAS`'s `\s+` (single-quote forms
 * require at least one space before `as`) depends on -- `stripUrl`'s full
 * `.trim()` would erase it and re-glue the quote to `as` with zero spaces,
 * which only the DOUBLE-quote alias regexes (`\s*as`) tolerate.
 */
export function stripTrailingUrl(tail: string): string {
  return tail.replace(RE_INLINE_URL_TOKEN, '').replace(RE_WHITESPACE_RUN, ' ').replace(RE_TRAILING_WHITESPACE, '');
}

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

/** Extract trailing color token from a declaration remainder. */
export function extractColor(rest: string): ColorResult | undefined {
  const m = RE_COLOR.exec(rest);
  if (m === null) return undefined;
  return { color: m[1]!, remainder: rest.slice(0, m.index).trimEnd() };
}

/**
 * Extract every `$tag` token (Stereotag.pattern()) from a node-declaration
 * remainder, wherever it sits (TAGS1 before STEREOTYPE, TAGS2 after —
 * CommandCreateElementFull.getRegexConcat:109-111). Tokenizes on whitespace
 * so only a WHOLE token matching the Stereotag shape is treated as a tag —
 * see {@link RE_TAG_TOKEN}.
 */
export function extractTags(rest: string): TagsResult {
  const tags: string[] = [];
  const remainder: string[] = [];
  for (const tok of rest.split(/\s+/).filter((t) => t.length > 0)) {
    if (RE_TAG_TOKEN.test(tok)) tags.push(tok.slice(1));
    else remainder.push(tok);
  }
  return { tags, remainder: remainder.join(' ') };
}

/** Extract angle-bracket stereotype from a link label string. */
export function extractLinkStereotype(raw: string): LinkStereoResult {
  const m = /<<([^>]+)>>/.exec(raw);
  if (m === null) {
    const t = raw.trim();
    return { stereotype: undefined, label: t.length > 0 ? t : undefined };
  }
  const stereotype = m[1]!.trim();
  const remaining = raw.replace(/<<[^>]+>>/, '').trim();
  return { stereotype, label: remaining.length > 0 ? remaining : undefined };
}
