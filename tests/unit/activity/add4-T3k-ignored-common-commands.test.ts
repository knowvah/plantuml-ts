import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import { RE_HIDE_SHOW_BY_GENDER } from '../../../src/diagrams/activity/dispatch-common-commands.js';
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
    'hide class "a b" <<S1>> x <<S2 y>> empty methods',
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

  // CodeQL js/redos, alert 25: upstream's GENDER group backtracked
  // exponentially (22 repeated tokens took ~100 ms, doubling per token).
  // 20000 tokens must stay well under a second.
  it.each([
    ['repeated stereotype boundaries', 'show\t<<' + '>>\t<<'.repeat(20_000)],
    ['repeated keywords', 'show ' + 'class '.repeat(20_000) + '!'],
  ])('hide/show by gender rejects %s in linear time', (_label, line) => {
    const start = performance.now();
    expect(RE_HIDE_SHOW_BY_GENDER.test(line)).toBe(false);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('a stereotype spanning several tokens still matches, as upstream (<<.*>> is greedy)', () => {
    expect(RE_HIDE_SHOW_BY_GENDER.test('hide <<a>> b <<c>> members')).toBe(true);
    expect(RE_HIDE_SHOW_BY_GENDER.test('hide <<a>> b <<c>>members')).toBe(false);
  });
});
