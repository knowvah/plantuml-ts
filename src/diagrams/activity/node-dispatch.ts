/**
 * Core recursive-descent line dispatch (mission G0b/T6: split out of
 * parser.ts to stay under the 500-line file cap; behavior change limited
 * to the annotation-matcher wiring in `tryAnnotation` below).
 *
 * Each `try*` function below handles exactly one line-shape from the
 * original single-function dispatch chain, in the SAME priority order as
 * before -- a mechanical extraction (no behavior change) forced by Lizard
 * 1.23.0's TypeScript reader misattributing this function's complexity
 * regardless of `#lizard forgives` placement (its "optimistic function"
 * push/pop heuristic for `identifier(` call sites loses track of the
 * enclosing function partway through a chain this long); splitting into
 * small named functions sidesteps the tool bug instead of fighting it.
 */

import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityAction, ActivityArrowLabel, ActivityNode, ActivityRepeat, ActivityWhile } from './ast.js';
import {
  RE_ACTION,
  RE_ARROW_LABEL,
  RE_ENDWHILE,
  RE_REPEAT_HEAD,
  RE_REPEAT_INLINE_TERMINATOR,
  RE_REPEATWHILE,
  RE_SWIMLANE,
  RE_WHILE,
  isRefusal,
  matchesStopKeyword,
  setCurrentSwimlane,
  swimlaneSpread,
  tryAssumeTransparent,
  type DispatchResult,
  type LineHandler,
  type ParseContext,
  type ParseOutcome,
  type StopKeywords,
} from './dispatch-support.js';
import { tryIf, unescapeLabel, unescapeLabelNewlines } from './if-dispatch.js';
import { tryFork, trySplit } from './parallel-dispatch.js';
import {
  tryActivityList,
  tryBackward,
  tryCircleSpot,
  tryGoto,
  tryLabel,
  pushParsedNode,
} from './list-backward-dispatch.js';
import { singleLineArrowLabel, tryArrowLong } from './dispatch-arrow-long.js';
import { displayWithNewlines } from './dispatch-newline-sentinels.js';
import { readMultilineActionBody } from './dispatch-multiline-body.js';
import { extractLeadingCaseNotes, tryOpenSwitch } from './switch-dispatch.js';
import { tryOpenGroup } from './group-dispatch.js';
import { redirectNoteOntoGroup, redirectNoteOntoWhile, tryNoteMulti, tryNoteSingle } from './note-dispatch.js';
import {
  tryAnnotation,
  tryIgnoredCommonCommand,
  tryLink3,
  tryPragma,
  trySprite,
  tryScale,
} from './dispatch-common-commands.js';
import { stereogroupBackColor, stereogroupStereotype } from './dispatch-stereogroup.js';

// ---------------------------------------------------------------------------
// Swimlane header: |name| or |[#color]name|
// ---------------------------------------------------------------------------
function trySwimlane(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const m = RE_SWIMLANE.exec(line);
  if (m === null) return null;
  // `CommandSwimlane.java:63` `([^|]+)`, untrimmed: `Swimlanes#getOrCreate`
  // (`Swimlanes.java:168-176`) matches it by exact `equals`, and
  // `Swimlane.java:60` displays it verbatim.
  const name = m[2]!;
  setCurrentSwimlane(ctx, name, m[1]);
  recordSwimlaneDisplay(ctx, name, line);
  return { idx: idx + 1 };
}

/** Per-parse `|name|LABEL` displays, keyed by the parse's own context. */
const SWIMLANE_DISPLAYS = new WeakMap<ParseContext, Map<string, string>>();

/**
 * `LABEL ([^|]+)?` is everything after the closing `|` (it can hold no
 * `|`), passed raw -- leading space included -- to `Display.getWithNewlines`
 * and, when non-null, `setDisplay` on the lane; a later bare `|name|` leaves
 * the display unchanged.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandSwimlane.java:65,97-98
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:163-164
 */
function recordSwimlaneDisplay(ctx: ParseContext, name: string, line: string): void {
  const label = line.trimEnd().slice(line.trimEnd().lastIndexOf('|') + 1);
  if (label === '') return;
  let displays = SWIMLANE_DISPLAYS.get(ctx);
  if (displays === undefined) SWIMLANE_DISPLAYS.set(ctx, (displays = new Map<string, string>()));
  displays.set(name, label);
}

/** The `|name|LABEL` displays recorded during this parse (empty if none). */
export function swimlaneDisplaysOf(ctx: ParseContext): ReadonlyMap<string, string> {
  return SWIMLANE_DISPLAYS.get(ctx) ?? new Map<string, string>();
}

// ---------------------------------------------------------------------------
// start / stop / end / kill / detach / break
// ---------------------------------------------------------------------------
function trySimpleKeyword(ctx: ParseContext, idx: number, _line: string, lc: string): DispatchResult | null {
  switch (lc) {
    case 'start':
      return { idx: idx + 1, node: { kind: 'start', ...swimlaneSpread(ctx) } };
    case 'stop':
      return { idx: idx + 1, node: { kind: 'stop', ...swimlaneSpread(ctx) } };
    case 'end':
      return { idx: idx + 1, node: { kind: 'end', ...swimlaneSpread(ctx) } };
    case 'kill':
      return { idx: idx + 1, node: { kind: 'kill', ...swimlaneSpread(ctx) } };
    case 'detach':
      return { idx: idx + 1, node: { kind: 'detach', ...swimlaneSpread(ctx) } };
    case 'break':
      return { idx: idx + 1, node: { kind: 'break', ...swimlaneSpread(ctx) } };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Action: :label; or :label; #color  or multiline :label\n...\n;
// ---------------------------------------------------------------------------
function tryAction(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const actionMatch = RE_ACTION.exec(line);
  if (actionMatch === null) return null;
  const label = displayWithNewlines(ctx.pragma, actionMatch[1]!);
  const stereotype = stereogroupStereotype(actionMatch[2]);
  const color = stereogroupBackColor(actionMatch[2]);
  const node: ActivityAction = {
    kind: 'action',
    label,
    ...(stereotype !== undefined ? { stereotype } : {}),
    ...(color !== undefined ? { color } : {}),
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

export { readMultilineActionBody, type MultilineActionBody } from './dispatch-multiline-body.js';

/** Multiline action: any `:` line {@link tryAction} did not take.
 *  `CommandMultilines2#isValid` (`command/CommandMultilines2.java:98-107`)
 *  never tests the FIRST line against the END pattern, so a `;` on it --
 *  `:x; <<save>> #pink`, which matches no single-line command -- does not
 *  close the block (`CommandActivityLong3.java:79-82`). */
function tryMultilineAction(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!line.startsWith(':')) return null;
  // isw-T2-act F2: `":" DATA(.*)` with no space leaf (`CommandActivityLong3
  // .java:81-82`), and `removeStartingAndEnding(DATA, 0)` (`:139`) keeps it
  // as the first line even when empty -- the jar draws that line.
  const labelParts: string[] = [line.slice(1)];
  const body = readMultilineActionBody(ctx, idx + 1, labelParts);
  const node: ActivityAction = {
    kind: 'action',
    // isw-T2-act F7: `lines.toDisplay()` is `Display.createFoo` (`BlocLines.java:
    // 124-128`, `Display.java:185-198`) -- no newline scan; a `%newline()`
    // sentinel reaches the creole parser, which splits a plain line on it
    // (`CreoleStripeSimpleParser.java:164`) and a table cell keeps it.
    label: body.labelParts.join('\n'),
    ...(body.multiStereo !== undefined ? { stereotype: body.multiStereo } : {}),
    ...(body.multiColor !== undefined ? { color: body.multiColor } : {}),
    ...swimlaneSpread(ctx),
  };
  return { idx: body.cursor, node };
}

// ---------------------------------------------------------------------------
// while / endwhile
// ---------------------------------------------------------------------------
/**
 * Captures the `while`'s swimlane at its opener, not its closer.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:397
 *   -- `new InstructionWhile(swimlanes.getCurrentSwimlane(), ...)`, taken
 *   when the `while` line itself is parsed, before the body.
 */
function tryWhile(ctx: ParseContext, idx: number, line: string): DispatchResult | ParseRefusal | null {
  const whileMatch = RE_WHILE.exec(line);
  if (whileMatch === null) return null;
  const { lines } = ctx;
  const condition = whileMatch[1]!;
  const yesLabel = whileMatch[2];
  // Mission `activity-lane-capture` D1/T4: read BEFORE the body parses, so
  // a lane switch inside the body never leaks into this node's own
  // `swimlane`.
  const openerSwimlane = swimlaneSpread(ctx);
  // `['end while', 'while end']` per RE_ENDWHILE's own doc: CommandWhileEnd3
  // is a RegexOr of both two-word spellings; matchesStopKeyword needs its
  // own entry for each (mission ubrr-T10 M5).
  const bodyResult = parseNodes(ctx, idx + 1, ['endwhile', 'end while', 'while end']);
  if (isRefusal(bodyResult)) return bodyResult;
  let cursor = bodyResult.nextIdx;
  let exitLabel: string | undefined;
  if (cursor < lines.length) {
    const endLine = lines[cursor]!.trim();
    const endwhileMatch = RE_ENDWHILE.exec(endLine);
    if (endwhileMatch !== null) exitLabel = endwhileMatch[1];
    cursor++;
  }
  // `InstructionWhile#addNote` (`InstructionWhile.java:162-167`): a note
  // while `repeatList` is still empty is the while's OWN note.
  const { body, notes } = extractLeadingCaseNotes(bodyResult.nodes);
  const node: ActivityWhile = {
    kind: 'while',
    condition,
    ...(yesLabel !== undefined && yesLabel !== '' ? { yesLabel } : {}),
    ...(exitLabel !== undefined && exitLabel !== '' ? { exitLabel } : {}),
    body,
    ...(notes.length > 0 ? { notes } : {}),
    ...openerSwimlane,
  };
  return { idx: cursor, node };
}

// ---------------------------------------------------------------------------
// repeat / repeatwhile
// `repeat` may stand alone or be followed by an inline action:
//   repeat :foo;  <<stereo>>
// The action becomes the ENTRY tile (`ActivityRepeat.entry`), never a body
// element.
// ---------------------------------------------------------------------------

/**
 * Parses the inline action on `repeat :label;`, if present, into the
 * repeat's ENTRY tile. `undefined` for a bare `repeat`.
 * @see net/sourceforge/plantuml/activitydiagram3/CommandRepeat3.java:126
 *   -- the inline label is handed to `ActivityDiagram3#startRepeat`.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:51
 *   -- stored as `startLabel`, handed to `factory.repeat(…, startLabel,
 *   …)` (`:166-167`) as the tile that replaces the entry diamond
 *   (`ftile/vcompact/FtileRepeat.java:77-80`).
 */
function parseRepeatEntry(ctx: ParseContext, inlineRest: string | undefined): ActivityAction | undefined {
  if (inlineRest === undefined || inlineRest === '') return undefined;
  // Parse the inline content as a virtual line — most commonly an action
  // :label; with optional <<stereotype>>. The action regex requires a `;`
  // followed by optional stereotype/color suffixes, so leave the line as-is
  // when it already terminates properly and only synthesize a `;` for bare
  // `:label`.
  const restLine = RE_REPEAT_INLINE_TERMINATOR.test(inlineRest) ? inlineRest : inlineRest + ';';
  const actionM = RE_ACTION.exec(restLine);
  if (actionM === null) return undefined;
  const label = displayWithNewlines(ctx.pragma, actionM[1]!);
  const stereotype = stereogroupStereotype(actionM[2]);
  const color = stereogroupBackColor(actionM[2]);
  return {
    kind: 'action',
    label,
    ...(stereotype !== undefined ? { stereotype } : {}),
    ...(color !== undefined ? { color } : {}),
    ...swimlaneSpread(ctx),
  };
}

interface RepeatClose {
  readonly condition: string;
  readonly yesLabel: string | undefined;
  readonly outLabel: string | undefined;
  readonly nextIdx: number;
}

/**
 * Parses the `repeatwhile`/`repeat while` closer line, including its
 * `is (…)`/`not (…)` side labels.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:359-371
 *   -- `repeatWhile(label, yes, out, …)`.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:193-200
 *   -- `setTest` stores `yesTb`/`outTb`, drawn on the condition hexagon
 *   (`ftile/vcompact/FtileRepeat.java:150-151`). xabesu-51-dimi831 (T3i):
 *   `CommandRepeatWhile3.java:144-147` routes TEST/WHEN/OUT through the
 *   same `Display.getWithNewlines` escape as `if`/`elseif` (IFNL, T3d).
 */
function parseRepeatClose(lines: readonly string[], cursor: number): RepeatClose {
  if (cursor >= lines.length) return { condition: '', yesLabel: undefined, outLabel: undefined, nextIdx: cursor };
  const endLine = lines[cursor]!.trim();
  const repeatMatch = RE_REPEATWHILE.exec(endLine);
  const condition = unescapeLabelNewlines(repeatMatch?.[1] ?? '');
  const yesLabel = unescapeLabel(repeatMatch?.[2]);
  const outLabel = unescapeLabel(repeatMatch?.[3]);
  return { condition, yesLabel, outLabel, nextIdx: cursor + 1 };
}

/**
 * Captures the `repeat`'s swimlane at its opener, and `swimlaneOut` at
 * `repeat while`, not at a single closer.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:107
 *   -- `this.swimlane = swimlanes.getCurrentSwimlane()`, taken when the
 *   `repeat` line itself is parsed, before the body.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionRepeat.java:194-196
 *   -- `setTest` stores `swimlaneOut`, taken when `repeat while` is parsed
 *   (`ActivityDiagram3.java:367`).
 */
function tryRepeat(ctx: ParseContext, idx: number, line: string, lc: string): DispatchResult | ParseRefusal | null {
  const repeatHeadMatch = RE_REPEAT_HEAD.exec(line);
  if (repeatHeadMatch === null || !lc.startsWith('repeat')) return null;
  // Mission `activity-lane-capture` D1/T5: read BEFORE the body parses, so
  // a lane switch inside the body never leaks into this node's own
  // `swimlane`.
  const openerSwimlane = swimlaneSpread(ctx);
  const entry = parseRepeatEntry(ctx, repeatHeadMatch[1]?.trim());
  const bodyResult = parseNodes(ctx, idx + 1, ['repeatwhile', 'repeat while']);
  if (isRefusal(bodyResult)) return bodyResult;
  const close = parseRepeatClose(ctx.lines, bodyResult.nextIdx);
  // Mission activity-lane-capture D1/T5: `swimlaneOut` is the lane current
  // AT `repeat while`, which may differ from the opener's.
  const closerSwimlane = ctx.currentSwimlane;
  const node: ActivityRepeat = {
    kind: 'repeat',
    ...(entry !== undefined ? { entry } : {}),
    body: bodyResult.nodes,
    condition: close.condition,
    ...(close.yesLabel !== undefined && close.yesLabel !== '' ? { yesLabel: close.yesLabel } : {}),
    ...(close.outLabel !== undefined && close.outLabel !== '' ? { outLabel: close.outLabel } : {}),
    ...openerSwimlane,
    ...(closerSwimlane !== undefined ? { swimlaneOut: closerSwimlane } : {}),
  };
  return { idx: close.nextIdx, node };
}

/** `CommandArrow3` (`CommandArrow3.java:61-71`): `-> label;`,
 *  `-[#red]-> label;`, bare `-[#red]->`. The label is `Display.
 *  getWithNewlines(pragma, label)` (`:110`): `\\n` becomes a line break
 *  here, once; `<back:>`/`<color:>` stay in the label for creole. */
function tryArrowLabel(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!line.startsWith('-')) return null;
  const arrowMatch = RE_ARROW_LABEL.exec(line);
  if (arrowMatch === null) return null;
  const style = arrowMatch[1];
  const label = singleLineArrowLabel(ctx, arrowMatch[2] ?? '');
  const node: ActivityArrowLabel = {
    kind: 'arrow-label',
    label,
    ...(style !== undefined ? { style } : {}),
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

// `tryAnnotation`/`trySprite`/`tryScale`/`tryPragma` (D12/T1p-b) moved to
// `dispatch-common-commands.ts` to keep this file under the 500-line cap
// (it was already at the exact limit) -- see that file's own doc comment.

const LINE_HANDLERS: readonly LineHandler[] = [
  trySwimlane,
  trySimpleKeyword,
  // `(X)` circled-spot connector: registered right after Start3/Stop3
  // upstream (`ActivityDiagramFactory3.java:144`) -- `trySimpleKeyword`
  // above covers start/stop/end/kill/detach/break together.
  tryCircleSpot,
  tryAction,
  tryMultilineAction,
  // `partition`/`group` (mission ubrr-T10 M6) registered upstream BEFORE
  // the if-family (`ActivityDiagramFactory3.java:110-113`, right after
  // the swimlane commands).
  tryOpenGroup,
  tryBackward,
  tryIf,
  tryOpenSwitch,
  tryWhile,
  tryRepeat,
  tryFork,
  trySplit,
  tryNoteSingle,
  tryNoteMulti,
  tryArrowLabel,
  tryArrowLong,
  tryAnnotation,
  // D12/T1p-b: `!pragma` registered BEFORE sprite within `addCommonCommands2`
  // (`CommonCommands.java:62-89`).
  tryPragma,
  trySprite,
  tryScale,
  tryIgnoredCommonCommand,
  tryLink3,
  tryAssumeTransparent,
  // Tried LAST, immediately before the unknown-line fallback: `[-*]` is a
  // broad prefix (mission ubrr-T10 M1) and upstream itself registers
  // `CommandActivityList` after every other body command
  // (`ActivityDiagramFactory3.java:160`, right before `CommandLabel`/
  // `CommandGoto`).
  tryActivityList,
  // `label NAME` / `goto NAME`: registered LAST upstream, after
  // ActivityList (`ActivityDiagramFactory3.java:160-161`).
  tryLabel,
  tryGoto,
];

/**
 * Dispatch one non-blank, pre-stripped line: the first handler in
 * {@link LINE_HANDLERS} that recognizes it wins (same priority order as
 * the original single-function dispatch chain).
 *
 * An unrecognized line now REFUSES (mission dispatch-by-parse-attempt/T6)
 * instead of being skipped silently. This mirrors upstream's `getCandidate`
 * returning `null` when no registered `Command` matches, at which point
 * `executeFewLines` builds `SYNTAX_ERROR "Syntax Error?"` and the factory
 * hands that back as the diagram
 * (`~/git/plantuml/.../command/PSystemCommandFactory.java:169-175`).
 *
 * `idx` doubles as upstream's `trace.size()` (lines consumed before the
 * failure): every line in `[0, idx)` was already accounted for by a prior
 * dispatch match or a blank-line skip, since `parseNodes`'s cursor only
 * ever advances forward. `consumed = idx` needs no separate counter.
 */
function dispatchLine(ctx: ParseContext, idx: number, line: string, lc: string): DispatchResult | ParseRefusal {
  for (const handler of LINE_HANDLERS) {
    const result = handler(ctx, idx, line, lc);
    if (result !== null) return result;
  }
  return refuse('syntax', idx, idx, 'Syntax Error?');
}

/** {@link pushParsedNode} plus the closed-group note redirect (add4-T2g,
 *  `note-dispatch.ts#redirectNoteOntoGroup`); kept here because
 *  `list-backward-dispatch.ts` is not this task's file and a cycle through
 *  `note-dispatch.ts` is avoided. */
function pushNode(nodes: ActivityNode[], node: ActivityNode | undefined): void {
  if (
    node?.kind === 'note' &&
    (redirectNoteOntoGroup(nodes, node, pushNode) || redirectNoteOntoWhile(nodes, node, pushNode))
  )
    return;
  pushParsedNode(nodes, node); // WSPEC/RNOOUT, list-backward-dispatch.ts
}

/** Read nodes from `ctx.lines` from `idx` until a trimmed lowercase line
 *  matches one of `stops`, end-of-input, or a `ParseRefusal` surfaces from
 *  `dispatchLine` -- which this function propagates unchanged rather than
 *  swallowing (D0/D1: refusal is the real parse path, returned not thrown). */
export function parseNodes(ctx: ParseContext, idx: number, stops: StopKeywords): ParseOutcome {
  const nodes: ActivityNode[] = [];
  const { lines } = ctx;
  let cursor = idx;

  while (cursor < lines.length) {
    const raw = lines[cursor]!;
    let line = raw.trim();

    if (line === '') {
      cursor++;
      continue;
    }

    // Upstream has no ONE generic strip: a bare keyword's own regex ends
    // `";?"` (`CommandStart3.java:58-63`) -- emulated here, once, for
    // every bare keyword. `keyword:content;` pairs colon+`;` as ONE
    // mandatory unit instead (`CommandBackward3.java:75-79`,
    // `CommandRepeat3.java:68-73`'s inline form) -- stripping THAT `;`
    // corrupts it (`RE_BACKWARD`, `dispatch-support.ts:67`, then misses a
    // single-line `backward:LABEL;`, falling to its multiline reader,
    // swallowing following lines). A colon ANYWHERE means some command
    // owns that `;` -- bare keywords never contain one.
    // `CommandArrow3`'s `(.*);` owns its own `;` (`CommandArrow3.java:61-65`).
    if (!line.startsWith(':') && !line.includes(':') && line.endsWith(';') && !RE_ARROW_LABEL.test(line)) {
      line = line.slice(0, -1).trimEnd();
    }

    const lc = line.toLowerCase();

    // Check stop condition before dispatching.
    if (matchesStopKeyword(lc, stops)) break;

    const result = dispatchLine(ctx, cursor, line, lc);
    if (isRefusal(result)) return result;
    pushNode(nodes, result.node);
    cursor = result.idx;
  }

  return { nodes, nextIdx: cursor };
}
