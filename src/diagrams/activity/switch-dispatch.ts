/**
 * `switch (test) / case (v) / endswitch` dispatch (mission ubrr-T10 M2).
 * Structurally isomorphic to `if-dispatch.ts`'s clause-scanning: a dynamic
 * per-clause header regex (`case (...)`), a fixed closer keyword
 * (`endswitch`), each clause owning its own body via `parseNodes`. Split
 * into its own file (mirroring the `if-dispatch.ts`/`parallel-dispatch.ts`
 * precedent) rather than folded into `node-dispatch.ts`, which is already
 * at the project's 500-line cap.
 */

import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityNode, ActivityNote, ActivitySwitch, ActivitySwitchCase } from './ast.js';
import {
  RE_CASE,
  RE_ENDSWITCH,
  RE_SWITCH,
  isRefusal,
  swimlaneSpread,
  type DispatchResult,
  type ParseContext,
  type StopKeywords,
} from './dispatch-support.js';
import { parseNodes } from './node-dispatch.js';
import { stripTrailingSemi, unescapeLabelNewlines } from './if-dispatch.js';
import { tryNoteMulti, tryNoteSingle } from './note-dispatch.js';

/** `case`/`endswitch` are both simple word-prefix stops -- the same
 *  mechanism `if`'s `['elseif', 'else', 'endif']` already relies on
 *  (`matchesStopKeyword`, dispatch-support.ts). */
const SWITCH_INNER_STOPS: StopKeywords = ['case', 'endswitch'];

type SwitchClauseStep =
  | { kind: 'endswitch'; cursor: number }
  | { kind: 'case'; cursor: number; kase: ActivitySwitchCase; notes: ActivityNote[] }
  | { kind: 'note'; cursor: number; note: ActivityNote }
  | { kind: 'unexpected'; cursor: number }
  | ParseRefusal;

/**
 * add4-T1f (SWITCH-NOTE): `InstructionSwitch#addNote`'s `current.isEmpty()`
 * arm (`InstructionSwitch.java:188-189`) -- every note parsed while the
 * case's own `InstructionList` is still empty belongs to the SWITCH, so the
 * case body's LEADING notes are split out here, before `tileNodes` ever sees
 * them. `-> label;` (`arrow-label`) only sets the pending link rendering
 * (`ActivityDiagram3#setLabelNextArrow`), never an instruction, so it does
 * not end the leading run (and stays in the body).
 */
export function extractLeadingCaseNotes(body: readonly ActivityNode[]): {
  body: ActivityNode[];
  notes: ActivityNote[];
} {
  const notes: ActivityNote[] = [];
  const rest: ActivityNode[] = [];
  let leading = true;
  for (const node of body) {
    if (leading && node.kind === 'note') notes.push(node);
    else rest.push(node);
    if (node.kind !== 'note' && node.kind !== 'arrow-label') leading = false;
  }
  return { body: rest, notes };
}

/** A `note` line between `switch (...)` and the first `case`: upstream's
 *  `ActivityDiagram3#addNote` -> `current().addNote(...)`
 *  (`ActivityDiagram3.java:478-480`), whose `current == null` arm makes it
 *  the switch's own (`InstructionSwitch.java:188-189`). */
function tryPreCaseNote(ctx: ParseContext, cursor: number): SwitchClauseStep | null {
  const line = ctx.lines[cursor]!.trim();
  const parsed = tryNoteSingle(ctx, cursor, line) ?? tryNoteMulti(ctx, cursor, line);
  if (parsed === null || parsed.node?.kind !== 'note') return null;
  return { kind: 'note', cursor: parsed.idx, note: parsed.node };
}

/**
 * Classifies and consumes exactly one clause-header line: `endswitch`
 * (optionally stereotyped), `case (value)` (plus its body), or the
 * unexpected-line fallback -- mirrors `if-dispatch.ts#classifyClauseLine`'s
 * own doc for why `'unexpected'` is intentionally not converted to a
 * refusal here either.
 */
function classifySwitchClauseLine(ctx: ParseContext, cursor: number): SwitchClauseStep {
  const clauseLine = stripTrailingSemi(ctx.lines[cursor]!.trim());

  if (RE_ENDSWITCH.test(clauseLine)) return { kind: 'endswitch', cursor: cursor + 1 };

  const caseMatch = RE_CASE.exec(clauseLine);
  if (caseMatch !== null) {
    // add4-T1f (SWITCH-NL): `CommandCase#executeArg` hands the label through
    // `Display.getWithNewlines` (`CommandCase.java:87`), so `\n` is a line break.
    const label = unescapeLabelNewlines(caseMatch[1]!);
    const bodyResult = parseNodes(ctx, cursor + 1, SWITCH_INNER_STOPS);
    if (isRefusal(bodyResult)) return bodyResult;
    const { body, notes } = extractLeadingCaseNotes(bodyResult.nodes);
    const kase: ActivitySwitchCase = { ...(label !== '' ? { label } : {}), body };
    return { kind: 'case', cursor: bodyResult.nextIdx, kase, notes };
  }

  return tryPreCaseNote(ctx, cursor) ?? { kind: 'unexpected', cursor: cursor + 1 };
}

/** Consumes the sequence of `case (...)` clauses up to and including
 *  `endswitch`, mirroring `if-dispatch.ts#consumeIfClauses`. */
function consumeSwitchCases(
  ctx: ParseContext,
  startIdx: number,
): { cursor: number; cases: ActivitySwitchCase[]; notes: ActivityNote[] } | ParseRefusal {
  let cursor = startIdx;
  const cases: ActivitySwitchCase[] = [];
  const notes: ActivityNote[] = [];

  while (cursor < ctx.lines.length) {
    const step = classifySwitchClauseLine(ctx, cursor);
    if (isRefusal(step)) return step;
    cursor = step.cursor;
    if (step.kind === 'endswitch') break;
    if (step.kind === 'case') {
      cases.push(step.kase);
      notes.push(...step.notes);
    } else if (step.kind === 'note') notes.push(step.note);
    // 'unexpected' -- see classifySwitchClauseLine's own doc.
  }

  return { cursor, cases, notes };
}

/**
 * Captures the `switch`'s swimlane at its opener, mirroring `tryIf`/
 * `tryWhile`/`tryRepeat`'s own opener-not-closer convention (mission
 * `activity-lane-capture` D1).
 */
export function tryOpenSwitch(ctx: ParseContext, idx: number, line: string): DispatchResult | ParseRefusal | null {
  const m = RE_SWITCH.exec(line);
  if (m === null) return null;
  const condition = m[1]!;
  const openerSwimlane = swimlaneSpread(ctx);

  const result = consumeSwitchCases(ctx, idx + 1);
  if (isRefusal(result)) return result;

  const notesSpread = result.notes.length > 0 ? { notes: result.notes } : {};
  const node: ActivitySwitch = { kind: 'switch', condition, cases: result.cases, ...openerSwimlane, ...notesSpread };
  return { idx: result.cursor, node };
}
