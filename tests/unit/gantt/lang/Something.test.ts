import { expect, it } from 'vitest';
import { Failable } from '../../../../src/core/gantt/Failable.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import type { Something } from '../../../../src/diagrams/gantt/lang/Something.js';

it('is implementable with a generic diagram type (Something.java:46-48)', () => {
  const leaf = new UBrexLeaf('x');
  const s: Something<{ name: string }> = {
    getMe: (diagram, arg) => Failable.ok(diagram.name + (arg.findFirstValueByKey('k') ?? '')),
    toUnicodeBracketedExpressionComplement: () => leaf,
  };
  const arg = { findFirstValueByKey: () => 'v', findValuesByKey: () => ['v'] };
  expect(s.getMe({ name: 'd' }, arg).get()).toBe('dv');
  expect(s.toUnicodeBracketedExpressionComplement()).toBe(leaf);
});
