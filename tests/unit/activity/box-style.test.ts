/**
 * add4-T3e: the SDL/UML `BoxStyle`s of an action box -- `BoxStyle.fromString`
 * (`BoxStyle.java:126-133`), the shield `FtileBox#calculateDimensionFtile`
 * adds to the width but not to the hooks' `left` (`FtileBox.java:241-242`),
 * and each style's `drawMe` outline over `width - shield`
 * (`BoxStyle.java:153-500`).
 */
import { describe, expect, it } from 'vitest';

import { resolveTheme } from '../../../src/core/theme.js';
import type { StringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import { GtileAction, boxStyleName, boxStyleShield } from '../../../src/diagrams/activity/tiles/gtile-action.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../src/diagrams/activity/tiles/points.js';
import { renderBoxStyleAction } from '../../../src/diagrams/activity/activity-renderer-signal-shapes.js';
import type { ActivityNodeGeo } from '../../../src/diagrams/activity/activity-geometry.types.js';
import { measured } from './measured-theme.js';

const THEME = measured(resolveTheme('default'));
const BOUNDER: StringBounder = {
  getDimension: (text: string, size: number) => ({ width: text.length * 10, height: size }),
};

function node(stereotype: string): ActivityNodeGeo {
  return { id: 'a', kind: 'action', x: 0, y: 0, width: 60, height: 30, label: 'go', stereotype };
}

function points(svg: string, index = 0): string {
  return [...svg.matchAll(/<polygon points="([^"]+)"/g)][index]![1]!;
}

describe('boxStyleName / boxStyleShield', () => {
  it('matches case-insensitively and ignores hyphens', () => {
    expect(boxStyleName('Input')).toBe('input');
    expect(boxStyleName('send-signal')).toBe('sendsignal');
    expect(boxStyleName('acceptEvent')).toBe('acceptevent');
  });

  it('anything else is PLAIN (undefined)', () => {
    expect(boxStyleName(undefined)).toBeUndefined();
    expect(boxStyleName('foo')).toBeUndefined();
    expect(boxStyleName('constructor')).toBeUndefined();
  });

  it('carries the upstream shields (10 for the pointed styles, else 0)', () => {
    expect(boxStyleShield('input')).toBe(10);
    expect(boxStyleShield('timeEvent')).toBe(10);
    expect(boxStyleShield('procedure')).toBe(0);
    expect(boxStyleShield('save')).toBe(0);
    expect(boxStyleShield(undefined)).toBe(0);
  });
});

describe('GtileAction with a box style', () => {
  const plain = new GtileAction({ kind: 'action', label: 'go' }, BOUNDER, THEME);
  const input = new GtileAction({ kind: 'action', label: 'go', stereotype: 'input' }, BOUNDER, THEME);

  it('is the plain box plus the shield wide, same height', () => {
    expect(input.width).toBe(plain.width + 10);
    expect(input.height).toBe(plain.height);
    expect(input.stereotype).toBe('input');
  });

  it('keeps its in/out hooks over the unshielded box', () => {
    expect(input.getCoord(NORTH_HOOK)).toEqual({ x: plain.width / 2, y: 0 });
    expect(input.getCoord(SOUTH_HOOK)).toEqual({ x: plain.width / 2, y: input.height });
  });
});

describe('renderBoxStyleAction outlines (60 x 30 node)', () => {
  it.each([
    ['input', '0,0,60,0,50,15,60,30,0,30'],
    ['trigger', '0,0,60,0,50,15,60,30,0,30'],
    ['output', '0,0,50,0,60,15,50,30,0,30'],
    ['sendSignal', '0,0,50,0,60,15,50,30,0,30'],
    ['load', '0,0,50,0,60,30,10,30'],
    ['save', '10,0,60,0,50,30,0,30'],
    ['objectSignal', '-10,0,50,0,60,15,50,30,-10,30,0,15'],
    ['acceptEvent', '-10,0,50,0,50,30,-10,30,0,15'],
    ['timeEvent', '15,10,35,10,15,30,35,30'],
  ])('%s', (style, expected) => {
    expect(points(renderBoxStyleAction(node(style), THEME, boxStyleName(style)!))).toBe(expected);
  });

  it('procedure is a square rect plus two vlines at PADDING 5', () => {
    const svg = renderBoxStyleAction(node('procedure'), THEME, 'procedure');
    expect(svg).toMatch(
      /^<rect x="0" y="0" width="60" height="30" fill="#F1F1F1" stroke="#181818" stroke-width="0.5"\/>/,
    );
    expect(svg).toContain('<line x1="5" y1="0" x2="5" y2="30"');
    expect(svg).toContain('<line x1="55" y1="0" x2="55" y2="30"');
  });

  it('task and object are an unrounded rect', () => {
    for (const style of ['task', 'object']) {
      const svg = renderBoxStyleAction(node(style), THEME, style);
      expect(svg).toMatch(/^<rect x="0" y="0" width="60" height="30"/);
      expect(svg).not.toMatch(/^<rect[^>]*rx=/);
    }
  });

  it('continuous is one filled path of two open chevrons', () => {
    const svg = renderBoxStyleAction(node('continuous'), THEME, 'continuous');
    expect(svg).toMatch(/^<path d="M5,0 L0,15 L5,30 M55,0 L60,15 L55,30" fill="#F1F1F1"/);
  });

  it('draws the label through the Sheet at the LEFT padding translate', () => {
    const svg = renderBoxStyleAction(node('input'), THEME, 'input');
    expect(svg).toMatch(/<text x="10" y="[\d.]+"[^>]*>go<\/text>/);
  });

  it('a #color fills the outline', () => {
    const svg = renderBoxStyleAction({ ...node('save'), color: '#FFC0CB' }, THEME, 'save');
    expect(svg).toContain('fill="#FFC0CB"');
  });
});
