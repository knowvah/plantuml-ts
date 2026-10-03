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

// ---------------------------------------------------------------------------
// `(X)` / `#color:(X)` circled-spot connector (mission add2-T2e, D6) and
// `label NAME` / `goto NAME` (same mission). All three are consumed and
// DROPPED -- no `ActivityNode` is returned -- same "parsed not drawn"
// pattern `trySwimlane` (node-dispatch.ts) already uses for a line that
// only mutates parse state. A real `ActivityNode` union member for any of
// them would make `tile-layout.ts#tileNode`'s exhaustive switch (outside
// this task's write-set) fail to compile; see this task's final report
// for the re-slot (new node kind + layout/render builder, owner
// `layout/tile-layout.ts` + `renderer.ts`).
// @see net/sourceforge/plantuml/activitydiagram3/command/CommandCircleSpot3.java:56-62
// @see net/sourceforge/plantuml/activitydiagram3/command/CommandLabel.java:56-61
// @see net/sourceforge/plantuml/activitydiagram3/command/CommandGoto.java:56-61
// @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:144,160-161
//   -- registration order: CircleSpot3 right after Start3/Stop3; Label/
//   Goto last, after ActivityList (this file's own `tryActivityList`).
// ---------------------------------------------------------------------------

/** `(X)` / `#color:(X)` -- a single-character "circled spot" connector. */
const RE_CIRCLE_SPOT = /^(?:#\w+[-\\|/]?\w+:)?\(\S\)\s*;?\s*$/i;

export function tryCircleSpot(_ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!RE_CIRCLE_SPOT.test(line)) return null;
  return { idx: idx + 1 };
}

/** `label NAME` -- declares the target of a later `goto NAME` jump. */
const RE_LABEL = /^label\s+([\w.]+)\s*;?\s*$/i;

export function tryLabel(_ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!RE_LABEL.test(line)) return null;
  return { idx: idx + 1 };
}

/** `goto NAME` -- jumps to the `label NAME` declared elsewhere. */
const RE_GOTO = /^goto\s+([\w.]+)\s*;?\s*$/i;

export function tryGoto(_ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  if (!RE_GOTO.test(line)) return null;
  return { idx: idx + 1 };
}
