/**
 * CreoleStripeSimpleParser — classifies ONE already-`\n`-split display line
 * into a `StripeStyleType` + its content, per upstream's regex cascade.
 *
 * Upstream: klimt/creole/legacy/CreoleStripeSimpleParser.java's constructor
 * (java :92-159) — tried IN ORDER: `SECTION_HEADER_PATTERN` (`^--([^-]*)--$`),
 * `SECTION_TITLE_PATTERN` (`^==([^=]*)==$`), `SECTION_SEPARATOR_PATTERN`
 * (`^===*==$`), `DOUBLE_DOT_DELIMITED_LINE` (`^\.\.([^.]*)\.\.$`),
 * the three FULL-mode-only list patterns (`ASTERISK_PREFIXED_LINE_PATTERN`
 * `^(\*+)([^*]+(?:[^*]|\*\*[^*]+\*\*)*)$`, `ASTERISK_HEADER_LINE_PATTERN`
 * `^(\*+)([%s].+)$`, `HASH_HEADING_PATTERN` `^(#+)(.+)$` over
 * `CharHidder.hide(line)`), `EQUALS_HEADING_PATTERN` (`^(=+)(.+)$`), else
 * NORMAL.
 *
 * cdd-T28: the three list branches ARE ported now (they were the last
 * unported part of this cascade). Each is gated on `mode ===
 * CreoleMode.FULL` exactly as upstream gates them (java:119,127,136-137) —
 * `CreoleMode.SIMPLE_LINE`, which every class member row uses
 * (`MethodsOrFieldsArea.java:255,264` -> `create8`), must keep drawing a
 * leading `*` or `#` as literal text, so the parameter is REQUIRED to
 * reach this behaviour and defaults to the FULL the description/chrome
 * paths pass. `order` is the delimiter run's length MINUS ONE in all
 * three (java:122,130,140), i.e. nesting depth from 0.
 *
 * G1 I9b's `classifySeparatorLine` (`EntityImageDescriptionSupport.ts`,
 * pre-E2r) already mirrored the FIRST FOUR patterns' EMPTY-capture case only
 * (a bare `----`/`====`/`....`, no text between the delimiters) — this
 * mission subsumes it: `classifyStripeLine` below reimplements those same
 * four patterns faithfully, INCLUDING the non-empty-capture case each one
 * also matches upstream (`--Header--`/`==Header==`/`..Header..`).
 *
 * Jar-verified finding (`component/queue3` displayText
 * `"queue1\n--Header--\ntoto"`, `-DPLANTUML_DETERMINISTIC_TEXT=true`): a
 * non-empty-captured separator line is `StripeStyleType.HORIZONTAL_LINE`
 * upstream too (`CreoleHorizontalLine.create`'s label-drawing branch, run
 * through the REAL creole `Sheet`/`Stripe` pipeline — `CreoleHorizontalLine
 * .java:81-89`/`:73-79`). Below, `bareOrLiteral` still tags this shape
 * `LITERAL` (unchanged runtime `type`, so `StripeSimple.ts#buildLineAtoms`
 * and the two class-member creole call sites that also switch on `.type`
 * — `class-member-creole.ts`, `class-object-member-creole.ts`, none in
 * `cdd5/T5a`'s write-set — keep their existing, pre-existing "render the
 * dots literally" behavior verbatim). What's NEW (T5a, `creole-titled-
 * horizontal-line-literal`, `unknown/pavozu-43-tone454`): the captured
 * title text and its delimiter style are now ALSO carried on the `LITERAL`
 * classification as `titledHorizontalLine`, additive and optional-shaped
 * fields no existing consumer reads. `CreoleParser.ts` (this family's only
 * OTHER write-set file) is the ONE consumer wired to read it: it builds a
 * REAL `CreoleHorizontalLine` atom from `titledHorizontalLine.title`/
 * `.style` instead of calling `buildLiteralAtoms`, matching upstream for
 * the title/body/legend chrome text `CreoleParser` renders
 * (`EntityImageDescriptionDelegates.ts`/`EntityImageDescriptionName.ts`/
 * `blocks-creole.ts`'s `new CreoleParser(...)` call sites). Sequence
 * messages, state text, and class members do not go through `CreoleParser`
 * (`buildLineAtoms` directly) and so keep the pre-existing literal-text
 * divergence for this shape — a residual, out of this task's write-set.
 *
 * A second jar-verified finding (`"queue1\n-----\ntoto"`, a 5-dash run that
 * matches NONE of the four separator patterns — `[^-]*`/`[^.]*` exclude the
 * delimiter character itself, so a run one dash too long never satisfies
 * the EMPTY-OR-labelled bracket shape) confirms upstream genuinely DOES
 * reach the style-command engine as ordinary `NORMAL` text for this case,
 * and the creole `--...--` STRIKE syntax partially matches it (`--` + `-`
 * + `--`, non-greedy) — jar output: a single struck-through `-` `<text>`
 * element, textLength 4.6375. `classifyStripeLine` reports this shape as
 * plain `NORMAL` (routes through the full style-command engine, correctly
 * producing that same struck-through "-"), NOT `LITERAL`.
 *
 * NEW in this mission (I4c mechanism 2/5): `EQUALS_HEADING_PATTERN`
 * (a single leading `=+` run with NO matching trailing `==`, e.g. `==P2`) —
 * previously entirely unclassified (fell through to NORMAL, `==` rendered
 * literally). Now reports `HEADING` with the `=` run's length-1 as `order`
 * and the remaining text (delimiter stripped) as content, matching upstream
 * exactly (`EQUALS_HEADING_PATTERN.matcher(line)`, `StringUtils.trin` applied
 * to the captured group — ported as a plain `.trim()`-equivalent below,
 * `trimHeadingContent`, since `StringUtils.trin` strips only `<= ' '`
 * characters, the same distinction `driver-text-svg.ts#trin` already
 * documents for an unrelated call site — NOT reused directly, that
 * function lives in a different layer and isn't exported).
 *
 * ## T5a: `%newline()` (U+E100) split — {@link splitOnNewlineSentinel}
 *
 * Upstream's OWN `createStripes` method (`CreoleStripeSimpleParser.java:
 * 162-171`) splits the classified line's content on `Jaws.BLOCK_E1_NEWLINE`
 * (U+E100 — `%newline()`'s return value, `tim/builtin/Newline.java`,
 * `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true`), constructing one
 * `StripeSimple` PER resulting piece, all sharing the ONE classification/
 * style the (pre-split) whole line produced. This file did not port that
 * method — only the constructor's classification cascade — so the split
 * never happened; `CreoleParser.ts` (java:113-114's caller, the ONLY
 * consumer wired to this behaviour — see that file's own doc comment)
 * builds `%newline()`-containing text as ONE stripe, and the surviving
 * U+E100 sentinel reaches `UText.ts`'s own display fallback, rendering as
 * "↵" (`unknown/buitin-newline-chr-0`, `unknown/zeraje-11-semu839`).
 * `splitOnNewlineSentinel` below is that missing split, using
 * `BackSlash.hiddenNewLine()` as the genuine U+E100 accessor — the same
 * one `DisplayNewlines.ts#scanSentinelChar` already uses for the identical
 * character (`jaws/Jaws.java:47`), NOT `tim/builtin/jaws-constants.ts`'s
 * own placeholder-scoped export (see that module's own doc comment for why
 * the two are not interchangeable).
 */

import { CreoleMode } from '../CreoleMode.js';
import { BackSlash } from '../../../text/BackSlash.js';

export type StripeClassification =
  | { readonly type: 'HORIZONTAL_LINE'; readonly style: '-' | '=' | '.' }
  | { readonly type: 'HEADING'; readonly content: string; readonly order: number }
  | { readonly type: 'LIST_WITHOUT_NUMBER'; readonly content: string; readonly order: number }
  | { readonly type: 'LIST_WITH_NUMBER'; readonly content: string; readonly order: number }
  | { readonly type: 'NORMAL'; readonly content: string }
  | {
      readonly type: 'LITERAL';
      readonly content: string;
      /** T5a addition — the captured title + delimiter style, for
       *  `CreoleParser.ts`'s own titled-`CreoleHorizontalLine` dispatch
       *  (see the module doc comment's "T5a" section). Every `LITERAL`
       *  this file produces (`bareOrLiteral`'s non-empty branch, the only
       *  producer) sets this; it is not optional. */
      readonly titledHorizontalLine: { readonly style: '-' | '=' | '.'; readonly title: string };
    };

/** Upstream: `CreoleStripeSimpleParser#createStripes` (java:162-171) —
 *  splits the classified line's CONTENT on the `%newline()` sentinel,
 *  producing one entry per resulting stripe. `"".split(sentinel)` and a
 *  sentinel-free string both degenerate to a single-element array, so this
 *  is a no-op for every line that never called `%newline()`. */
export function splitOnNewlineSentinel(content: string): readonly string[] {
  return content.split(BackSlash.hiddenNewLine());
}

const SECTION_HEADER_PATTERN = /^--([^-]*)--$/;
const SECTION_TITLE_PATTERN = /^==([^=]*)==$/;
const SECTION_SEPARATOR_PATTERN = /^=+$/;
const DOUBLE_DOT_PATTERN = /^\.\.([^.]*)\.\.$/;
const EQUALS_HEADING_PATTERN = /^(=+)(.+)$/;
/** java:70 — `^(\*+)([^*]+(?:[^*]|\*\*[^*]+\*\*)*)$`: a `*` run followed by
 *  content that may itself contain `**bold**` runs but no lone `*`. */
const ASTERISK_PREFIXED_LINE_PATTERN = /^(\*+)([^*]+(?:[^*]|\*\*[^*]+\*\*)*)$/;
/** java:71 — `^(\*+)([%s].+)$`; `%s` is upstream's whitespace macro
 *  (`Pattern2#transform`), so the content must START with whitespace. This
 *  is the arm that catches `* **bold**`, which the previous pattern's
 *  `[^*]+` first group cannot. */
const ASTERISK_HEADER_LINE_PATTERN = /^(\*+)(\s.+)$/;
/** java:72 — `^(#+)(.+)$`, matched against `CharHidder.hide(line)`. */
const HASH_HEADING_PATTERN = /^(#+)(.+)$/;

/** Upstream: `StringUtils.trin` — trims only characters whose code point is
 *  <= U+0020, from both ends (NOT JS's `.trim()`, which also strips U+00A0
 *  NBSP — same distinction `driver-text-svg.ts#trin` documents; duplicated
 *  here rather than imported since that function is a different layer's
 *  private helper, and this one-liner is cheaper than threading a new
 *  cross-module dependency for it). */
function trimHeadingContent(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/** Upstream classifies EVERY match of these four patterns as
 *  `HORIZONTAL_LINE` (empty OR non-empty capture alike). This port keeps
 *  the non-empty case tagged `LITERAL` at runtime (see the module doc
 *  comment's "T5a" note for exactly which consumers that preserves), now
 *  additionally carrying the captured title + delimiter style so
 *  `CreoleParser.ts` can build the real upstream `CreoleHorizontalLine`
 *  atom from it. */
function bareOrLiteral(captured: string, style: '-' | '=' | '.', fullLine: string): StripeClassification {
  return captured === ''
    ? { type: 'HORIZONTAL_LINE', style }
    : { type: 'LITERAL', content: fullLine, titledHorizontalLine: { style, title: captured } };
}

/** `CharHidder.hide`/`unhide` (`utils/CharHidder.java`) — upstream hides
 *  the characters that would otherwise be re-read as markup while the
 *  `#`-heading pattern runs, then unhides the captures (java:138,140-141).
 *  This port's `CharHidder` is not ported and the pattern below reads only
 *  a leading `#` run plus the remainder, which no hidden character can
 *  change: `hide` rewrites `\\#`-escaped and `<U+…>`-style sequences, none
 *  of which can create or destroy a LEADING `#`. Documented rather than
 *  silently skipped. */
function listClassification(line: string, mode: CreoleMode): StripeClassification | null {
  if (mode !== CreoleMode.FULL) return null;

  // java:119-126.
  const bullet = ASTERISK_PREFIXED_LINE_PATTERN.exec(line);
  if (bullet !== null) {
    return { type: 'LIST_WITHOUT_NUMBER', content: trimHeadingContent(bullet[2]!), order: bullet[1]!.length - 1 };
  }

  // java:127-135 — the SECOND asterisk arm, a distinct pattern upstream
  // tries only after the first fails; both yield LIST_WITHOUT_NUMBER.
  const bulletHeader = ASTERISK_HEADER_LINE_PATTERN.exec(line);
  if (bulletHeader !== null) {
    return {
      type: 'LIST_WITHOUT_NUMBER',
      content: trimHeadingContent(bulletHeader[2]!),
      order: bulletHeader[1]!.length - 1,
    };
  }

  // java:136-144.
  const numbered = HASH_HEADING_PATTERN.exec(line);
  if (numbered !== null) {
    return { type: 'LIST_WITH_NUMBER', content: trimHeadingContent(numbered[2]!), order: numbered[1]!.length - 1 };
  }
  return null;
}

export function classifyStripeLine(line: string, mode: CreoleMode = CreoleMode.FULL): StripeClassification {
  const header = SECTION_HEADER_PATTERN.exec(line);
  if (header !== null) return bareOrLiteral(header[1]!, '-', line);

  const title = SECTION_TITLE_PATTERN.exec(line);
  if (title !== null) return bareOrLiteral(title[1]!, '=', line);

  if (line.length >= 4 && SECTION_SEPARATOR_PATTERN.test(line)) return { type: 'HORIZONTAL_LINE', style: '=' };

  const dots = DOUBLE_DOT_PATTERN.exec(line);
  if (dots !== null) return bareOrLiteral(dots[1]!, '.', line);

  const list = listClassification(line, mode);
  if (list !== null) return list;

  const heading = EQUALS_HEADING_PATTERN.exec(line);
  if (heading !== null) {
    return { type: 'HEADING', content: trimHeadingContent(heading[2]!), order: heading[1]!.length - 1 };
  }

  return { type: 'NORMAL', content: line };
}
