/**
 * Phase 1: AST classification (`classifyAst`/`classifyAsCluster`/
 * `isEffectiveCluster`/`countRawContainers`) -- split out of `layout.ts`
 * purely to keep that file under this project's 500-line cap. Self-
 * contained (walks the AST, populates a `ClassifyCtx`), so it moves as
 * one cohesive unit; `layout.ts` re-exports `isEffectiveCluster` so
 * `from './layout.js'` is unchanged for `layout-dot-tree.ts`'s own
 * import. Pure move, zero behavior change.
 */

import type { DescriptiveNode } from './ast.js';
import { isClusterNode } from './layout-helpers.js';
import { dotKeyFor, scopedKey } from './namespace-groups.js';
import type { ClassifyCtx, ContainerDesc } from './layout-types.js';

function classifyAsCluster(
  node: DescriptiveNode,
  ctx: ClassifyCtx,
  removed: ReadonlySet<string>,
  key: string,
  ancestorIds: readonly string[],
  parentAstId?: string,
): void {
  const clusterId = `cluster${ctx.counter.n++}`;
  const childAncestors = [...ancestorIds, node.id];
  const directLeafAstIds = node.children
    .filter((c) => !isEffectiveCluster(c, removed))
    .map((c) => dotKeyFor(childAncestors, c.id, ctx.collidingIds));
  const desc: ContainerDesc = {
    clusterId,
    astId: key,
    symbol: node.symbol,
    display: node.display,
    directLeafAstIds,
  };
  if (parentAstId !== undefined) desc.parentAstId = parentAstId;
  if (node.stereotype !== undefined) desc.stereotype = node.stereotype;
  ctx.containers.push(desc);
  ctx.containerById.set(key, desc);
  classifyAst(node.children, ctx, removed, childAncestors, key);
  // #lizard forgives -- pre-existing (6 params): the cohesive AST-
  // classification context (node/ctx/removed/key/ancestorIds/parentAstId)
  // threaded from classifyAst's own recursive call, not new here
  // (mission G5/C1 500-line split -- pure move, full-file rescan surfaced
  // it, not introduced).
}

/** Unfiltered container count (declaration view) — the degenerate check
 *  (DotData.isDegeneratedWithFewEntities) counts groups BEFORE removal. */
export function countRawContainers(nodes: readonly DescriptiveNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (isClusterNode(node)) n += 1 + countRawContainers(node.children);
  }
  return n;
}

/** Removal-aware cluster predicate: GraphvizImageBuilder's empty-group
 *  demotion (java:416-418) applies to the removal-FILTERED view — a group
 *  whose visible children are all removed becomes a LEAF (gezemu-34 oracle:
 *  `frame l3 { component D }` + `remove D` renders l3 as a rect). */
export function isEffectiveCluster(node: DescriptiveNode, removed: ReadonlySet<string>): boolean {
  return isClusterNode(node) && node.children.some((c) => !removed.has(c.id));
}

export function classifyAst(
  nodes: readonly DescriptiveNode[],
  ctx: ClassifyCtx,
  removed: ReadonlySet<string>,
  ancestorIds: readonly string[] = [],
  parentAstId?: string,
): void {
  for (const node of nodes) {
    const key = dotKeyFor(ancestorIds, node.id, ctx.collidingIds);
    ctx.astNodeById.set(key, node);
    ctx.qualifiedPathToDotKey.set(scopedKey([...ancestorIds, node.id]), key);
    if (isEffectiveCluster(node, removed)) {
      classifyAsCluster(node, ctx, removed, key, ancestorIds, parentAstId);
    } else {
      ctx.leafIdSet.add(key);
    }
  }
}
