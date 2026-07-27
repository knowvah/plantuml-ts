/**
 * Subtree-width measurement for the activity diagram layout engine.
 * Recursively measures the column width a node (or sequence of nodes)
 * requires so composite layouts (if/fork/split/while/repeat) can size
 * their branch columns before placing them (see `layout.old.ts`).
 */

import type { ActivityIf, ActivityNode } from './ast.js';
import type { LayoutCtx } from './activity-layout-types.js';
import { ACTION_H_PAD, NODE_MARGIN_X } from './activity-layout-constants.js';
import { actionSize, parallelogramSize } from './activity-layout-helpers.js';

function measureIfWidth(node: ActivityIf, ctx: LayoutCtx): number {
  const branchWidths = [
    measureSubtreeWidth(node.thenBranch, ctx),
    ...node.elseIfBranches.map((eif) => measureSubtreeWidth(eif.body, ctx)),
    measureSubtreeWidth(node.elseBranch, ctx),
  ];
  const n = branchWidths.length;
  return branchWidths.reduce((sum, w) => sum + w, 0) + NODE_MARGIN_X * (n - 1);
}

function measureParallelBranchesWidth(
  branches: readonly (readonly ActivityNode[])[],
  ctx: LayoutCtx,
): number {
  const n = branches.length;
  const total = branches.reduce((sum, b) => sum + measureSubtreeWidth(b, ctx), 0);
  return total + NODE_MARGIN_X * Math.max(n - 1, 0);
}

/**
 * Recursively measure the column width required for a single node.
 * For composite nodes (if/fork/split), this is the sum of all branch widths.
 * For leaf nodes, this is the rendered node width.
 */
export function measureNodeWidth(node: ActivityNode, ctx: LayoutCtx): number {
  switch (node.kind) {
    case 'action':
      if (node.stereotype === 'save') return parallelogramSize(node.label, ctx).width;
      return actionSize(node.label, ctx).width;
    case 'note':
      return actionSize(node.text, ctx).width;
    case 'if':
      return measureIfWidth(node, ctx);
    case 'fork':
    case 'split':
      return measureParallelBranchesWidth(node.branches, ctx);
    case 'while':
      return measureSubtreeWidth(node.body, ctx);
    case 'repeat':
      // Extra NODE_MARGIN_X on each side so the right-side back-edge clears the body.
      return measureSubtreeWidth(node.body, ctx) + NODE_MARGIN_X * 2;
    default:
      return ACTION_H_PAD * 2;
  }
}

/**
 * Returns the minimum column width needed to lay out the given sequence of
 * nodes vertically. This is the MAX width of any individual node in the
 * sequence (since nodes stack vertically and share the same column).
 */
export function measureSubtreeWidth(
  nodes: readonly ActivityNode[],
  ctx: LayoutCtx,
): number {
  if (nodes.length === 0) return ACTION_H_PAD * 2;
  return Math.max(...nodes.map((n) => measureNodeWidth(n, ctx)));
}
