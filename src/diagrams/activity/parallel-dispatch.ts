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
//
// Each separator keyword pair is `RegexLeaf.spaceZeroOrMore()` upstream
// (zero-OR-MORE internal space, e.g. `endfork`/`end fork` both valid),
// not the single-space-only literal this port used before (mission
// add2-T2e, D6): `cigagu-31-rime196`, `ciloke-34-pumi198`,
// `gudute-55-nulo344`, `ketajo-72-rula535`, `lapura-36-kavu144`,
// `ninago-40-dalo726`, `rirefa-62-kucu593`, `ticeka-12-buli543`,
// `zizumo-48-taku661` all refused on a zero-space separator. `end fork`/
// `end merge` additionally take an optional `{label}` suffix
// (`zafoxu-20-xofe568`, `end fork {or}`) -- parsed and dropped, same
// "parsed not drawn" scope this file's own `style` field doc already
// established for `end merge {label}` (`ActivityFork`'s own doc, ast.ts).
// `fork end` (word order reversed) stays out of scope, per this file's
// pre-existing D12 note below.
// ---------------------------------------------------------------------------
/** @see net/sourceforge/plantuml/activitydiagram3/command/CommandForkEnd3.java:57-81 */
const RE_FORK_END = /^end\s*(fork|merge)\s*(\{[^}]*\})?\s*;?\s*$/i;
/** @see net/sourceforge/plantuml/activitydiagram3/command/CommandForkAgain3.java:56-62 */
const RE_FORK_AGAIN = /^fork\s*again\s*;?\s*$/i;
const FORK_STOPS: StopKeywords = [RE_FORK_AGAIN, RE_FORK_END];

interface ForkBranches {
  cursor: number;
  branches: ActivityNode[][];
  swimlaneOut: string | undefined;
  /** D12/T1p-c: set when the closer was `end merge` (`ForkStyle.MERGE`). */
  style: 'merge' | undefined;
}

/**
 * Collects every `fork`/`fork again`-delimited branch up to and including
 * `end fork`/`end merge`, re-reading `swimlaneOut` at each separator.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:138-141
 *   -- `forkAgain` re-reads `swimlaneOut` at each `fork again`.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionFork.java:193-197
 *   -- `setStyle` re-reads `swimlaneOut` at `end fork`/`end merge` alike
 *   (`ActivityDiagram3.endFork` calls `setStyle` the same way for either
 *   `ForkStyle`, `ActivityDiagram3.java:236-244`).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandForkEnd3.java:57-81
 *   -- the `STYLE` regex alternation: `end fork` | `fork end` | `end merge`.
 *   `fork end` (the reversed synonym) is a separate, pre-existing gap --
 *   out of scope here (D12 scopes this task to `end merge` only).
 */
function collectForkBranches(ctx: ParseContext, startIdx: number): ForkBranches | ParseRefusal {
  const { lines } = ctx;
  let cursor = startIdx;
  const branches: ActivityNode[][] = [];
  let swimlaneOut = ctx.currentSwimlane;
  let style: 'merge' | undefined;
  let done = false;
  while (!done) {
    const branchResult = parseNodes(ctx, cursor, FORK_STOPS);
    if (isRefusal(branchResult)) return branchResult;
    branches.push(branchResult.nodes);
    cursor = branchResult.nextIdx;
    if (cursor >= lines.length) break;
    const sep = lines[cursor]!.trim().toLowerCase();
    const endMatch = RE_FORK_END.exec(sep);
    if (endMatch !== null) {
      swimlaneOut = ctx.currentSwimlane;
      if (endMatch[1] === 'merge') style = 'merge';
      cursor++;
      done = true;
    } else if (RE_FORK_AGAIN.test(sep)) {
      swimlaneOut = ctx.currentSwimlane;
      cursor++;
    } else {
      done = true;
    }
  }
  return { cursor, branches, swimlaneOut, style };
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
    ...(result.style !== undefined ? { style: result.style } : {}),
  };
  return { idx: result.cursor, node };
}

// ---------------------------------------------------------------------------
// split / split again / end split
//
// Same zero-or-more-space fix as the fork family above (mission
// add2-T2e, D6: `caburo-70-buki284`'s `endsplit` refused). Unlike fork,
// `end split`'s own upstream `RegexOr` includes the reversed `split end`
// synonym too (`CommandSplitEnd3.java:56-70`), so it is ported here.
// ---------------------------------------------------------------------------
/** @see net/sourceforge/plantuml/activitydiagram3/command/CommandSplitEnd3.java:56-70 */
const RE_SPLIT_END = /^(?:end\s*split|split\s*end)\s*;?\s*$/i;
/** @see net/sourceforge/plantuml/activitydiagram3/command/CommandSplitAgain3.java:56-62 */
const RE_SPLIT_AGAIN = /^split\s*again\s*;?\s*$/i;
const SPLIT_STOPS: StopKeywords = [RE_SPLIT_AGAIN, RE_SPLIT_END];

interface SplitBranches {
  cursor: number;
  branches: ActivityNode[][];
  swimlaneOut: string | undefined;
}

/**
 * Collects every `split`/`split again`-delimited branch up to and including
 * `end split`. Unlike {@link collectForkBranches}, `swimlaneOut` is read
 * only once, at `end split` -- `split again` never re-reads it.
 * @see net/sourceforge/plantuml/activitydiagram3/InstructionSplit.java:136-141
 */
function collectSplitBranches(ctx: ParseContext, startIdx: number): SplitBranches | ParseRefusal {
  const { lines } = ctx;
  let cursor = startIdx;
  const branches: ActivityNode[][] = [];
  let swimlaneOut: string | undefined;
  let done = false;
  while (!done) {
    const branchResult = parseNodes(ctx, cursor, SPLIT_STOPS);
    if (isRefusal(branchResult)) return branchResult;
    branches.push(branchResult.nodes);
    cursor = branchResult.nextIdx;
    if (cursor >= lines.length) break;
    const sep = lines[cursor]!.trim().toLowerCase();
    if (RE_SPLIT_END.test(sep)) {
      swimlaneOut = ctx.currentSwimlane;
      cursor++;
      done = true;
    } else if (RE_SPLIT_AGAIN.test(sep)) {
      cursor++;
    } else {
      done = true;
    }
  }
  return { cursor, branches, swimlaneOut };
}

/**
 * Captures the split's swimlane at its opener.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:248-254
 *   -- `new InstructionSplit(swimlanes.getCurrentSwimlane(), ...)`, taken
 *   when the `split` line itself is parsed, before the first branch.
 */
export function trySplit(
  ctx: ParseContext,
  idx: number,
  _line: string,
  lc: string,
): DispatchResult | ParseRefusal | null {
  if (lc !== 'split') return null;
  // Mission `activity-lane-capture` D1/T7: read BEFORE the first branch
  // parses, mirroring `tryFork` (`ActivityDiagram3.java:248-254`'s
  // `new InstructionSplit(swimlanes.getCurrentSwimlane(), ...)`).
  const openerSwimlane = swimlaneSpread(ctx);
  const result = collectSplitBranches(ctx, idx + 1);
  if (isRefusal(result)) return result;
  const node: ActivitySplit = {
    kind: 'split',
    branches: result.branches,
    ...openerSwimlane,
    ...(result.swimlaneOut !== undefined ? { swimlaneOut: result.swimlaneOut } : {}),
  };
  return { idx: result.cursor, node };
}
