/**
 * `if-dispatch.ts#matchIfHeader`/`consumeElseifClause` (IFNL, T3d,
 * `vaxiki-78-nice114`): the `if`/`elseif` CONDITION itself must go through
 * `unescapeLabelNewlines`, mirroring `Display.getWithNewlines`
 * (`CommandIf2.java:151`, `CommandIf4.java:120`, `CommandElseIf2.java:151`)
 * -- the branch-label unescape test already covers `thenLabel`/`elseLabel`/
 * elseif `label`, never `condition`. Unique test file per the batch-3
 * scratch/test-file-naming rule (overview.md).
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

describe('if-dispatch — condition \\n unescaping (IFNL)', () => {
  it('unescapes \\n in an if (...) condition to a real newline', () => {
    const ast = parse(['start', 'if (dummy\\non\\nseveral) then (foo)', 'stop', 'endif']);
    const node = firstIf(ast);
    expect(node.condition).toBe('dummy\non\nseveral');
  });

  it('unescapes \\n in an elseif (...) condition', () => {
    const ast = parse(['start', 'if (a) then (x)', ':a;', 'elseif (b1\\nb2) then (y)', ':b;', 'endif']);
    const node = firstIf(ast);
    expect(node.elseIfBranches[0]!.condition).toBe('b1\nb2');
  });

  it('a condition with no backslash is unaffected', () => {
    const ast = parse(['start', 'if (plain condition) then (ok)', ':a;', 'endif']);
    const node = firstIf(ast);
    expect(node.condition).toBe('plain condition');
  });
});
