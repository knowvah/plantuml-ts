/**
 * `if-dispatch.ts#unescapeLabelNewlines` (D5, mission `activity-divergence-
 * drive` T3f, `bazuma-86-metu353`): a branch label's literal `\n`/`\t`/`\\`
 * escapes, mirroring `Display#getWithNewlines`'s own backslash pass
 * (`klimt/creole/Display.java:287-313`). Unique test file per the batch-3
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

describe('if-dispatch — branch label \\n/\\t/\\\\ unescaping', () => {
  it('unescapes \\n to a real newline in an else (...) label', () => {
    const ast = parse(['start', 'if (test) then (ok)', ':a;', 'else (not ok\\nonseveral\\nlines)', ':b;', 'endif']);
    const node = firstIf(ast);
    expect(node.elseLabel).toBe('not ok\nonseveral\nlines');
  });

  it('unescapes \\n in a then (...) label', () => {
    const ast = parse(['start', 'if (test) then (yes\\nplease)', ':a;', 'endif']);
    const node = firstIf(ast);
    expect(node.thenLabel).toBe('yes\nplease');
  });

  it('unescapes \\n in an elseif (...) then (...) label', () => {
    const ast = parse(['start', 'if (a) then (x)', ':a;', 'elseif (b) then (y\\nz)', ':b;', 'endif']);
    const node = firstIf(ast);
    expect(node.elseIfBranches[0]!.label).toBe('y\nz');
  });

  it('unescapes \\t to a literal tab and \\\\ to a literal backslash', () => {
    const ast = parse(['start', 'if (test) then (ok)', ':a;', 'else (a\\tb\\\\c)', ':b;', 'endif']);
    const node = firstIf(ast);
    expect(node.elseLabel).toBe('a\tb\\c');
  });

  it('keeps an unrecognised escape verbatim (both characters)', () => {
    const ast = parse(['start', 'if (test) then (ok)', ':a;', 'else (a\\xb)', ':b;', 'endif']);
    const node = firstIf(ast);
    expect(node.elseLabel).toBe('a\\xb');
  });

  it('a label with no backslash is unaffected', () => {
    const ast = parse(['start', 'if (test) then (plain)', ':a;', 'endif']);
    const node = firstIf(ast);
    expect(node.thenLabel).toBe('plain');
  });
});
