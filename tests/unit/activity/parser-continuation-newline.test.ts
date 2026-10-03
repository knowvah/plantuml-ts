/**
 * `parser.ts#joinUnbalancedLines` (MLJOIN, T3d, `pekefu-66-mepa144`/
 * `xabesu-51-dimi831`): a condition/label that spills onto a following
 * physical line must be joined with the hidden-newline escape (`\n` as a
 * literal 2-char `\`+`n` sequence), mirroring upstream's
 * `CommandDecoratorMultine.java:63` `toSingleLineWithHiddenNewLine` --
 * never a plain space, which upstream never produces and which drops the
 * line break `if-dispatch.ts#unescapeLabelNewlines` would otherwise
 * restore. Unique test file per the batch-3 scratch/test-file-naming
 * rule (overview.md).
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

describe('parser — continuation-line join preserves the line break', () => {
  it('an elseif condition split across 2 lines becomes one real newline', () => {
    const ast = parse([
      'start',
      'if (some test) then (yes)',
      ':acti1;',
      'elseif (no on',
      'several lines)',
      ':acti2;',
      'endif',
    ]);
    const node = firstIf(ast);
    expect(node.elseIfBranches[0]!.condition).toBe('no on\nseveral lines');
  });

  it('an if condition split across 2 lines becomes one real newline', () => {
    const ast = parse(['start', 'if(beginning of', 'the day)', ':a;', 'endif']);
    const node = firstIf(ast);
    expect(node.condition).toBe('beginning of\nthe day');
  });

  it('a 3-line continuation joins every line with its own break', () => {
    const ast = parse(['start', 'if (a is b', 'c is d', 'e is f)', ':a;', 'endif']);
    const node = firstIf(ast);
    expect(node.condition).toBe('a is b\nc is d\ne is f');
  });

  it('a balanced if/elseif line is unaffected (no continuation)', () => {
    const ast = parse(['start', 'if (x) then (y)', ':a;', 'endif']);
    const node = firstIf(ast);
    expect(node.condition).toBe('x');
  });
});
