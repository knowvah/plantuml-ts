/**
 * `* label` / `- label` list-item activities (M1) and `backward:LABEL;`
 * (M3) dispatch. Split out of node-dispatch.ts (mission ubrr-T10) purely
 * to keep that file under the project's 500-line cap -- same rationale as
 * `if-dispatch.ts`/`parallel-dispatch.ts`'s own split.
 */

import type { ActivityAction, ActivityBackward } from './ast.js';
import {
  RE_ACTIVITY_LIST,
  RE_BACKWARD,
  RE_BACKWARD_HEAD,
  RE_ESCAPED_NEWLINE,
  swimlaneSpread,
  type DispatchResult,
  type ParseContext,
} from './dispatch-support.js';
import { readMultilineActionBody } from './node-dispatch.js';

// ---------------------------------------------------------------------------
// `* label` / `- label` list-item activity (mission ubrr-T10 M1)
// ---------------------------------------------------------------------------
export function tryActivityList(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const m = RE_ACTIVITY_LIST.exec(line);
  if (m === null) return null;
  const node: ActivityAction = { kind: 'action', label: m[1]!.trim(), ...swimlaneSpread(ctx) };
  return { idx: idx + 1, node };
}

// ---------------------------------------------------------------------------
// `backward:LABEL;` (mission ubrr-T10 M3) -- see `ActivityBackward`'s own
// doc (ast.ts) for scope. Single-line via RE_BACKWARD; multiline reuses
// `readMultilineActionBody` (node-dispatch.ts, shared with tryMultilineAction),
// which already stops at an RE_ACTION_CLOSE-shaped line -- the identical
// content-then-`;`-then-stereogroup(s) shape `backward:`'s own closer has.
// ---------------------------------------------------------------------------
export function tryBackward(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const single = RE_BACKWARD.exec(line);
  if (single !== null) {
    const label = single[1]!.trim().replace(RE_ESCAPED_NEWLINE, '\n');
    const node: ActivityBackward = { kind: 'backward', label, ...swimlaneSpread(ctx) };
    return { idx: idx + 1, node };
  }
  const headMatch = RE_BACKWARD_HEAD.exec(line);
  if (headMatch === null || line.includes(';')) return null;
  const firstPart = headMatch[1]!.trim();
  const labelParts: string[] = [];
  if (firstPart !== '') labelParts.push(firstPart);
  const body = readMultilineActionBody(ctx, idx + 1, labelParts);
  const node: ActivityBackward = { kind: 'backward', label: body.labelParts.join('\n'), ...swimlaneSpread(ctx) };
  return { idx: body.cursor, node };
}
