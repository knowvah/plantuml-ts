import { describe, expect, it } from 'vitest';
import { GSide } from '../../../../src/diagrams/gantt/core/GSide.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/GSide.java:33-57
describe('GSide', () => {
  it('lists constants in Java declaration order', () => {
    expect(GSide.values().map((s) => [s.name(), s.ordinal()])).toEqual([
      ['LEFT', 0],
      ['RIGHT', 1],
      ['TOP_LEFT', 2],
      ['TOP_RIGHT', 3],
      ['BOTTOM_LEFT', 4],
      ['BOTTOM_RIGHT', 5],
    ]);
  });

  it.each([
    [GSide.LEFT, false, false],
    [GSide.RIGHT, false, false],
    [GSide.TOP_LEFT, false, true],
    [GSide.TOP_RIGHT, false, true],
    [GSide.BOTTOM_LEFT, true, false],
    [GSide.BOTTOM_RIGHT, true, false],
  ])('%s isBottom=%s isTop=%s (java:36-42)', (side, bottom, top) => {
    expect(side.isBottom()).toBe(bottom);
    expect(side.isTop()).toBe(top);
  });

  it('reverseBottomTop maps bottoms to tops (java:44-50)', () => {
    expect(GSide.BOTTOM_LEFT.reverseBottomTop()).toBe(GSide.TOP_LEFT);
    expect(GSide.BOTTOM_RIGHT.reverseBottomTop()).toBe(GSide.TOP_RIGHT);
  });

  it.each([GSide.LEFT, GSide.RIGHT, GSide.TOP_LEFT, GSide.TOP_RIGHT])('reverseBottomTop throws on %s', (side) => {
    expect(() => side.reverseBottomTop()).toThrow('IllegalStateException');
  });

  it('prints its name', () => {
    expect(String(GSide.TOP_LEFT)).toBe('TOP_LEFT');
  });
});
