/**
 * `* label` / `- label` list-item activities (M1) and `backward:LABEL;`
 * (M3) dispatch. Split out of node-dispatch.ts (mission ubrr-T10) purely
 * to keep that file under the project's 500-line cap -- same rationale as
 * `if-dispatch.ts`/`parallel-dispatch.ts`'s own split.
 */

import type {
  ActivityAction,
  ActivityBackward,
  ActivitySpot,
  ActivityLabel,
  ActivityGoto,
  ActivityNode,
} from './ast.js';
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
// `containsBreak` (mission add2-T3b, family WSPEC) -- node-dispatch.ts's
// own `parseNodes` needs this to decide whether a bare stop/end right
// after `endwhile` becomes the while's `specialOut`. Lives here (not
// node-dispatch.ts) only to keep that file under the 500-line cap.
// ---------------------------------------------------------------------------

/**
 * `InstructionList.containsBreak()` (`InstructionList.java:70-75`): `true`
 * iff ANY node in `nodes` is a `break`, recursing into every compound
 * instruction's own child list(s) -- `if`/`elseif`/`else`
 * (`InstructionIf.java:85-91`), `fork`/`split` branches
 * (`InstructionFork.java:76-79`, `InstructionSplit.java:79-82`), `switch`
 * cases (`InstructionSwitch.java:79-82`), `group`/`partition` bodies
 * (`InstructionGroup.java:75-76`), and a NESTED `while`/`repeat`'s own
 * body (`InstructionWhile.java:194-195`, `InstructionRepeat.java:99-100`)
 * -- a `break` inside an inner loop still counts for the OUTER one. Every
 * other leaf kind has no child list and contributes nothing
 * (`InstructionSimple.java:72-74` and siblings all return `false`).
 */
export function nodeListContainsBreak(nodes: readonly ActivityNode[]): boolean {
  return nodes.some((node) => nodeContainsBreak(node));
}

function ifContainsBreak(node: Extract<ActivityNode, { kind: 'if' }>): boolean {
  return (
    nodeListContainsBreak(node.thenBranch) ||
    nodeListContainsBreak(node.elseBranch) ||
    node.elseIfBranches.some((b) => nodeListContainsBreak(b.body))
  );
}

function nodeContainsBreak(node: ActivityNode): boolean {
  switch (node.kind) {
    case 'break':
      return true;
    case 'if':
      return ifContainsBreak(node);
    case 'while':
    case 'repeat':
    case 'group':
      return nodeListContainsBreak(node.body);
    case 'fork':
    case 'split':
      return node.branches.some((b) => nodeListContainsBreak(b));
    case 'switch':
      return node.cases.some((c) => nodeListContainsBreak(c.body));
    default:
      return false;
  }
}

/**
 * `ActivityDiagram3#manageSpecialStopEndAfterEndWhile` (`:177-192`):
 * `stop()`/`end()` check this BEFORE adding themselves to `current()`
 * (`:159-165,168-174`) -- when `nodes`'s last element is a `while` whose
 * body has no `break` anywhere, `node` becomes that while's own
 * `specialOut` INSTEAD of an ordinary sibling. Mutates `nodes` in place
 * (replacing its last element with a copy carrying `specialOut`); returns
 * `true` when the redirect fired. Internal to {@link pushParsedNode},
 * this module's only caller.
 */
function redirectToWhileSpecialOut(
  nodes: ActivityNode[],
  node: Extract<ActivityNode, { kind: 'stop' | 'end' }>,
): boolean {
  const last = nodes[nodes.length - 1];
  if (last === undefined || last.kind !== 'while' || nodeListContainsBreak(last.body)) return false;
  nodes[nodes.length - 1] = { ...last, specialOut: node };
  return true;
}

/**
 * `node-dispatch.ts#parseNodes`'s own push site (mission add2-T3b,
 * families WSPEC/RNOOUT) -- the ONE place a dispatched node joins `nodes`,
 * so both families' positional checks live here instead of growing
 * `parseNodes` itself (that file's own 500-line cap). Three things, in
 * order: (1) a `stop`/`end` right after a no-break `endwhile` redirects
 * via {@link redirectToWhileSpecialOut} instead of pushing (WSPEC); (2) a
 * `repeat` about to become non-last loses the speculative `noOut` this
 * function gave the PREVIOUS trailing repeat, since appending anything
 * after it means it is no longer `isLastOfTheParent()` (RNOOUT); (3) a
 * `repeat` node is pushed with `noOut: true` -- correct for as long as it
 * stays last, and corrected back to `false` by the next call if it does
 * not (mirrors `InstructionRepeat.isLastOfTheParent()`,
 * `InstructionRepeat.java:117-121,170`, re-evaluated fresh every time the
 * parent list gains a new element, never computed once and cached).
 */
export function pushParsedNode(nodes: ActivityNode[], node: ActivityNode | undefined): void {
  if (node === undefined) return;
  const prev = nodes[nodes.length - 1];
  if (prev !== undefined && prev.kind === 'repeat' && prev.noOut === true) {
    nodes[nodes.length - 1] = { ...prev, noOut: false };
  }
  if ((node.kind === 'stop' || node.kind === 'end') && redirectToWhileSpecialOut(nodes, node)) return;
  nodes.push(node.kind === 'repeat' ? { ...node, noOut: true } : node);
}

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
