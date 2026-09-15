/**
 * `fork` / `fork again` / `end fork` and `split` / `split again` /
 * `end split` dispatch for the activity diagram parser. Split out of
 * node-dispatch.ts (mission `activity-lane-capture` T6) purely to keep
 * both files under the project's 500-line file cap -- no behavior change
 * beyond T6's own fix to `tryFork`; every export here is verbatim code
 * moved from node-dispatch.ts, following the same extraction shape as
 * `if-dispatch.ts` (mission G0b/T6). `tryFork`'s branch-collection loop is
 * further split into {@link collectForkBranches} to stay under the
 * project's 30-NLOC-per-function hook -- a mechanical extraction, not a
 * new abstraction.
 */

import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityFork, ActivityNode, ActivitySplit } from './ast.js';
import {
  isRefusal,
  swimlaneSpread,
  type DispatchResult,
  type ParseContext,
  type StopKeywords,
} from './dispatch-support.js';
import { parseNodes } from './node-dispatch.js';

// ---------------------------------------------------------------------------
// fork / fork again / end fork
// ---------------------------------------------------------------------------
const FORK_STOPS: StopKeywords = ['fork again', 'end fork'];

interface ForkBranches {
  cursor: number;
  branches: ActivityNode[][];
  swimlaneOut: string | undefined;
}

/**
 * Collects every `fork`/`fork again`-delimited branch up to and including
 * `end fork`, re-reading `swimlaneOut` at each separator.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:138-141
 *   -- `forkAgain` re-reads `swimlaneOut` at each `fork again`.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:193-197
 *   -- `setStyle` re-reads `swimlaneOut` at `end fork`.
 */
function collectForkBranches(ctx: ParseContext, startIdx: number): ForkBranches | ParseRefusal {
  const { lines } = ctx;
  let cursor = startIdx;
  const branches: ActivityNode[][] = [];
  let swimlaneOut = ctx.currentSwimlane;
  let done = false;
  while (!done) {
    const branchResult = parseNodes(ctx, cursor, FORK_STOPS);
    if (isRefusal(branchResult)) return branchResult;
    branches.push(branchResult.nodes);
    cursor = branchResult.nextIdx;
    if (cursor >= lines.length) break;
    const sep = lines[cursor]!.trim().toLowerCase();
    if (sep === 'end fork') {
      swimlaneOut = ctx.currentSwimlane;
      cursor++;
      done = true;
    } else if (sep === 'fork again') {
      swimlaneOut = ctx.currentSwimlane;
      cursor++;
    } else {
      done = true;
    }
  }
  return { cursor, branches, swimlaneOut };
}

/**
 * Captures the fork's swimlane at its opener.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:216-223
 *   -- `new InstructionFork(swimlanes.getCurrentSwimlane(), ...)`, taken
 *   when the `fork` line itself is parsed, before the first branch.
 */
export function tryFork(
  ctx: ParseContext,
  idx: number,
  _line: string,
  lc: string,
): DispatchResult | ParseRefusal | null {
  if (lc !== 'fork') return null;
  // Mission `activity-lane-capture` D1/T6: read BEFORE the first branch
  // parses, so a lane switch inside a branch never leaks into this node's
  // own `swimlane`.
  const openerSwimlane = swimlaneSpread(ctx);
  const result = collectForkBranches(ctx, idx + 1);
  if (isRefusal(result)) return result;
  const node: ActivityFork = {
    kind: 'fork',
    branches: result.branches,
    ...openerSwimlane,
    ...(result.swimlaneOut !== undefined ? { swimlaneOut: result.swimlaneOut } : {}),
  };
  return { idx: result.cursor, node };
}

// ---------------------------------------------------------------------------
// split / split again / end split
// ---------------------------------------------------------------------------
export function trySplit(
  ctx: ParseContext,
  idx: number,
  _line: string,
  lc: string,
): DispatchResult | ParseRefusal | null {
  if (lc !== 'split') return null;
  const { lines } = ctx;
  let cursor = idx + 1;
  const branches: ActivityNode[][] = [];
  const SPLIT_STOPS: StopKeywords = ['split again', 'end split'];
  let done = false;
  while (!done) {
    const branchResult = parseNodes(ctx, cursor, SPLIT_STOPS);
    if (isRefusal(branchResult)) return branchResult;
    branches.push(branchResult.nodes);
    cursor = branchResult.nextIdx;
    if (cursor >= lines.length) break;
    const sep = lines[cursor]!.trim().toLowerCase();
    if (sep === 'end split') {
      cursor++;
      done = true;
    } else if (sep === 'split again') {
      cursor++;
    } else {
      done = true;
    }
  }
  const node: ActivitySplit = { kind: 'split', branches, ...swimlaneSpread(ctx) };
  return { idx: cursor, node };
}
