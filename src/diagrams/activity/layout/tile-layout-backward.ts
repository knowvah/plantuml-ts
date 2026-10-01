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
 * `FtileRepeat.create`'s condition-diamond side-label choice
 * (`FtileRepeat.java:141-154`, INSIDE_HEXAGON branch only -- the only
 * style `tile-layout.ts#tileRepeat` models, per that function's own doc):
 * west+south when {@link backwardExitsOnLeft}, else east+south (the
 * pre-T3h default, unconditionally used when `backward` is unset --
 * `backwardExitsOnLeft` itself returns `false` for an unset backward,
 * `FtileRepeat.java:211-212`).
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
