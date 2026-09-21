import type { BoardDiagramAST, BoardNode, BoardGeometry, ActivityGeometry, CardGeometry } from './ast.js';

// `PostIt.getWidth()`/`getHeight()` (`board/PostIt.java:52-58`) — the fixed
// pixel size of one card cell in the board grid.
const CELL_W = 170;
/** Exported so `renderer.ts` shares one definition instead of redeclaring it
 *  (code review 2026-09-21). */
export const CELL_H = 90;

interface NodeWithX {
  node: BoardNode;
  x: number;
}

function computeX(node: BoardNode, count: { value: number }): NodeWithX[] {
  const results: NodeWithX[] = [];
  const thisX = count.value;
  results.push({ node, x: thisX });
  for (let i = 0; i < node.children.length; i++) {
    if (i > 0) count.value += 1;
    results.push(...computeX(node.children[i]!, count));
  }
  return results;
}

export function layoutBoard(ast: BoardDiagramAST): BoardGeometry {
  const activities: ActivityGeometry[] = [];
  let xOffset = 0;
  let globalMaxStage = 0;

  for (const activity of ast.activities) {
    const count = { value: 0 };
    const nodesWithX = computeX(activity.root, count);

    const maxX = Math.max(...nodesWithX.map((n) => n.x));
    const maxStage = Math.max(...nodesWithX.map((n) => n.node.stage));
    const fullWidth = (maxX + 1) * CELL_W;

    const cards: CardGeometry[] = nodesWithX.map(({ node, x }) => ({
      label: node.name,
      dx: x * CELL_W,
      dy: node.stage * CELL_H,
    }));

    activities.push({ xOffset, fullWidth, cards });
    xOffset += fullWidth;
    globalMaxStage = Math.max(globalMaxStage, maxStage);
  }

  return { activities, totalWidth: xOffset, maxStage: globalMaxStage };
}
