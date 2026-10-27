import { expect, it } from 'vitest';
import { TwoNames } from '../../../../src/diagrams/gantt/lang/TwoNames.js';

it('returns both names (TwoNames.java:43-54)', () => {
  const t = new TwoNames('alpha', 'beta');
  expect(t.getName1()).toBe('alpha');
  expect(t.getName2()).toBe('beta');
});
