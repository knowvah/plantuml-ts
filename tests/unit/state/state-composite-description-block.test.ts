/**
 * dsw-T1d: `ClusterHeader.java:78` attribute width via the real creole sheet
 * (`Display#create0`): Bullet header (`Bullet.java:72-76`, 12 for order 0).
 */
import { describe, it, expect } from 'vitest';
import { stateDescriptionBlockWidth } from '../../../src/diagrams/state/state-composite-description-block.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';

const FONT = { family: 'sans-serif', size: 14 } as const;
const BULLET_ORDER0_WIDTH = 12;
const measurer = new DeterministicMeasurer();
const widthOf = (lines: string[]): number => stateDescriptionBlockWidth(lines, FONT, measurer, defaultTheme);
const rawWidth = (s: string): number => measurer.measure(s, FONT).width;

describe('stateDescriptionBlockWidth', () => {
  it('is 0 for no lines (Entity.java:616-617 TextBlockEmpty)', () => {
    expect(widthOf([])).toBe(0);
  });

  it('plain text equals its measured width', () => {
    expect(widthOf(['entry / go'])).toBeCloseTo(rawWidth('entry / go'), 3);
  });

  it('a "* item" line adds the 12-wide Bullet header to the item text', () => {
    expect(widthOf(['* a list'])).toBeCloseTo(BULLET_ORDER0_WIDTH + rawWidth('a list'), 3);
  });

  it('is the max across lines', () => {
    expect(widthOf(['x', '* a list'])).toBeCloseTo(BULLET_ORDER0_WIDTH + rawWidth('a list'), 3);
  });
});
