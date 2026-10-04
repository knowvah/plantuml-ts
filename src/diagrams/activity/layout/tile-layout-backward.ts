/**
 * Pure AST-level helpers for `FtileRepeat`/`FtileWhile`'s optional
 * `backward:LABEL;` activity, split out of `tile-layout.ts` only to keep
 * that file under the project's 500-line cap (mission `activity-
 * divergence-drive` T3h, push-forward -- the same reason `walk-repeat-
 * backward.ts`/`walk-while-backward.ts` already exist). Both call sites
 * are `tile-layout.ts#tileRepeat`/`tileWhile`; `tileBackwardActivity`
 * (the tile-construction half) stays in `tile-layout.ts` itself, since it
 * needs that file's own private `tileSimpleLeaf`.
 */

import type { ActivityBackward, ActivityNode, ActivityRepeat } from '../ast.js';

/**
 * Pulls `backward:LABEL;` OUT of a repeat/while body, mirroring
 * `ActivityDiagram3#backward` (`:377-391`): the jar never adds it to
 * `InstructionRepeat`/`InstructionWhile`'s own body list at all --
 * `setBackward` (`InstructionRepeat.java:79,124-132`, `InstructionWhile
 * .java:83,198-204`) stores it on a dedicated field instead. This port's
 * parser keeps `ActivityBackward` INLINE in the body array (`ast.ts`'s own
 * `ActivityBackward` doc, a structural divergence noted there) -- this is
 * the seam that corrects it at tile-build time. The LAST `backward:` wins
 * (`this.backward = label` on every `setBackward` call, no accumulation)
 * -- `debofa-60-mude568` exercises two `backward:` lines in one body, the
 * second replacing the first. A `backward:` found OUTSIDE a repeat/while
 * body (this function's only two call sites) never reaches here --
 * `tile-layout.ts#tileNode`'s own `NULL_RESULT_KINDS` stays the fallback
 * for that case.
 */
export function extractBackward(body: readonly ActivityNode[]): {
  rest: ActivityNode[];
  backward: ActivityBackward | undefined;
} {
  let backward: ActivityBackward | undefined;
  const rest: ActivityNode[] = [];
  for (const node of body) {
    if (node.kind === 'backward') {
      backward = node;
      continue;
    }
    rest.push(node);
  }
  return { rest, backward };
}

/**
 * BACKLBL (add2 T3i): attaches `backward.incoming`/`.outgoing` onto a
 * `GtileWhileContext`/`GtileRepeatContext`-shaped object, as `backIncoming`/
 * `backOutgoing` -- generic over both contexts' shapes so this one
 * function covers `tile-layout.ts#tileWhile`/`tileRepeat` alike. `ctx`'s
 * own fields pass through unchanged; a `backward === undefined` leaves
 * both new fields unset (`undefined`), same as every other optional
 * context field.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:146,158-161
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:170-178,182-187
 */
export function withBackLabels<T extends object>(
  ctx: T,
  backward: ActivityBackward | undefined,
): T & { backIncoming: string | undefined; backOutgoing: string | undefined } {
  return { ...ctx, backIncoming: backward?.incoming, backOutgoing: backward?.outgoing };
}

/**
 * `FtileRepeat`'s own `backwardExitsOnLeft` (`FtileRepeat.java:210-219`):
 * `false` when either lane is unset (the common case -- every repeat row
 * without `|Lane|` syntax), else whether the backward activity's own lane
 * sorts BEFORE `swimlaneOut` in declaration order (`Swimlane#compareTo`:
 * `Integer.compare(this.order, other.order)`, the lane's own index --
 * `laneOrder.indexOf`, the same idiom `conditional-builder.ts#isMainLane
 * SmallerThanAllOthers` already uses).
 */
export function backwardExitsOnLeft(
  backwardLane: string | undefined,
  swimlaneOut: string | undefined,
  laneOrder: readonly string[],
): boolean {
  if (backwardLane === undefined || swimlaneOut === undefined) return false;
  const backIndex = laneOrder.indexOf(backwardLane);
  const outIndex = laneOrder.indexOf(swimlaneOut);
  return backIndex !== -1 && outIndex !== -1 && backIndex < outIndex;
}

/**
 * `FtileRepeat.create`'s condition-diamond side-label choice, the
 * INSIDE_HEXAGON branch (`FtileRepeat.java:141-154`): west+south when
 * {@link backwardExitsOnLeft}, else east+south (the pre-T3h default,
 * unconditionally used when `backward` is unset -- `backwardExitsOnLeft`
 * itself returns `false` for an unset backward, `FtileRepeat.java:
 * 211-212`).
 */
export function repeatConditionLabels(
  node: ActivityRepeat,
  backward: ActivityBackward | undefined,
  laneOrder: readonly string[],
): { east?: string; west?: string; south?: string } {
  const labels: { east?: string; west?: string; south?: string } = {};
  if (node.outLabel !== undefined) labels.south = node.outLabel;
  const onLeft = backward !== undefined && backwardExitsOnLeft(backward.swimlane, node.swimlaneOut, laneOrder);
  if (node.yesLabel !== undefined) {
    if (onLeft) labels.west = node.yesLabel;
    else labels.east = node.yesLabel;
  }
  return labels;
}

/**
 * CSTYLE (add2 T3i): the INSIDE_DIAMOND branch (`FtileRepeat.java:
 * 159-161`, `new FtileDiamondSquare(...).withEast(yesTb).withSouth
 * (outTb)`) -- ALWAYS east+south, UNLIKE {@link repeatConditionLabels}'s
 * own west/east choice: the Java source has no `backwardExitsOnLeft`
 * read in this branch at all (verified directly, not assumed).
 */
export function repeatConditionLabelsSquare(node: ActivityRepeat): { east?: string; south?: string } {
  const labels: { east?: string; south?: string } = {};
  if (node.outLabel !== undefined) labels.south = node.outLabel;
  if (node.yesLabel !== undefined) labels.east = node.yesLabel;
  return labels;
}

/** CSTYLE (add2 T3i): dispatches {@link repeatConditionLabelsSquare} or
 *  {@link repeatConditionLabels} on `conditionStyle` -- split out of
 *  `tile-layout.ts#tileRepeat` purely to keep that file under the 500-
 *  line cap. */
export function selectRepeatConditionLabels(
  conditionStyle: string | undefined,
  node: ActivityRepeat,
  backward: ActivityBackward | undefined,
  laneOrder: readonly string[],
): { east?: string; west?: string; south?: string } {
  return conditionStyle === 'insideDiamond'
    ? repeatConditionLabelsSquare(node)
    : repeatConditionLabels(node, backward, laneOrder);
}
