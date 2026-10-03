/**
 * Mission add2-T2g — `(X)`/`#color:(X)` circled-spot connector and
 * `label NAME`/`goto NAME`: each now produces a real `ActivityNode`
 * (`list-backward-dispatch.ts#tryCircleSpot`/`tryLabel`/`tryGoto`),
 * superseding T2e's "consumed, no node" shape.
 */
import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ActivityDiagramAST, ActivityGoto, ActivityLabel, ActivitySpot } from '../../../src/diagrams/activity/ast.js';
import { parseAst } from '../../helpers/parse-ast.js';

function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

describe('CommandCircleSpot3 — (X) / #color:(X)', () => {
  it('(A) parses as a spot node with no color', () => {
    const ast = parse(['(A)']);
    expect(ast.nodes).toHaveLength(1);
    const node = ast.nodes[0] as ActivitySpot;
    expect(node.kind).toBe('spot');
    expect(node.name).toBe('A');
    expect(node.color).toBeUndefined();
  });

  it('#blue:(B) parses the leading colour, with the # retained', () => {
    const ast = parse(['#blue:(B)']);
    const node = ast.nodes[0] as ActivitySpot;
    expect(node.kind).toBe('spot');
    expect(node.name).toBe('B');
    expect(node.color).toBe('#blue');
  });

  it('a trailing `;` is accepted and dropped', () => {
    const ast = parse(['(A);']);
    const node = ast.nodes[0] as ActivitySpot;
    expect(node.name).toBe('A');
  });
});

describe('CommandLabel / CommandGoto — label NAME / goto NAME', () => {
  it('label dummylab parses as a label node', () => {
    const ast = parse(['label dummylab']);
    expect(ast.nodes).toHaveLength(1);
    const node = ast.nodes[0] as ActivityLabel;
    expect(node.kind).toBe('label');
    expect(node.name).toBe('dummylab');
  });

  it('goto labB parses as a goto node', () => {
    const ast = parse(['goto labB']);
    expect(ast.nodes).toHaveLength(1);
    const node = ast.nodes[0] as ActivityGoto;
    expect(node.kind).toBe('goto');
    expect(node.name).toBe('labB');
  });

  it('a trailing `;` is accepted and dropped on both', () => {
    const ast = parse(['label X;']);
    expect((ast.nodes[0] as ActivityLabel).name).toBe('X');
  });
});
