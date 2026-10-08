/**
 * add4-T3gates (removeEmptyColumns): the BlocLines steps of
 * `CommandActivityLong3#executeNow` (`CommandActivityLong3.java:120-142`)
 * and `CommandNoteLong3#executeNow` (`CommandNoteLong3.java:118-122`).
 */
import { describe, expect, it } from 'vitest';

import { removeEmptyColumns } from '../../../src/diagrams/activity/dispatch-multiline-body.js';
import { parseActivity } from '../../../src/diagrams/activity/parser.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';

function nodesOf(lines: string[]): ActivityDiagramAST['nodes'] {
  const ast = parseActivity({ lines, type: 'activity' });
  if ('refused' in ast) throw new Error('refused');
  return ast.nodes;
}

function labelOf(lines: string[]): string {
  const node = nodesOf(lines)[0];
  if (node?.kind !== 'action') throw new Error('no action');
  return node.label;
}

describe('removeEmptyColumns (BlocLines.java:234-264)', () => {
  it('strips the columns every non-empty line shares, tab or space alike', () => {
    expect(removeEmptyColumns(['    :a', '\tb', '', '  c;'])).toEqual(['   :a', 'b', '', ' c;']);
  });

  it('leaves the lines alone when one starts with a non-blank', () => {
    expect(removeEmptyColumns([':a', '  b'])).toEqual([':a', '  b']);
  });

  it('leaves an all-empty block alone', () => {
    expect(removeEmptyColumns(['', ''])).toEqual(['', '']);
  });
});

describe('multi-line action label (CommandActivityLong3.java:120-142)', () => {
  it('drops the shared indentation, opener included, so a table row stays a table row', () => {
    expect(labelOf(['  :a table', '  |= title |', '  | foo |;'])).toBe('a table\n|= title |\n| foo |');
  });

  it('removes only the column the opener shares (zejuso-92-kexo870 tab)', () => {
    expect(labelOf(['    :first', '\tsecond', '\tthird;'])).toBe('first\nsecond\nthird');
  });

  it('keeps relative indentation and blank middle lines', () => {
    expect(labelOf([':a', '  b', '', 'c;'])).toBe('a\n  b\n\nc');
  });

  it('keeps an empty closing TEXT, except after `}}` (Display.java:190-193)', () => {
    expect(labelOf([':a', 'b', ';'])).toBe('a\nb\n');
    expect(labelOf([':a', '{{', 'x', '}}', ';'])).toBe('a\n{{\nx\n}}');
  });

  it('reads the closer stereotype', () => {
    const node = nodesOf([':a', 'b; <<input>>'])[0];
    expect(node).toMatchObject({ kind: 'action', label: 'a\nb', stereotype: 'input' });
  });
});

describe('multi-line note body (CommandNoteLong3.java:118-122)', () => {
  it('keeps relative indentation after removing the shared columns', () => {
    const note = nodesOf([':a;', 'note right', '  top', '      deeper', '  bottom', 'end note'])[1];
    expect(note).toMatchObject({ kind: 'note', text: 'top\n    deeper\nbottom' });
  });
});
