/**
 * Shared regex constants, stop-keyword matching, and the mutable parse
 * context/result shapes for the activity diagram recursive-descent parser.
 * Split out of parser.ts (mission G0b/T6) purely to keep `node-dispatch.ts`
 * (which needs these) and `parser.ts` under the project's 500-line file cap
 * -- no behavior change; every export here is verbatim code moved from
 * parser.ts.
 */

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityNode } from './ast.js';

// ---------------------------------------------------------------------------
// Regex constants
// ---------------------------------------------------------------------------

/** Matches a swimlane header: |name| or |[#color]name| */
export const RE_SWIMLANE = /^\|(?:\[#[^\]]*\])?([^|]+)\|\s*$/;

/**
 * Trailing stereogroup fragment: one or more consecutive `<<...>>` runs.
 * Inlined (not shared via `new RegExp` string-building) into every
 * constant below that accepts one, mirroring `Stereogroup.optionalStereogroup`
 * (`stereo/Stereogroup.java:69-72`, `(<<[^<>]+>>(?:[%s]*<<[^<>]+>>)*)`),
 * widened from a single `<<...>>` capture (mission ubrr-T10 M4a/M3): only
 * the FIRST stereogroup's inner text is captured anywhere in this file
 * (existing convention, `stereotype` is a single field) -- the rest are
 * matched so the line itself does not fail to parse, never captured.
 */

/** Matches an action line: :label; or :label; <<stereo>> or :label; #color */
export const RE_ACTION = /^:(.+?);\s*(?:<<([^>]*)>>(?:\s*<<[^>]*>>)*)?\s*(?:(#\w+))?\s*$/;

/** Closing line of a multi-line action: content; optionally followed by <<stereo>> */
export const RE_ACTION_CLOSE = /^(.*?);\s*(?:<<([^>]*)>>(?:\s*<<[^>]*>>)*)?\s*$/;

/**
 * `* label` / `- label` list-item activity shorthand: a plain activity,
 * `BoxStyle.PLAIN` regardless of any stereotype (`executeArg` passes the
 * constant, never `stereogroup.getBoxStyle()` -- unlike a `:label;`
 * action, list items never render as parallelogram/chevron even when
 * stereotyped `<<save>>`/`<<input>>`/`<<output>>`; this port maps to the
 * same `ActivityAction` kind as `:label;` regardless, so that divergence
 * is pre-existing and out of THIS mechanism's scope, not introduced here).
 * A nested second marker (`** B`) is NOT consumed by this regex -- it
 * lands inside `LABEL` as literal text, matching upstream's own
 * `CommandActivityList`; the bullet-GLYPH rendering that would otherwise
 * draw is Creole's `LIST_WITHOUT_NUMBER`, already documented elsewhere as
 * unported (`core/klimt/creole/legacy/CreoleStripeSimpleParser.ts`).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandActivityList.java:56-113
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:160
 *   -- registration.
 */
export const RE_ACTIVITY_LIST = /^[-*]\s?(.*?)\s*(?:<<[^>]*>>(?:\s*<<[^>]*>>)*)?\s*$/;

/**
 * `backward:LABEL;` -- base form only, see {@link ActivityBackward}'s own
 * doc for scope. The single-line form (this constant); the multiline
 * head/close pair lives in `node-dispatch.ts#tryBackward`, reusing
 * {@link RE_ACTION_CLOSE} for its closer (identical shape: content, `;`,
 * optional stereogroup(s), end).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandBackward3.java:73-88
 */
export const RE_BACKWARD = /^backward\s*:\s*(.+?)\s*;\s*(?:<<[^>]*>>(?:\s*<<[^>]*>>)*)?\s*$/i;

/** `backward:` with no closing `;` on the same line -- the multiline
 *  opener `node-dispatch.ts#tryBackward` checks after {@link RE_BACKWARD}
 *  fails to match. */
export const RE_BACKWARD_HEAD = /^backward\s*:(.*)$/i;

/**
 * `if (test) then (label)?`, now also accepting a trailing stereogroup
 * (mission ubrr-T10 M4a): `CommandIf2` ends in
 * `Stereogroup.optionalStereogroup()` before `end()`, which the pre-T10
 * regex had no arm for at all.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandIf2.java:60-80
 */
export const RE_IF = /^if\s*\(([^)]*)\)\s*(?:then\s*(?:\(([^)]*)\))?)?\s*(?:<<[^<>]+>>(?:\s*<<[^<>]+>>)*)?\s*$/i;

/**
 * `if (test) is|equals (value) then`, the leading `is`/`equals` synonym
 * for a bare-`then` clause used nowhere else -- `WHEN` fills the same
 * `thenLabel` slot `RE_IF`'s own `(label?)` group fills, since both
 * commands hand it to the identical `diagram.startIf(test, when, ...)`
 * call.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandIf4.java:60-81
 */
export const RE_IF4 =
  /^if\s*\(([^)]*)\)\s*(?:is|equals?)\s*\(([^)]*)\)\s*then\s*(?:<<[^<>]+>>(?:\s*<<[^<>]+>>)*)?\s*$/i;

/**
 * Legacy `if (test) then when LABEL` spelling -- no parens around the
 * label, mandatory `then` AND `when`.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandIfLegacy1.java:56-71
 */
export const RE_IF_LEGACY = /^if\s*\(([^)]*)\)\s*then\s+when\s+(.*)$/i;

/** elseif (condition?) then (label?) — accepts `elseif` and `else if`,
 *  now also a trailing stereogroup (`CommandElseIf2.java` ends the same
 *  way `CommandIf2` does -- see {@link RE_IF}'s own doc). */
export const RE_ELSEIF =
  /^else\s*if\s*\(([^)]*)\)\s*(?:then\s*(?:\(([^)]*)\))?)?\s*(?:<<[^<>]+>>(?:\s*<<[^<>]+>>)*)?\s*$/i;

/** else (label?) */
export const RE_ELSE = /^else\s*(?:\(([^)]*)\))?\s*$/i;

/** Legacy `else when LABEL` spelling, the companion of {@link RE_IF_LEGACY}.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandElseLegacy1.java:56-68
 */
export const RE_ELSE_LEGACY = /^else\s+when\s+(.*)$/i;

/** `endif`, now also a trailing stereogroup (`CommandEndif3` ends in
 *  `Stereogroup.optionalStereogroup()` too -- an exact-string `'endif'`
 *  check would otherwise silently swallow every line up to the NEXT
 *  bare `endif`, since {@link consumeIfClauses}'s `'unexpected'` fallback
 *  keeps scanning rather than refusing).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandEndif3.java:56-67
 */
export const RE_ENDIF = /^endif(?:\s*<<[^<>]+>>(?:\s*<<[^<>]+>>)*)?$/i;

/**
 * `switch (test)`, optionally a trailing stereogroup. The leading
 * `ColorParser.exp4()` color is out of scope (no fixture in this
 * mechanism's cohort exercises it, matching the same leading-color
 * omission `RE_IF`'s own history already established).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandSwitch.java:60-70
 */
export const RE_SWITCH = /^switch\s*\(([^)]*)\)\s*(?:<<[^<>]+>>(?:\s*<<[^<>]+>>)*)?\s*$/i;

/** `case (value)` -- no trailing stereogroup on this one, unlike its
 *  siblings (`CommandCase.java` has no `Stereogroup` at all).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCase.java:56-63
 */
export const RE_CASE = /^case\s*\(([^)]*)\)\s*$/i;

/** `endswitch`, optionally a trailing stereogroup (same shape as
 *  {@link RE_ENDIF}).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandEndSwitch.java:58-63
 */
export const RE_ENDSWITCH = /^endswitch(?:\s*<<[^<>]+>>(?:\s*<<[^<>]+>>)*)?$/i;

/**
 * `partition|package|rectangle|card|group NAME {`?, bracketed or not
 * (mission ubrr-T10 M6). Leading `BACK1` color and trailing `BACK2`/
 * `STEREO` are out of scope (no fixture in this mechanism's cohort
 * exercises them, same omission `RE_IF`'s own history already
 * established for a leading color). Group 2 is the quoted name (may
 * contain anything but a literal `"`); group 3 is the unquoted lazy
 * fallback (matches even `<$sprite{...}>`'s own embedded braces, since
 * `.` is unrestricted); group 4 is the literal `{` when present.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandPartition3.java:64-80
 */
export const RE_GROUP_OPEN = /^(partition|package|rectangle|card|group)\s+(?:"([^"]+)"|(.*?))\s*(\{)?\s*$/i;

/** `}` -- the non-deprecated closer.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCloseGroup3.java:56-63
 */
export const RE_CLOSE_GROUP = /^\}$/;

/** `end group` / `endgroup` / `group end` / `groupend` -- the legacy
 *  closer (`"end ?group|group ?end"`, single OPTIONAL space each).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandCloseGroupLegacy3.java:56-63
 */
export const RE_CLOSE_GROUP_LEGACY = /^(?:end\s?group|group\s?end)$/i;

/** while (condition) [is|equals (yesLabel)] */
export const RE_WHILE = /^while\s*\(([^)]*)\)\s*(?:(?:is|equals?)\s*\(([^)]*)\))?\s*$/i;

/**
 * `endwhile` / `end while` / `while end` (exitLabel?) -- `CommandWhileEnd3`
 * is a `RegexOr` of both two-word spellings in addition to the one-word
 * form; the pre-T10 regex only had the one-word arm.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandWhileEnd3.java:58-76
 */
export const RE_ENDWHILE = /^(?:end\s*while|while\s*end)\s*(?:\(([^)]*)\))?\s*$/i;

/** repeatwhile / repeat while (condition?) [is (yesLabel)] [not (noLabel)] */
export const RE_REPEATWHILE =
  /^repeat\s*while(?:\s*\(([^)]*)\))?(?:\s*(?:is|equals?)\s*\(([^)]*)\))?(?:\s*not\s*\(([^)]*)\))?\s*$/i;

/**
 * Single-line note: "note (left|right)? : text"  — the direction is
 * optional. When omitted the note defaults to floating to the right of
 * the previous activity (matches upstream PlantUML behaviour).
 */
export const RE_NOTE_SINGLE = /^note(?:\s+(left|right))?\s*:\s*(.+)$/i;

/** note (left|right)? (multi-line) — direction defaults to right when absent */
export const RE_NOTE_MULTI = /^note(?:\s+(left|right))?\s*$/i;

/**
 * Matches arrow-label lines:
 *   -> label ;
 *   -><back:color> label ;
 *   -><color:color> label ;
 *
 * Capture group 1: optional color value (e.g. "red", "#FF0000")
 * Capture group 2: label text
 */
export const RE_ARROW_LABEL = /^->(?:<(?:back|color):([^>]+)>)?\s*(.*?)\s*;?\s*$/i;

/** `repeat` head, optionally followed by an inline action on the same
 *  line (`repeat :foo;`). Built via `new RegExp` (not a `/.../ ` literal):
 *  Lizard 1.23.0 miscounts brace depth for a trailing `$` inside a /regex/
 *  literal that sits INSIDE a function body -- this constant used to live
 *  inline in `parseNodes` and silently truncated that function's CCN/NLOC
 *  measurement (and defeated `#lizard forgives`) until hoisted here. */
export const RE_REPEAT_HEAD = new RegExp('^repeat(?:\\s+(.*))?$', 'i');

/** Trailing `;` (optionally `<<stereo>>`) on a `repeat`'s inline action --
 *  same lizard brace-depth workaround as {@link RE_REPEAT_HEAD} above, and
 *  additionally contains `<`/`>`, which the project's regex-hoisting
 *  convention also requires building from a string. */
export const RE_REPEAT_INLINE_TERMINATOR = new RegExp(';\\s*(?:<<[^>]*>>)?\\s*(?:#\\w+)?\\s*$');

/** Literal `\n` (backslash-n) escape inside an action label -> real
 *  newline. Hoisted alongside the constants above for the same lizard
 *  brace-depth workaround (empirically, this one also contributed to the
 *  false truncation even though it carries none of `$<>{}`). */
export const RE_ESCAPED_NEWLINE = /\\n/g;

// ---------------------------------------------------------------------------
// Stop-keyword matching
//
// Stop keywords are word-prefix patterns: a line matches a stop keyword if
// the trimmed lowercase line equals the keyword OR starts with the keyword
// followed by a space. This handles `endwhile (label)`, `elseif (cond) then`,
// `repeatwhile (cond)`, etc.
// ---------------------------------------------------------------------------

export type StopKeywords = readonly string[];

export function matchesStopKeyword(lineLc: string, stops: StopKeywords): boolean {
  for (const kw of stops) {
    if (lineLc === kw || lineLc.startsWith(kw + ' ') || lineLc.startsWith(kw + '(')) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Mutable parse context (shared across recursive calls)
// ---------------------------------------------------------------------------

export interface ParseContext {
  lines: readonly string[];
  swimlanes: string[];
  swimlaneSet: Set<string>;
  currentSwimlane: string | undefined;
  /** title/caption/legend/header/footer/mainframe chrome (mission G0b/T6),
   *  mutated in place by `matchAnnotationCommand` during `parseNodes`. */
  annotations: DiagramAnnotations;
  /** `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4),
   *  mutated in place by `matchSpriteCommand` during `parseNodes`, tried
   *  immediately after `matchAnnotationCommand` in `tryAnnotation`/
   *  `trySprite` (node-dispatch.ts). */
  sprites: SpriteRegistry;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function setCurrentSwimlane(ctx: ParseContext, name: string): void {
  ctx.currentSwimlane = name;
  if (!ctx.swimlaneSet.has(name)) {
    ctx.swimlaneSet.add(name);
    ctx.swimlanes.push(name);
  }
}

export function swimlaneSpread(ctx: ParseContext): { swimlane: string } | Record<string, never> {
  return ctx.currentSwimlane !== undefined ? { swimlane: ctx.currentSwimlane } : {};
}

// ---------------------------------------------------------------------------
// Core recursive descent
// ---------------------------------------------------------------------------

export interface ParseResult {
  nodes: ActivityNode[];
  nextIdx: number;
}

/**
 * `parseNodes`'s full outcome (mission dispatch-by-parse-attempt/T6): a
 * successful body parse, or a refusal propagated up from a line that no
 * command recognised anywhere inside that body. Every recursive body (if
 * then/elseif/else, while, repeat, fork branch, split branch) must check
 * this arm and propagate it unchanged -- upstream's single flat per-line
 * loop has exactly one refusal point (`PSystemCommandFactory.java:169-175`);
 * this port's recursive descent has many call sites that must all forward
 * the same refusal rather than swallowing it.
 */
export type ParseOutcome = ParseResult | ParseRefusal;

/** Narrows a `ParseOutcome`-shaped union to its refusal arm. `refused` is
 *  the discriminant (T1): no success shape in this file ever carries it. */
export function isRefusal<T>(x: T | ParseRefusal): x is ParseRefusal {
  return typeof x === 'object' && x !== null && 'refused' in x;
}

// ---------------------------------------------------------------------------
// Line-dispatch shared shapes (node-dispatch.ts, if-dispatch.ts)
// ---------------------------------------------------------------------------

/** One line-shape handler's outcome: the new `idx` (always present, even
 *  on a 1-line skip) and the single node it produced, if any -- every
 *  construct in the dispatch chain (including if/while/repeat/fork/split,
 *  each of which owns a nested body) produces at most one top-level node
 *  per invocation. */
export interface DispatchResult {
  idx: number;
  node?: ActivityNode;
}

/** A handler either declines (`null`), matches (`DispatchResult`), or --
 *  for the five handlers owning a nested body (if/while/repeat/fork/split)
 *  -- propagates a `ParseRefusal` surfaced from within that body. */
export type LineHandler = (
  ctx: ParseContext,
  idx: number,
  line: string,
  lc: string,
) => DispatchResult | ParseRefusal | null;
