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

import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import type {
  ActivityAction,
  ActivityArrowLabel,
  ActivityNode,
  ActivityNote,
  ActivityRepeat,
  ActivityWhile,
} from './ast.js';
import {
  RE_ACTION,
  RE_ACTION_CLOSE,
  RE_ARROW_LABEL,
  RE_ENDWHILE,
  RE_ESCAPED_NEWLINE,
  RE_NOTE_MULTI,
  RE_NOTE_SINGLE,
  RE_REPEAT_HEAD,
  RE_REPEAT_INLINE_TERMINATOR,
  RE_REPEATWHILE,
  RE_SWIMLANE,
  RE_WHILE,
  isRefusal,
  matchesStopKeyword,
  setCurrentSwimlane,
  swimlaneSpread,
  type DispatchResult,
  type LineHandler,
  type ParseContext,
  type ParseOutcome,
  type StopKeywords,
} from './dispatch-support.js';
import { tryIf } from './if-dispatch.js';
import { tryFork, trySplit } from './parallel-dispatch.js';

// ---------------------------------------------------------------------------
// Swimlane header: |name| or |[#color]name|
// ---------------------------------------------------------------------------
function trySwimlane(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const m = RE_SWIMLANE.exec(line);
  if (m === null) return null;
  setCurrentSwimlane(ctx, m[1]!.trim());
  return { idx: idx + 1 };
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
  const label = actionMatch[1]!.trim().replace(RE_ESCAPED_NEWLINE, '\n');
  const stereoRaw = actionMatch[2];
  const colorRaw = actionMatch[3];
  const node: ActivityAction = {
    kind: 'action',
    label,
    ...(stereoRaw !== undefined ? { stereotype: stereoRaw.trim().toLowerCase() } : {}),
    ...(colorRaw !== undefined ? { color: colorRaw } : {}),
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

interface MultilineActionBody {
  cursor: number;
  labelParts: string[];
  multiStereo: string | undefined;
}

/** Consumes body lines of a multiline action until its closing `;`
 *  (optionally followed by `<<stereo>>`), or end-of-input. */
function readMultilineActionBody(ctx: ParseContext, startIdx: number, labelParts: string[]): MultilineActionBody {
  const { lines } = ctx;
  let cursor = startIdx;
  let multiStereo: string | undefined;
  while (cursor < lines.length) {
    const raw = lines[cursor]!;
    const inner = raw.trim();
    const closeMatch = RE_ACTION_CLOSE.exec(inner);
    if (closeMatch !== null) {
      const withoutSemi = closeMatch[1]!.trim();
      if (withoutSemi !== '') labelParts.push(withoutSemi);
      const sc = closeMatch[2];
      if (sc !== undefined) multiStereo = sc.trim().toLowerCase();
      cursor++;
      break;
    }
    if (inner !== '') labelParts.push(raw);
    cursor++;
  }
  return { cursor, labelParts, multiStereo };
}

/** Multiline action: starts with `:` but no closing `;` on the same line. */
function tryMultilineAction(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!line.startsWith(':') || line.includes(';')) return null;
  const firstPart = line.slice(1).trim();
  const labelParts: string[] = [];
  if (firstPart !== '') labelParts.push(firstPart);
  const body = readMultilineActionBody(ctx, idx + 1, labelParts);
  const node: ActivityAction = {
    kind: 'action',
    label: body.labelParts.join('\n'),
    ...(body.multiStereo !== undefined ? { stereotype: body.multiStereo } : {}),
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
  const condition = whileMatch[1]!.trim();
  const yesLabel = whileMatch[2]?.trim();
  // Mission `activity-lane-capture` D1/T4: read BEFORE the body parses, so
  // a lane switch inside the body never leaks into this node's own
  // `swimlane`.
  const openerSwimlane = swimlaneSpread(ctx);
  const bodyResult = parseNodes(ctx, idx + 1, ['endwhile']);
  if (isRefusal(bodyResult)) return bodyResult;
  let cursor = bodyResult.nextIdx;
  let exitLabel: string | undefined;
  if (cursor < lines.length) {
    const endLine = lines[cursor]!.trim();
    const endwhileMatch = RE_ENDWHILE.exec(endLine);
    if (endwhileMatch !== null) exitLabel = endwhileMatch[1]?.trim();
    cursor++;
  }
  const node: ActivityWhile = {
    kind: 'while',
    condition,
    ...(yesLabel !== undefined && yesLabel !== '' ? { yesLabel } : {}),
    ...(exitLabel !== undefined && exitLabel !== '' ? { exitLabel } : {}),
    body: bodyResult.nodes,
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
  const label = actionM[1]!.trim().replace(RE_ESCAPED_NEWLINE, '\n');
  const stereoRaw = actionM[2];
  const colorRaw = actionM[3];
  return {
    kind: 'action',
    label,
    ...(stereoRaw !== undefined ? { stereotype: stereoRaw.trim().toLowerCase() } : {}),
    ...(colorRaw !== undefined ? { color: colorRaw } : {}),
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
 *   (`ftile/vcompact/FtileRepeat.java:150-151`).
 */
function parseRepeatClose(lines: readonly string[], cursor: number): RepeatClose {
  if (cursor >= lines.length) return { condition: '', yesLabel: undefined, outLabel: undefined, nextIdx: cursor };
  const endLine = lines[cursor]!.trim();
  const repeatMatch = RE_REPEATWHILE.exec(endLine);
  const condition = repeatMatch?.[1]?.trim() ?? '';
  const yesLabel = repeatMatch?.[2]?.trim();
  const outLabel = repeatMatch?.[3]?.trim();
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

/** note right : text  (single-line) */
function tryNoteSingle(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const noteSingleMatch = RE_NOTE_SINGLE.exec(line);
  if (noteSingleMatch === null) return null;
  const direction = noteSingleMatch[1]?.toLowerCase();
  const position: 'left' | 'right' = direction === 'left' ? 'left' : 'right';
  const node: ActivityNote = {
    kind: 'note',
    text: noteSingleMatch[2]!.trim(),
    position,
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

/** note left/right (multi-line, ends with "end note") */
function tryNoteMulti(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const noteMultiMatch = RE_NOTE_MULTI.exec(line);
  if (noteMultiMatch === null) return null;
  const { lines } = ctx;
  const direction = noteMultiMatch[1]?.toLowerCase();
  const position: 'left' | 'right' = direction === 'left' ? 'left' : 'right';
  let cursor = idx + 1;
  const textLines: string[] = [];
  while (cursor < lines.length) {
    const inner = lines[cursor]!.trim();
    if (inner.toLowerCase() === 'end note') {
      cursor++;
      break;
    }
    if (inner !== '') textLines.push(inner);
    cursor++;
  }
  const node: ActivityNote = { kind: 'note', text: textLines.join('\n'), position, ...swimlaneSpread(ctx) };
  return { idx: cursor, node };
}

/** Arrow label: -> label ;  or  -><back:color> label ; -- annotates the
 *  next drawn edge with a text label and optional color pill. */
function tryArrowLabel(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!line.startsWith('->')) return null;
  const arrowMatch = RE_ARROW_LABEL.exec(line);
  if (arrowMatch === null) return null;
  const color = arrowMatch[1]?.trim() || undefined;
  const label = arrowMatch[2]?.trim() ?? '';
  const node: ActivityArrowLabel = {
    kind: 'arrow-label',
    label,
    ...(color !== undefined ? { color } : {}),
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

/**
 * title/caption/legend/header/footer/mainframe (mission G0b/T6,
 * decisions.md D3) -- tried last, right before the unknown-line fallback
 * (spec position: former parser.ts:607-610). Activity's own multiline note
 * body (`tryNoteMulti` above) already owns its lines via a dedicated inner
 * while-loop that never falls through to this point, so a `title`-shaped
 * line inside a note body is never stolen (same top-level-only guarantee
 * as sequence's note bodies).
 */
function tryAnnotation(ctx: ParseContext, idx: number): DispatchResult | null {
  const match = matchAnnotationCommand(ctx.lines, idx, ctx.annotations);
  if (match === null) return null;
  return { idx: idx + match.consumed };
}

/** `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4) --
 *  tried immediately after `tryAnnotation`, same last-before-fallback
 *  position, mirroring upstream's title-then-sprite registration order
 *  (CommonCommands.java:54-58). */
function trySprite(ctx: ParseContext, idx: number): DispatchResult | null {
  const match = matchSpriteCommand(ctx.lines, idx, ctx.sprites);
  if (match === null) return null;
  return { idx: idx + match.consumed };
}

const LINE_HANDLERS: readonly LineHandler[] = [
  trySwimlane,
  trySimpleKeyword,
  tryAction,
  tryMultilineAction,
  tryIf,
  tryWhile,
  tryRepeat,
  tryFork,
  trySplit,
  tryNoteSingle,
  tryNoteMulti,
  tryArrowLabel,
  tryAnnotation,
  trySprite,
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

    // PlantUML accepts a trailing `;` on most control-flow keywords
    // (`start;`, `endif;`, `else (yes);`, etc.). Strip it for non-action
    // lines so the rest of the parser can match them as bare keywords.
    // Action lines themselves use `:label;` syntax — we must not touch
    // those, so this only applies to lines that do not start with `:`.
    if (!line.startsWith(':') && line.endsWith(';')) {
      line = line.slice(0, -1).trimEnd();
    }

    const lc = line.toLowerCase();

    // Check stop condition before dispatching.
    if (matchesStopKeyword(lc, stops)) break;

    const result = dispatchLine(ctx, cursor, line, lc);
    if (isRefusal(result)) return result;
    if (result.node !== undefined) nodes.push(result.node);
    cursor = result.idx;
  }

  return { nodes, nextIdx: cursor };
}
