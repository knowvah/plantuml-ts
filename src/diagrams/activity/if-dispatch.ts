/**
 * `if / elseif / else / endif` dispatch for the activity diagram parser.
 * Split out of node-dispatch.ts (mission G0b/T6) purely to keep both files
 * under the project's 500-line file cap -- no behavior change; every
 * export here is verbatim code moved from node-dispatch.ts.
 */

import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityElseIf, ActivityIf, ActivityNode } from './ast.js';
import {
  RE_ELSE, RE_ELSEIF, RE_IF, isRefusal, swimlaneSpread,
  type DispatchResult, type ParseContext, type StopKeywords,
} from './dispatch-support.js';
import { parseNodes } from './node-dispatch.js';

// ---------------------------------------------------------------------------
// if / elseif / else / endif
// ---------------------------------------------------------------------------
interface IfClauses {
  cursor: number;
  elseIfBranches: ActivityElseIf[];
  elseBranch: ActivityNode[];
  elseLabel: string | undefined;
}

/** Strips the same optional trailing `;` the main dispatch loop applies to
 *  non-action lines, so `else (no);` / `endif;` are recognised here too. */
function stripTrailingSemi(raw: string): string {
  return !raw.startsWith(':') && raw.endsWith(';') ? raw.slice(0, -1).trimEnd() : raw;
}

interface ElseifStep {
  cursor: number;
  branch: ActivityElseIf;
}

/** Consumes one `elseif (...) then (...)` clause and its body. */
function consumeElseifClause(
  ctx: ParseContext,
  cursor: number,
  clauseLine: string,
  ifInnerStops: StopKeywords,
): ElseifStep | ParseRefusal {
  const elseifMatch = RE_ELSEIF.exec(clauseLine)!;
  const eiLabel = elseifMatch[2]?.trim();
  const eiResult = parseNodes(ctx, cursor + 1, ifInnerStops);
  if (isRefusal(eiResult)) return eiResult;
  return {
    cursor: eiResult.nextIdx,
    branch: {
      condition: elseifMatch[1]!.trim(),
      ...(eiLabel !== undefined && eiLabel !== '' ? { label: eiLabel } : {}),
      body: eiResult.nodes,
    },
  };
}

interface ElseStep {
  cursor: number;
  branch: ActivityNode[];
  label: string | undefined;
}

/** Consumes an `else (...)` clause's body, plus its terminating `endif`. */
function consumeElseClause(ctx: ParseContext, cursor: number, clauseLine: string): ElseStep | ParseRefusal {
  const { lines } = ctx;
  const label = RE_ELSE.exec(clauseLine)![1]?.trim();
  const elseResult = parseNodes(ctx, cursor + 1, ['endif']);
  if (isRefusal(elseResult)) return elseResult;
  let next = elseResult.nextIdx;
  // consume endif (also tolerate a trailing `;`)
  if (next < lines.length && stripTrailingSemi(lines[next]!.trim()).toLowerCase() === 'endif') {
    next++;
  }
  return { cursor: next, branch: elseResult.nodes, label };
}

/** One step of {@link consumeIfClauses}'s clause-header scan. `'unexpected'`
 *  is the not-converted-to-refusal fallback -- see that function's doc
 *  comment for why. */
type ClauseStep =
  | { kind: 'endif' | 'unexpected'; cursor: number }
  | { kind: 'elseif'; cursor: number; branch: ActivityElseIf }
  | { kind: 'else'; cursor: number; branch: ActivityNode[]; label: string | undefined }
  | ParseRefusal;

/** Classifies and consumes exactly one clause-header line: `endif`,
 *  `elseif (...) then (...)` (plus its body), `else (...)` (plus its body
 *  and terminating `endif`), or the unexpected-line fallback. */
function classifyClauseLine(ctx: ParseContext, cursor: number, ifInnerStops: StopKeywords): ClauseStep {
  const clauseLine = stripTrailingSemi(ctx.lines[cursor]!.trim());

  if (clauseLine.toLowerCase() === 'endif') return { kind: 'endif', cursor: cursor + 1 };

  if (RE_ELSEIF.test(clauseLine)) {
    const step = consumeElseifClause(ctx, cursor, clauseLine, ifInnerStops);
    if (isRefusal(step)) return step;
    return { kind: 'elseif', cursor: step.cursor, branch: step.branch };
  }

  if (RE_ELSE.test(clauseLine)) {
    const step = consumeElseClause(ctx, cursor, clauseLine);
    if (isRefusal(step)) return step;
    return { kind: 'else', cursor: step.cursor, branch: step.branch, label: step.label };
  }

  return { kind: 'unexpected', cursor: cursor + 1 };
}

/**
 * Consumes the sequence of `elseif` / `else` / `endif` clauses following
 * an `if (...)`'s then-branch.
 *
 * {@link classifyClauseLine}'s `'unexpected'` outcome is defensive, not a
 * live command-recognition point, and is intentionally left unconverted
 * to a refusal (mission dispatch-by-parse-attempt/T6): every entry into
 * this loop's body starts at a cursor where the immediately preceding
 * `parseNodes` call already matched one of `ifInnerStops` via
 * `matchesStopKeyword` (exact keyword, or keyword+space/paren prefix), or
 * exited on end-of-input, which this loop's own `cursor < lines.length`
 * guard also catches before the body runs. `matchesStopKeyword`'s prefix
 * form is looser than `classifyClauseLine`'s exact-match/regex checks, so
 * a synthetic line such as "endif foo" could in principle land here --
 * but that shape matches no upstream `Command` either
 * (`CommandEndif3.java:58-67` has no trailing free-text group), so
 * upstream would ALSO refuse it, just via its one flat `getCandidate` loop
 * rather than this nested one. Converting this fallback risks a false
 * stop-condition-3 (refusing something upstream accepts) for a case this
 * task cannot fully enumerate against every other command's regex; left
 * unchanged and flagged for review.
 */
function consumeIfClauses(ctx: ParseContext, startIdx: number, ifInnerStops: StopKeywords): IfClauses | ParseRefusal {
  let cursor = startIdx;
  const elseIfBranches: ActivityElseIf[] = [];
  let elseBranch: ActivityNode[] = [];
  let elseLabel: string | undefined;

  while (cursor < ctx.lines.length) {
    const step = classifyClauseLine(ctx, cursor, ifInnerStops);
    if (isRefusal(step)) return step;
    cursor = step.cursor;
    if (step.kind === 'endif') break;
    if (step.kind === 'elseif') { elseIfBranches.push(step.branch); continue; }
    if (step.kind === 'else') {
      elseBranch = step.branch;
      elseLabel = step.label;
      break;
    }
    // 'unexpected' -- see this function's doc comment above.
  }

  return { cursor, elseIfBranches, elseBranch, elseLabel };
}

export function tryIf(ctx: ParseContext, idx: number, line: string): DispatchResult | ParseRefusal | null {
  const ifMatch = RE_IF.exec(line);
  if (ifMatch === null) return null;
  const condition = ifMatch[1]!.trim();
  const thenLabel = ifMatch[2]?.trim();

  // then-branch stops at elseif, else, endif
  const IF_INNER_STOPS: StopKeywords = ['elseif', 'else', 'endif'];
  const thenResult = parseNodes(ctx, idx + 1, IF_INNER_STOPS);
  if (isRefusal(thenResult)) return thenResult;
  const thenBranch = thenResult.nodes;

  const clauses = consumeIfClauses(ctx, thenResult.nextIdx, IF_INNER_STOPS);
  if (isRefusal(clauses)) return clauses;
  const { cursor, elseIfBranches, elseBranch, elseLabel } = clauses;

  // Always push exactly one if node per `if (...)` opener
  const ifNode: ActivityIf = {
    kind: 'if',
    condition,
    ...(thenLabel !== undefined && thenLabel !== '' ? { thenLabel } : {}),
    ...(elseLabel !== undefined && elseLabel !== '' ? { elseLabel } : {}),
    thenBranch,
    elseBranch,
    elseIfBranches,
    ...swimlaneSpread(ctx),
  };
  return { idx: cursor, node: ifNode };
}

