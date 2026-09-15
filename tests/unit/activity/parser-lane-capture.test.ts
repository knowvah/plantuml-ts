/**
 * Mission `activity-lane-capture`: each compound kind captures its own
 * `swimlane` at its opener, not at its closer. T4-T7 append their own
 * `describe` blocks here; this file starts with T3's `if`.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:309
 */
import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ActivityAction, ActivityDiagramAST, ActivityIf } from '../../../src/diagrams/activity/ast.js';
import { parseAst } from '../../helpers/parse-ast.js';

function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

describe('if captures its opener lane', () => {
  it("the if node's swimlane is the lane at `if`, the branch action's is its own", () => {
    const ast = parse(['|A|', 'if (x) then', '|B|', ':b;', 'endif']);
    const ifNode = ast.nodes[0] as ActivityIf;
    expect(ifNode.swimlane).toBe('A');
    const action = ifNode.thenBranch[0] as ActivityAction;
    expect(action.swimlane).toBe('B');
  });

  it('a lane switch in an elseif or else branch does not move the if node’s own lane', () => {
    const ast = parse(['|A|', 'if (x) then', ':t;', 'elseif (y) then', '|B|', ':ei;', 'else', '|C|', ':e;', 'endif']);
    const ifNode = ast.nodes[0] as ActivityIf;
    expect(ifNode.swimlane).toBe('A');
    expect((ifNode.elseIfBranches[0]?.body[0] as ActivityAction).swimlane).toBe('B');
    expect((ifNode.elseBranch[0] as ActivityAction).swimlane).toBe('C');
  });

  it('swimlane is undefined when no lane is ever declared', () => {
    const ast = parse(['if (x) then', ':t;', 'else', ':e;', 'endif']);
    const ifNode = ast.nodes[0] as ActivityIf;
    expect(ifNode.swimlane).toBeUndefined();
  });
});
