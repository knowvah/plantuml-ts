/**
 * `ElementEmpty` (ElementEmpty.java:42-51): a 1 x 1 cell that draws nothing.
 */
import { describe, expect, it } from 'vitest';
import { ElementEmpty } from '../../../../src/diagrams/salt/element/ElementEmpty.js';
import { drawElement, stringBounder } from '../salt-test-support.js';

describe('ElementEmpty', () => {
  it('prefers 1 x 1 wherever it sits (java:44-46)', () => {
    const dim = new ElementEmpty().getPreferredDimension(stringBounder, 12, 34);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([1, 1]);
  });

  it('draws nothing at either z-index (java:48-49)', () => {
    expect(drawElement(new ElementEmpty(), { dx: 6, dy: 6 }, 0)).toBe(
      drawElement(new ElementEmpty(), { dx: 6, dy: 6 }, 1),
    );
    expect(drawElement(new ElementEmpty(), { dx: 6, dy: 6 })).not.toMatch(/<(text|rect|line|path|polygon)\b/);
  });
});
