/**
 * T1c: a group still open at EOF keeps its events.
 * @see sequencediagram/SequenceDiagram.java:411-446 (flat event list)
 * @see sequencediagram/teoz/GroupingTile.java:158-166 (consumes to END or end of iterator)
 */
import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { FrameEvent, FrameGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(sequenceSource(lines));
  if ('refused' in result) throw new Error(result.message);
  return result;
}

describe('unclosed group at EOF', () => {
  it('keeps the frame and its message', () => {
    const ast = parse(['alt x', 'A -> B: hi']);
    const frame = ast.events.find((e): e is FrameEvent => e.kind === 'frame');
    expect(frame?.label).toBe('x');
    expect(frame?.branches[0]).toHaveLength(1);
    const geo = layoutSequence(ast, defaultTheme, new FixedMeasurer(8, 16));
    expect(geo.events.filter((e): e is FrameGeo => e.kind === 'frame')).toHaveLength(1);
  });

  it('closes nested frames innermost first', () => {
    const ast = parse(['alt x', 'loop y', 'A -> B: hi']);
    const outer = ast.events.find((e): e is FrameEvent => e.kind === 'frame');
    expect(outer?.frameType).toBe('alt');
    const inner = outer?.branches[0]?.[0] as FrameEvent | undefined;
    expect(inner?.frameType).toBe('loop');
    expect(inner?.branches[0]).toHaveLength(1);
  });
});
