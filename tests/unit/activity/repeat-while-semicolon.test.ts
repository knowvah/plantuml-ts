/**
 * add1-b3: `repeat while (...)` closers may end in `;`
 * (`CommandRepeatWhile3.java:101`, `new RegexLeaf(";?")`). Before the fix a
 * trailing `;` emptied the condition and both side labels (`geremo-94-tecu179`).
 */
import { describe, it, expect } from 'vitest';
import { parseActivity } from '../../../src/diagrams/activity/parser.js';
import type { ActivityRepeat } from '../../../src/diagrams/activity/ast.js';

function repeatOf(closer: string): ActivityRepeat {
  const ast = parseActivity({ lines: ['start', 'repeat', ':A;', closer, 'stop'] } as never);
  if (!('nodes' in ast)) throw new Error('refused');
  const node = ast.nodes.find((n) => n.kind === 'repeat');
  if (node?.kind !== 'repeat') throw new Error('no repeat');
  return node;
}

describe('repeat while closer with a trailing semicolon', () => {
  it('keeps the condition and both side labels', () => {
    const r = repeatOf('repeat while (Something wrong?) is (yes) not (no);');
    expect([r.condition, r.yesLabel, r.outLabel]).toEqual(['Something wrong?', 'yes', 'no']);
  });

  it('keeps a bare condition', () => {
    expect(repeatOf('repeat while (W?);').condition).toBe('W?');
  });

  it('parses identically without the semicolon', () => {
    const r = repeatOf('repeat while (W?) is (yes) not (no)');
    expect([r.condition, r.yesLabel, r.outLabel]).toEqual(['W?', 'yes', 'no']);
  });
});
