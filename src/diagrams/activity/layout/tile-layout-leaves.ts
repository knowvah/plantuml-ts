/**
 * `tileNode`'s simple-leaf and early-leaf dispatch, split out of
 * `tile-layout.ts` only to keep that file under the 500-line hook
 * (mission convention, "a sibling module when a file would cross the
 * hook" -- the same reasoning `tile-layout-backward.ts`/
 * `tile-layout-structural.ts` were already split out for; T1b pass 2
 * made the room for this split).
 */

import type { ActivityNode } from '../ast.js';
import type { StringBounder, Tile } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import { GtileStart } from '../tiles/gtile-start.js';
import { GtileStop } from '../tiles/gtile-stop.js';
import { GtileEnd } from '../tiles/gtile-end.js';
import { GtileBreak } from '../tiles/gtile-break.js';
import { GtileAction } from '../tiles/gtile-action.js';
import { GtileNote } from '../tiles/gtile-note.js';
import { GtileSpot } from '../tiles/gtile-spot.js';
import { GtileLabel } from '../tiles/gtile-label.js';
import { GtileGoto } from '../tiles/gtile-goto.js';
import { withSwimlane } from './tile-layout.js';

// `kill`/`detach` are NOT simple leaves (T2b): `tileNodes` intercepts and
// consumes them before either of these ever sees one -- see `withKilled`
// and its call site in `tile-layout.ts`. They stay out of this set so that
// invariant is enforced at the type level too (a direct `tileNode` call on
// one falls through to the `kill`/`detach` no-op case in its own switch,
// below).
type SimpleLeafKind = 'start' | 'stop' | 'end' | 'break' | 'action' | 'note';

const SIMPLE_LEAF_KINDS: ReadonlySet<string> = new Set<SimpleLeafKind>([
  'start',
  'stop',
  'end',
  'break',
  'action',
  'note',
]);

/** Named alias for `isSimpleLeaf`'s type predicate and `tileSimpleLeaf`'s
 *  own parameter -- same extraction `EarlyLeafNode` already has below,
 *  for the same reason (a bare inline `Extract<...>` repeated at two call
 *  sites is harder to scan, and this repo's own lizard reader has
 *  previously desynced on an inline generic-plus-object-literal shape;
 *  `.agent-notes/lizard-lt-in-object-literal.md`). */
type SimpleLeafNode = Extract<ActivityNode, { kind: SimpleLeafKind }>;

/** User-defined type guard (not a bare `Set.has`) so both `tileNode`
 *  branches narrow: the `if` arm to {@link SimpleLeafKind}, and -- just as
 *  important -- the switch below it to the COMPLEMENT, which is what lets
 *  that switch's `default: const _exhaustive: never = node` still
 *  type-check. */
export function isSimpleLeaf(node: ActivityNode): node is SimpleLeafNode {
  return SIMPLE_LEAF_KINDS.has(node.kind);
}

/**
 * Kinds that always produce no tile of their own HERE: `arrow-label`
 * (mission ubrr-T10, no geometry of its own -- T1b pass 2: its label
 * TEXT is consumed by `tile-layout.ts#tileNodes` BEFORE this function
 * ever runs, via `tile-layout-inlabel.ts#consumeArrowLabel`, same as
 * `kill`/`detach` below), `backward` (mission `activity-divergence-
 * drive` T3h: `tileRepeat`/`tileWhile`'s own `extractBackward` pulls it
 * OUT of a repeat/while body before `tileNodes` ever sees it there --
 * this branch is the fallback for a `backward:` found OUTSIDE that
 * context, e.g. nested in an `if`/`fork` inside the loop body or at
 * top level, both of which the jar itself refuses to parse,
 * `ActivityDiagram3.java:390` `"Cannot find repeat"` -- an `error` row,
 * D8, not reached by any baseline fixture), and `kill`/`detach` (T2b --
 * see {@link SimpleLeafKind}'s doc; `tileNodes` consumes these before
 * `tileNode` ever runs, so this branch is a direct-call safety net, not
 * a live path). `spot`/`label`/`goto` (add2 T2g): a visible 20x20
 * circle and two zero-size pass-through tiles respectively -- see each
 * type's own `ast.ts` doc for the Java/empirical basis. None of the
 * seven needs a `bounder`/`theme` (unlike {@link tileSimpleLeaf}'s
 * `action`/`note`), so they stay out of that set, and all seven share
 * ONE type-predicate (rather than two) so `tileNode` keeps a SINGLE
 * `if` here -- a second `if` would push that function's own CCN over
 * the complexity hook's cap (`tileNode`'s own doc explains why its
 * budget is tight).
 */
const EARLY_LEAF_KINDS: ReadonlySet<string> = new Set([
  'arrow-label',
  'backward',
  'kill',
  'detach',
  'spot',
  'label',
  'goto',
]);

type EarlyLeafNode = Extract<
  ActivityNode,
  { kind: 'arrow-label' | 'backward' | 'kill' | 'detach' | 'spot' | 'label' | 'goto' }
>;

export function isEarlyLeafKind(node: ActivityNode): node is EarlyLeafNode {
  return EARLY_LEAF_KINDS.has(node.kind);
}

export function tileEarlyLeaf(node: EarlyLeafNode): Tile | null {
  switch (node.kind) {
    case 'arrow-label':
    case 'backward':
    case 'kill':
    case 'detach':
      return null;
    case 'spot':
      return withSwimlane(new GtileSpot(node), node.swimlane);
    case 'label':
      return withSwimlane(new GtileLabel(node), node.swimlane);
    case 'goto':
      return withSwimlane(new GtileGoto(node), node.swimlane);
  }
}

/**
 * Every leaf tile with no nested body and no `null` result: `start`/
 * `stop`/`end`/`break` (no bounder/theme needed) plus `action`/`note`
 * (need both). `kill`/`detach` are NOT here -- see {@link SimpleLeafKind}'s
 * own doc. Extracted from `tileNode` (mission ubrr-T10) to keep ITS OWN
 * switch under the complexity hook's cap once `backward` (M3) became a
 * 15th case there.
 */
export function tileSimpleLeaf(node: SimpleLeafNode, bounder: StringBounder, theme: Theme): Tile {
  switch (node.kind) {
    case 'start':
      return withSwimlane(new GtileStart(), node.swimlane);
    case 'stop':
      return withSwimlane(new GtileStop(), node.swimlane);
    case 'end':
      return withSwimlane(new GtileEnd(), node.swimlane);
    case 'break':
      return withSwimlane(new GtileBreak(), node.swimlane);
    case 'action':
      return withSwimlane(new GtileAction(node, bounder, theme), node.swimlane);
    case 'note':
      return withSwimlane(new GtileNote(node, bounder, theme), node.swimlane);
  }
}
