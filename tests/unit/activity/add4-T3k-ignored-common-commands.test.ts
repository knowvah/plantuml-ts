import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import { parseAst } from '../../helpers/parse-ast.js';

function parse(lines: readonly string[]): ActivityDiagramAST {
  return parseAst(activityPlugin, { lines, type: 'activity' });
}

const KINDS_START_STOP = ['start', 'stop'];

describe('activity accepted-and-ignored common commands (add4-T3k)', () => {
  it.each([
    'page 2x2',
    'page 1 x 3',
    'hide footbox',
    'show footbox',
    'footbox',
    'hide stereotype',
    'show empty members',
    'hide <<Foo>> stereotype',
  ])('%s is consumed without a node (CommandPage/FootboxIgnored/HideShowByGender)', (line) => {
    expect(parse(['start', line, 'stop']).nodes.map((n) => n.kind)).toEqual(KINDS_START_STOP);
  });

  it('page with a zero count is not matched (CommandPage.java:88-89 error)', () => {
    expect(() => parse(['start', 'page 0x2', 'stop'])).toThrow();
  });

  it('link #red lowers to a style-only arrow-label (CommandLink3.java:80-82)', () => {
    const nodes = parse(['start', 'link #red', 'stop']).nodes;
    expect(nodes.map((n) => n.kind)).toEqual(['start', 'arrow-label', 'stop']);
    expect(nodes[1]).toMatchObject({ label: '', style: '#red' });
  });

  it('link #red; accepts the optional semicolon', () => {
    expect(parse(['link #00ff00;']).nodes[0]).toMatchObject({ kind: 'arrow-label', style: '#00ff00' });
  });
});
