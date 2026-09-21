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
import type { ActivitySwitch, ActivitySwitchCase } from './ast.js';
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
import { stripTrailingSemi } from './if-dispatch.js';

/** `case`/`endswitch` are both simple word-prefix stops -- the same
 *  mechanism `if`'s `['elseif', 'else', 'endif']` already relies on
 *  (`matchesStopKeyword`, dispatch-support.ts). */
const SWITCH_INNER_STOPS: StopKeywords = ['case', 'endswitch'];

type SwitchClauseStep =
  | { kind: 'endswitch'; cursor: number }
  | { kind: 'case'; cursor: number; kase: ActivitySwitchCase }
  | { kind: 'unexpected'; cursor: number }
  | ParseRefusal;

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
    const label = caseMatch[1]!.trim();
    const bodyResult = parseNodes(ctx, cursor + 1, SWITCH_INNER_STOPS);
    if (isRefusal(bodyResult)) return bodyResult;
    const kase: ActivitySwitchCase = { ...(label !== '' ? { label } : {}), body: bodyResult.nodes };
    return { kind: 'case', cursor: bodyResult.nextIdx, kase };
  }

  return { kind: 'unexpected', cursor: cursor + 1 };
}

/** Consumes the sequence of `case (...)` clauses up to and including
 *  `endswitch`, mirroring `if-dispatch.ts#consumeIfClauses`. */
function consumeSwitchCases(
  ctx: ParseContext,
  startIdx: number,
): { cursor: number; cases: ActivitySwitchCase[] } | ParseRefusal {
  let cursor = startIdx;
  const cases: ActivitySwitchCase[] = [];

  while (cursor < ctx.lines.length) {
    const step = classifySwitchClauseLine(ctx, cursor);
    if (isRefusal(step)) return step;
    cursor = step.cursor;
    if (step.kind === 'endswitch') break;
    if (step.kind === 'case') {
      cases.push(step.kase);
      continue;
    }
    // 'unexpected' -- see classifySwitchClauseLine's own doc.
  }

  return { cursor, cases };
}

/**
 * Captures the `switch`'s swimlane at its opener, mirroring `tryIf`/
 * `tryWhile`/`tryRepeat`'s own opener-not-closer convention (mission
 * `activity-lane-capture` D1).
 */
export function tryOpenSwitch(ctx: ParseContext, idx: number, line: string): DispatchResult | ParseRefusal | null {
  const m = RE_SWITCH.exec(line);
  if (m === null) return null;
  const condition = m[1]!.trim();
  const openerSwimlane = swimlaneSpread(ctx);

  const result = consumeSwitchCases(ctx, idx + 1);
  if (isRefusal(result)) return result;

  const node: ActivitySwitch = { kind: 'switch', condition, cases: result.cases, ...openerSwimlane };
  return { idx: result.cursor, node };
}
