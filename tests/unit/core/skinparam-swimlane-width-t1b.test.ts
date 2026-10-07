/**
 * add4-T1b: `skinparam swimlaneWidth` -> `Theme.swimlaneWidth`.
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1121-1130 (swimlaneWidth)
 * @see net/sourceforge/plantuml/skin/SkinParam.java:130-136 (DIGITS / isDigits)
 * @see net/sourceforge/plantuml/style/ISkinParam.java:71 (SWIMLANE_WIDTH_SAME)
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { SWIMLANE_WIDTH_SAME } from '../../../src/diagrams/activity/layout/swimlane-context.js';

function widthOf(value: string): number | undefined {
  const { theme, unknown } = resolveSkinparam(new Map([['swimlanewidth', value]]), defaultTheme);
  expect(unknown).toEqual([]);
  return theme.swimlaneWidth;
}

describe('resolveSkinparam — swimlanewidth', () => {
  it('"same" (any case) is the SWIMLANE_WIDTH_SAME sentinel', () => {
    expect(widthOf('same')).toBe(SWIMLANE_WIDTH_SAME);
    expect(widthOf('SaMe')).toBe(-1);
  });

  it('an all-digits value parses as an integer', () => {
    expect(widthOf('400')).toBe(400);
    expect(widthOf(' 100 ')).toBe(100);
  });

  it('anything else (decimal, negative, word) falls through to 0', () => {
    expect(widthOf('12.5')).toBe(0);
    expect(widthOf('-3')).toBe(0);
    expect(widthOf('wide')).toBe(0);
  });

  it('absent key leaves swimlaneWidth unset on the base theme', () => {
    expect(defaultTheme.swimlaneWidth).toBeUndefined();
  });
});
