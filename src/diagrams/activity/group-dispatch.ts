/**
 * `partition|package|rectangle|card|group NAME { ... }` (bracketed) /
 * `Group NAME ... End group` (legacy) container dispatch (mission
 * ubrr-T10 M6). Split into its own file for the same reason `if-dispatch.ts`/
 * `switch-dispatch.ts` are.
 */

import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityGroup, ActivityNode, ActivityNote } from './ast.js';
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
import { Warning } from '../../core/warning/Warning.js';
import { eventuallyRemoveStartingAndEndingDoubleQuote } from '../../core/url/Url.js';

/** `StringUtils#eventuallyRemoveStartingAndEndingDoubleQuote(String)`'s own
 *  format argument (`StringUtils.java:90`). */
const NAME_STRIP_FORMAT = '"([:';

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

interface LeadingGroupNoteSplit {
  readonly body: ActivityNode[];
  readonly note?: ActivityNote;
}

/** `InstructionGroup#addNote`'s own `list.isEmpty()` self-capture
 *  (`InstructionGroup.java:125-131`): a note is never actually ADDED to
 *  the body list, so a RUN of leading notes each OVERWRITES the last --
 *  a single field, not a collection. `activity-divergence-drive-3` T2a,
 *  family GROUPNOTE. */
function extractLeadingGroupNote(body: readonly ActivityNode[]): LeadingGroupNoteSplit {
  let note: ActivityNote | undefined;
  let i = 0;
  while (i < body.length && body[i]!.kind === 'note') {
    note = body[i] as ActivityNote;
    i++;
  }
  return note === undefined ? { body: body.slice(i) } : { body: body.slice(i), note };
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
  // `eventuallyRemoveStartingAndEndingDoubleQuote(arg.get("NAME", 0))`
  // (`CommandPartition3.java:143`; `StringUtils.java:86-91`, format `"([:`).
  const title = eventuallyRemoveStartingAndEndingDoubleQuote(m[3] ?? '', NAME_STRIP_FORMAT) ?? '';
  // `b1 == null ? "BACK2" : "BACK1"` (`:145-147`).
  const backColor = m[2] ?? m[4];
  const stereotype = m[5];
  const hasBracket = m[6]!.length > 0;
  const openerSwimlane = swimlaneSpread(ctx);
  // `CommandPartition3.java:154-157`: TYPE as written, NAME unquoted (:143).
  if (!hasBracket) {
    ctx.pragma.addWarning(new Warning(`You should use a bracket ({) when defining your container '${m[1]!}' ${title}`));
  }

  const bodyResult = parseNodes(ctx, idx + 1, GROUP_STOPS);
  if (isRefusal(bodyResult)) return bodyResult;
  let cursor = bodyResult.nextIdx;
  if (cursor < ctx.lines.length) {
    const closer = ctx.lines[cursor]!.trim();
    if (RE_CLOSE_GROUP.test(closer)) cursor++;
    else if (RE_CLOSE_GROUP_LEGACY.test(closer)) {
      // `CommandCloseGroupLegacy3.java:75`: CMD is the whole anchored match (:57).
      ctx.pragma.addWarning(new Warning(`You should use a bracket (}) instead of '${closer}'`));
      cursor++;
    }
  }
  const { body, note } = extractLeadingGroupNote(bodyResult.nodes);

  const node: ActivityGroup = {
    kind: 'group',
    groupType: typeRaw,
    title,
    hasBracket,
    ...(backColor !== undefined ? { backColor } : {}),
    ...(stereotype !== undefined ? { stereotype } : {}),
    body,
    ...(note !== undefined ? { note } : {}),
    ...openerSwimlane,
  };
  return { idx: cursor, node };
}
