/**
 * `* label` / `- label` list-item activities (M1) and `backward:LABEL;`
 * (M3) dispatch. Split out of node-dispatch.ts (mission ubrr-T10) purely
 * to keep that file under the project's 500-line cap -- same rationale as
 * `if-dispatch.ts`/`parallel-dispatch.ts`'s own split.
 */

import type { ActivityAction, ActivityBackward, ActivitySpot, ActivityLabel, ActivityGoto } from './ast.js';
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
// `(X)` / `#color:(X)` circled-spot connector and `label NAME` /
// `goto NAME` (mission add2-T2g, D6 follow-on): each now produces a real
// `ActivityNode` (`ast.ts`'s own doc on each type names the Java/empirical
// basis) -- T2e's original "consumed, parsed not drawn" shape is
// superseded here.
// @see net/sourceforge/plantuml/activitydiagram3/command/CommandCircleSpot3.java:56-62
// @see net/sourceforge/plantuml/activitydiagram3/command/CommandLabel.java:56-61
// @see net/sourceforge/plantuml/activitydiagram3/command/CommandGoto.java:56-61
// @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagramFactory3.java:144,160-161
//   -- registration order: CircleSpot3 right after Start3/Stop3; Label/
//   Goto last, after ActivityList (this file's own `tryActivityList`).
// ---------------------------------------------------------------------------

/**
 * `(X)` / `#color:(X)` -- a single-character "circled spot" connector.
 * Group 1 is the leading colour (with its own `#`, same capture shape as
 * `ColorParser.exp4()`'s `(?:(COLOR):)?`, mirroring this file's own
 * `RE_NOTE_SINGLE`/`RE_NOTE_MULTI` non-capturing form); group 2 is the
 * single circled character.
 * @see net/sourceforge/plantuml/klimt/color/ColorParser.java:43-46,101-103
 */
const RE_CIRCLE_SPOT = /^(?:(#\w+[-\\|/]?\w+):)?\((\S)\)\s*;?\s*$/i;

export function tryCircleSpot(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const m = RE_CIRCLE_SPOT.exec(line);
  if (m === null) return null;
  const color = m[1];
  const node: ActivitySpot = {
    kind: 'spot',
    name: m[2]!,
    ...(color !== undefined ? { color } : {}),
    ...swimlaneSpread(ctx),
  };
  return { idx: idx + 1, node };
}

/** `label NAME` -- declares the target of a later `goto NAME` jump. */
const RE_LABEL = /^label\s+([\w.]+)\s*;?\s*$/i;

export function tryLabel(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const m = RE_LABEL.exec(line);
  if (m === null) return null;
  const node: ActivityLabel = { kind: 'label', name: m[1]!, ...swimlaneSpread(ctx) };
  return { idx: idx + 1, node };
}

/** `goto NAME` -- jumps to the `label NAME` declared elsewhere. */
const RE_GOTO = /^goto\s+([\w.]+)\s*;?\s*$/i;

export function tryGoto(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const m = RE_GOTO.exec(line);
  if (m === null) return null;
  const node: ActivityGoto = { kind: 'goto', name: m[1]!, ...swimlaneSpread(ctx) };
  return { idx: idx + 1, node };
}
