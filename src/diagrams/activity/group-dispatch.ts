/**
 * `partition|package|rectangle|card|group NAME { ... }` (bracketed) /
 * `Group NAME ... End group` (legacy) container dispatch (mission
 * ubrr-T10 M6). Split into its own file for the same reason `if-dispatch.ts`/
 * `switch-dispatch.ts` are.
 */

import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityGroup } from './ast.js';
import {
  RE_CLOSE_GROUP,
  RE_CLOSE_GROUP_LEGACY,
  RE_GROUP_OPEN,
  isRefusal,
  swimlaneSpread,
  type DispatchResult,
  type ParseContext,
  type StopKeywords,
} from './dispatch-support.js';
import { parseNodes } from './node-dispatch.js';

/**
 * Either closer ends whichever group is open, independent of which
 * spelling opened it (upstream: `closeGroup()` is the same call from
 * both `CommandCloseGroup3` and `CommandCloseGroupLegacy3`) -- so a
 * bracketed opener may still close with `End group`, and vice versa.
 */
const GROUP_STOPS: StopKeywords = ['}', 'end group', 'endgroup', 'group end', 'groupend'];

const GROUP_TYPES = ['partition', 'package', 'rectangle', 'card', 'group'] as const;

function isGroupType(s: string): s is ActivityGroup['groupType'] {
  return (GROUP_TYPES as readonly string[]).includes(s);
}

/**
 * Captures the group's swimlane at its opener, mirroring `tryIf`/
 * `tryWhile`/`tryRepeat`/`tryOpenSwitch`'s own convention (mission
 * `activity-lane-capture` D1).
 */
export function tryOpenGroup(ctx: ParseContext, idx: number, line: string): DispatchResult | ParseRefusal | null {
  const m = RE_GROUP_OPEN.exec(line);
  if (m === null) return null;
  const typeRaw = m[1]!.toLowerCase();
  if (!isGroupType(typeRaw)) return null; // unreachable: the regex's own alternation is exactly GROUP_TYPES
  const title = (m[2] ?? m[3] ?? '').trim();
  const hasBracket = m[4] !== undefined;
  const openerSwimlane = swimlaneSpread(ctx);

  const bodyResult = parseNodes(ctx, idx + 1, GROUP_STOPS);
  if (isRefusal(bodyResult)) return bodyResult;
  let cursor = bodyResult.nextIdx;
  if (cursor < ctx.lines.length) {
    const closer = ctx.lines[cursor]!.trim();
    if (RE_CLOSE_GROUP.test(closer) || RE_CLOSE_GROUP_LEGACY.test(closer)) cursor++;
  }

  const node: ActivityGroup = {
    kind: 'group',
    groupType: typeRaw,
    title,
    hasBracket,
    body: bodyResult.nodes,
    ...openerSwimlane,
  };
  return { idx: cursor, node };
}
