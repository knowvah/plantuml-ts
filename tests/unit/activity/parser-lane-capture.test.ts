/**
 * Mission `activity-lane-capture`: each compound kind captures its own
 * `swimlane` at its opener, not at its closer. T4-T7 append their own
 * `describe` blocks here; this file starts with T3's `if`.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:309
 */
import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type {
  ActivityAction,
  ActivityDiagramAST,
  ActivityFork,
  ActivityIf,
  ActivityRepeat,
  ActivityWhile,
} from '../../../src/diagrams/activity/ast.js';
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

describe('while captures its opener lane', () => {
  it("the while node's swimlane is the lane at `while`, the body action's is its own", () => {
    const ast = parse(['|A|', 'while (x)', '|B|', ':b;', 'endwhile']);
    const whileNode = ast.nodes[0] as ActivityWhile;
    expect(whileNode.swimlane).toBe('A');
    const action = whileNode.body[0] as ActivityAction;
    expect(action.swimlane).toBe('B');
  });

  it('a lane switch inside the body does not move the while node’s own lane', () => {
    const ast = parse(['|A|', 'while (x)', ':t;', '|B|', ':b;', 'endwhile']);
    const whileNode = ast.nodes[0] as ActivityWhile;
    expect(whileNode.swimlane).toBe('A');
    expect((whileNode.body[1] as ActivityAction).swimlane).toBe('B');
  });

  it('swimlane is undefined when no lane is ever declared', () => {
    const ast = parse(['while (x)', ':t;', 'endwhile']);
    const whileNode = ast.nodes[0] as ActivityWhile;
    expect(whileNode.swimlane).toBeUndefined();
  });
});

describe('repeat captures its opener lane and repeat-while its out lane', () => {
  it("the repeat node's swimlane is the lane at `repeat`, swimlaneOut the lane at `repeat while`", () => {
    const ast = parse(['|A|', 'repeat', '|B|', ':b;', 'repeat while (x)']);
    const repeatNode = ast.nodes[0] as ActivityRepeat;
    expect(repeatNode.swimlane).toBe('A');
    expect(repeatNode.swimlaneOut).toBe('B');
    const action = repeatNode.body[0] as ActivityAction;
    expect(action.swimlane).toBe('B');
  });

  it('swimlaneOut equals swimlane when the loop opens and closes in one lane', () => {
    const ast = parse(['|A|', 'repeat', ':b;', 'repeat while (x)']);
    const repeatNode = ast.nodes[0] as ActivityRepeat;
    expect(repeatNode.swimlane).toBe('A');
    expect(repeatNode.swimlaneOut).toBe('A');
  });

  it('the inline `repeat :action;` form reads the lane at the opener', () => {
    const ast = parse(['|A|', 'repeat :a;', 'repeat while (x)']);
    const repeatNode = ast.nodes[0] as ActivityRepeat;
    expect(repeatNode.swimlane).toBe('A');
    const action = repeatNode.body[0] as ActivityAction;
    expect(action.swimlane).toBe('A');
  });

  it('swimlane and swimlaneOut are undefined when no lane is ever declared', () => {
    const ast = parse(['repeat', ':b;', 'repeat while (x)']);
    const repeatNode = ast.nodes[0] as ActivityRepeat;
    expect(repeatNode.swimlane).toBeUndefined();
    expect(repeatNode.swimlaneOut).toBeUndefined();
  });
});

describe('fork captures its opener lane and re-reads swimlaneOut at fork again / end fork', () => {
  it("the fork node's swimlane is the lane at `fork`, swimlaneOut the lane at `end fork`", () => {
    const ast = parse(['|A|', 'fork', ':a;', 'fork again', '|B|', ':b;', 'end fork']);
    const forkNode = ast.nodes[0] as ActivityFork;
    expect(forkNode.swimlane).toBe('A');
    expect(forkNode.swimlaneOut).toBe('B');
  });

  it('swimlaneOut equals swimlane when every branch stays in one lane', () => {
    const ast = parse(['|A|', 'fork', ':a;', 'fork again', ':b;', 'end fork']);
    const forkNode = ast.nodes[0] as ActivityFork;
    expect(forkNode.swimlane).toBe('A');
    expect(forkNode.swimlaneOut).toBe('A');
  });

  it(
    'a lane switch only before `fork again` sets swimlaneOut to that lane, ' +
      'and `end fork` in the same lane leaves it unchanged',
    () => {
      const ast = parse(['|A|', 'fork', ':a;', '|B|', 'fork again', ':b;', 'end fork']);
      const forkNode = ast.nodes[0] as ActivityFork;
      expect(forkNode.swimlane).toBe('A');
      expect(forkNode.swimlaneOut).toBe('B');
    },
  );

  it('swimlane and swimlaneOut are undefined when no lane is ever declared', () => {
    const ast = parse(['fork', ':a;', 'fork again', ':b;', 'end fork']);
    const forkNode = ast.nodes[0] as ActivityFork;
    expect(forkNode.swimlane).toBeUndefined();
    expect(forkNode.swimlaneOut).toBeUndefined();
  });
});
