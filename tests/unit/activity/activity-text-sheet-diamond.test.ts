/**
 * add4-T3g: `activity-text-sheet-diamond.ts` -- `Hexagon.asStencil`
 * (`Hexagon.java:84-104`) and the condition label of
 * `ConditionalBuilder#getShape1` (`ConditionalBuilder.java:240-247`).
 */
import { describe, expect, it } from 'vitest';
import {
  diamondTestBlock,
  hexagonAsStencil,
  renderDiamondTestLabel,
} from '../../../src/diagrams/activity/activity-text-sheet-diamond.js';
import { klimtStringBounder } from '../../../src/diagrams/activity/activity-creole-sheet.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';

const BOUNDER = klimtStringBounder(new WidthTableMeasurer(), { family: 'sans-serif', size: 11 });

function fixedBlock(width: number, height: number): TextBlock {
  return { calculateDimension: () => new XDimension2D(width, height), drawU: () => undefined };
}

describe('hexagonAsStencil', () => {
  const stencil = hexagonAsStencil(fixedBlock(40, 20));

  it('is flush with the block at the top and bottom rows', () => {
    expect([stencil.getStartingX(BOUNDER, 0), stencil.getEndingX(BOUNDER, 0)]).toEqual([-0, 40]);
    expect([stencil.getStartingX(BOUNDER, 20), stencil.getEndingX(BOUNDER, 20)]).toEqual([-0, 40]);
  });

  it('widens by hexagonHalfSize (12) at the middle row', () => {
    expect([stencil.getStartingX(BOUNDER, 10), stencil.getEndingX(BOUNDER, 10)]).toEqual([-12, 52]);
  });

  it('is linear in between (p = y / h * 2)', () => {
    expect(stencil.getStartingX(BOUNDER, 5)).toBe(-6);
    expect(stencil.getEndingX(BOUNDER, 15)).toBe(46);
  });
});

describe('diamondTestBlock / renderDiamondTestLabel', () => {
  it('sizes one 11px line at its own width and the 11px font height', () => {
    const dim = diamondTestBlock('test?', defaultTheme).calculateDimension(BOUNDER);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([23.7875, 11]);
  });

  it('centres the block in the hexagon box (FtileDiamondInside.java:94-96)', () => {
    const svg = renderDiamondTestLabel('test?', defaultTheme, { x: 100, y: 50, width: 48, height: 24 });
    // lx = (48 - 23.7875) / 2; ly = (24 - 11) / 2, baseline = ly + 11 - 11 / 4.5.
    expect(svg).toBe('<text x="112.106" y="65.056" fill="#000" font-size="11" textLength="23.788">test?</text>');
  });

  it('draws a `**bold**` run as its own <text>', () => {
    const svg = renderDiamondTestLabel('**a** b', defaultTheme, { x: 0, y: 0, width: 40, height: 24 });
    expect(svg).toContain('font-weight="700">a</text>');
  });
});
