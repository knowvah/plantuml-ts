/**
 * `together { }` for the description engine (cdd3-T18): the same upstream
 * code path as class. `DescriptionDiagramFactory.java:97` registers the same
 * `CommandTogether`, and the same `CucaDiagram` methods record membership:
 * `gotoTogether` (`atmp/CucaDiagram.java:339-341`), `reallyCreateLeaf`
 * (`:232`) and `gotoGroup` (`:349-353`). The same `Cluster#printCluster2`
 * prints it (`svek/Cluster.java:528-583`, via `src/core/svek-dot-together.ts`).
 *
 * The block is a transparent frame on `containerStack`: its children land in
 * the enclosing container's array, so it adds no DOT cluster of its own. An
 * entity created while the frame is the TOP of the stack joins the together
 * (`currentTogether()`, `:188-194`). An entity created inside a container
 * opened within the block does not.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandTogether.java:73-76
 */
import type { DotInputGraph, DotInputTogether } from '../../core/graph-layout.js';
import type { DescriptiveNode } from './ast.js';
import type { ClassifyCtx } from './layout-types.js';
import type { ParseState } from './parse-state.js';

/** Id prefix of a together frame on `containerStack`. */
export const TOGETHER_FRAME_PREFIX = '__together_';

/** One `together { }` block (`abel/Together.java:39-51`). */
export interface DescriptionTogether {
  readonly id: string;
  /** The enclosing together when this one opened directly inside it. */
  readonly parentId?: string;
  /** The entities created while it was the top of the stack. */
  readonly members: DescriptiveNode[];
}

/** `CucaDiagram#currentTogether` (`atmp/CucaDiagram.java:188-194`). */
export function currentTogether(state: ParseState): string | undefined {
  const top = state.containerStack[state.containerStack.length - 1];
  return top?.id.startsWith(TOGETHER_FRAME_PREFIX) === true ? top.id : undefined;
}

/** `together {` (`CucaDiagram#gotoTogether`, `atmp/CucaDiagram.java:339-341`):
 *  push a transparent frame whose children fall through to the enclosing
 *  container's array; the matching `}` pops it like any block. */
export function openTogetherFrame(state: ParseState): void {
  const togethers = (state.ast.togethers ??= []);
  const parentId = currentTogether(state);
  const id = `${TOGETHER_FRAME_PREFIX}${togethers.length}`;
  togethers.push({ id, members: [], ...(parentId !== undefined ? { parentId } : {}) });
  const top = state.containerStack[state.containerStack.length - 1];
  state.containerStack.push({
    id,
    display: '',
    symbol: 'rectangle',
    children: top !== undefined ? top.children : state.ast.nodes,
  });
}

/** `result.setTogether(currentTogether())` for a newly created entity, leaf
 *  or group (`atmp/CucaDiagram.java:232,353`). Call before the node is
 *  pushed onto the stack (a container). */
export function joinCurrentTogether(state: ParseState, node: DescriptiveNode): void {
  const id = currentTogether(state);
  if (id === undefined) return;
  state.ast.togethers?.find((t) => t.id === id)?.members.push(node);
}

/** The together of the AST node behind a DOT key, if any. */
function togetherOfKey(
  key: string,
  ctx: ClassifyCtx,
  togetherOf: ReadonlyMap<DescriptiveNode, string>,
): string | undefined {
  const node = ctx.astNodeById.get(key);
  return node === undefined ? undefined : togetherOf.get(node);
}

function toDotTogether(t: DescriptionTogether): DotInputTogether {
  return t.parentId !== undefined ? { id: t.id, parentId: t.parentId } : { id: t.id };
}

/** Every member AST node mapped to its together id. */
function membership(togethers: readonly DescriptionTogether[]): Map<DescriptiveNode, string> {
  const togetherOf = new Map<DescriptiveNode, string>();
  for (const t of togethers) for (const node of t.members) togetherOf.set(node, t.id);
  return togetherOf;
}

/** `together` on each member-group cluster. */
function markClusters(input: DotInputGraph, ctx: ClassifyCtx, togetherOf: ReadonlyMap<DescriptiveNode, string>): void {
  const astIdOfCluster = new Map(ctx.containers.map((d) => [d.clusterId, d.astId] as const));
  for (const c of input.clusters ?? []) {
    const astId = astIdOfCluster.get(c.id);
    const t = astId === undefined ? undefined : togetherOfKey(astId, ctx, togetherOf);
    if (t !== undefined) c.together = t;
  }
}

/** Project the membership onto the layout input: `togethers`, then
 *  `together` on every member node and member-group cluster. */
export function applyDescriptionTogethers(
  input: DotInputGraph,
  togethers: readonly DescriptionTogether[],
  ctx: ClassifyCtx,
): void {
  if (togethers.length === 0) return;
  input.togethers = togethers.map(toDotTogether);
  const togetherOf = membership(togethers);
  for (const n of input.nodes) {
    const t = togetherOfKey(n.id, ctx, togetherOf);
    if (t !== undefined) n.together = t;
  }
  markClusters(input, ctx, togetherOf);
}
