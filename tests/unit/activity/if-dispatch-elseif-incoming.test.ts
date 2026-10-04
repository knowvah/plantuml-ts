/**
 * `dispatch-support.ts#RE_ELSEIF`/`if-dispatch.ts#consumeElseifClause`
 * (ELSEIFIN, T3f, `dulate-94-bupu593`/`nolubo-93-rula384`): the leading
 * `(incoming)` decoration on `elseif` is now CAPTURED onto
 * `ActivityElseIf.incomingLabel`, not dropped.
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandElseIf2.java:70-76,147-151
 *
 * NOT yet drawn: `conditional-builder.ts#buildLongHorizontalDiamonds`
 * (outside this task's write-set) still needs to feed `incomingLabel`
 * into the diamond's own `west` label slot
 * (`FtileIfLongHorizontal.java:178-186`'s `diamond.withWest(tbInlabel)`,
 * the SAME slot `walk-if-long-horizontal.ts#pushDiamondLabel(...,
 * 'west', ...)` already draws) -- this file only pins the parse/AST
 * capture.
 */
import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ActivityDiagramAST, ActivityIf } from '../../../src/diagrams/activity/ast.js';
import { parseAst } from '../../helpers/parse-ast.js';

function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

function firstIf(ast: ActivityDiagramAST): ActivityIf {
  const node = ast.nodes.find((n) => n.kind === 'if');
  if (node === undefined || node.kind !== 'if') throw new Error('Expected an if node');
  return node;
}

describe('if-dispatch — elseif leading (incoming) label (ELSEIFIN)', () => {
  it('captures the leading (incoming) decoration onto incomingLabel', () => {
    const ast = parse([
      'start',
      'if (foo) then (ok3)',
      ':f1;',
      '(additional text) elseif (foo2) then (ok2)',
      ':f2;',
      'else (notok)',
      ':f3;',
      'endif',
    ]);
    const node = firstIf(ast);
    expect(node.elseIfBranches[0]!.incomingLabel).toBe('additional text');
    expect(node.elseIfBranches[0]!.condition).toBe('foo2');
    expect(node.elseIfBranches[0]!.label).toBe('ok2');
  });

  it('omits incomingLabel when elseif has no leading decoration', () => {
    const ast = parse(['start', 'if (a) then (x)', ':a;', 'elseif (b) then (y)', ':b;', 'endif']);
    const node = firstIf(ast);
    expect(node.elseIfBranches[0]!.incomingLabel).toBeUndefined();
  });

  it('a decorated elseif still stops the preceding branch body scan', () => {
    const ast = parse([
      'start',
      'if (foo) then (ok3)',
      ':f1;',
      '(additional text) elseif (foo2) then (ok2)',
      ':f2;',
      'endif',
    ]);
    const node = firstIf(ast);
    expect(node.thenBranch).toHaveLength(1);
    expect(node.elseIfBranches).toHaveLength(1);
  });
});
