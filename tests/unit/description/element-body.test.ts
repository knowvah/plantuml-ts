/**
 * S1L-b T2 — a `<keyword> <code> [ … ]` element body (upstream
 * `CommandCreateElementMultilines` TYPE1) is the element's display/label,
 * not discarded. Previously `tryElementBlock` emitted the node with
 * `display = code` and dropped every body line (a shortcut from when node
 * sizes were tolerant); now that S1L asserts node sizes, the body must
 * reach `node.display`. See `src/diagrams/description/parser.ts`.
 */

import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptionDiagramAST, DescriptiveNode } from '../../../src/diagrams/description/ast.js';

function parse(source: string): DescriptionDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'description' };
  return parseDescription(block);
}

function nodeById(ast: DescriptionDiagramAST, id: string): DescriptiveNode | undefined {
  return ast.nodes.find((n) => n.id === id);
}

describe('description parser — [ … ] element body as display (S1L-b T2)', () => {
  it('multi-line body (incl. a creole HR line) becomes the node display', () => {
    const ast = parse('node n [\nfoo1\n====\nfoo2\n]');
    const n = nodeById(ast, 'n');
    expect(n?.display).toBe('foo1\n====\nfoo2');
  });

  it('one-line form `component c [ desc ]` sets id and display', () => {
    const ast = parse('component c [ desc ]');
    const c = nodeById(ast, 'c');
    expect(c?.id).toBe('c');
    expect(c?.display).toBe('desc');
  });

  it('body lines are finalized like single-line displays (`\\n` escape → newline)', () => {
    const ast = parse('node n [\nfirst\\nsecond\n]');
    const n = nodeById(ast, 'n');
    expect(n?.display).toBe('first\nsecond');
  });

  it('an empty body keeps the code as the display (no empty-string label)', () => {
    const ast = parse('component c [\n]');
    const c = nodeById(ast, 'c');
    expect(c?.display).toBe('c');
  });
});
