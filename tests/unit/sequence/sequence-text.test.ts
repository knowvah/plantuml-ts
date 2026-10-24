/**
 * `sequence-text.ts` -- the ambient a component's creole runs fall back to,
 * and their drawing through the page's graphic (the string emitter
 * `sequenceText` is gone: sdd3 T8e).
 */
import { describe, it, expect } from 'vitest';
import { creoleAmbientOf, drawCreoleRuns } from '../../../src/diagrams/sequence/sequence-text.js';
import type { TextRun } from '../../../src/diagrams/sequence/text-block-geo.js';
import { tagsOf } from '../../helpers/svg-tags.js';
import { drawMarkup, pageTheme } from './draw-markup.js';

const THEME = pageTheme();

const run = (text: string, over: Partial<TextRun> = {}): TextRun => ({
  text,
  x: 20,
  y: 30,
  textWidth: 40,
  textAscent: 10,
  textLineHeight: 14,
  ...over,
});

describe('creoleAmbientOf', () => {
  it("is the render's family and text ink at the component's size, bold only when the style is", () => {
    expect(creoleAmbientOf(THEME, 13)).toEqual({
      fontFamily: THEME.fontFamily,
      fontSize: 13,
      color: THEME.colors.text,
      bold: false,
    });
    expect(creoleAmbientOf(THEME, 11, true).bold).toBe(true);
  });
});

describe('drawCreoleRuns', () => {
  it('draws one <text> per run at the layout x and baseline, in the ambient where creole set none', () => {
    const svg = drawMarkup((ug, t) => drawCreoleRuns(ug, [run('one'), run('two', { x: 50, color: '#FF0000' })], t, 13));
    const [first, second] = tagsOf(svg, 'text');
    expect(first).toMatchObject({ x: '20', y: '30', 'font-size': '13', fill: '#000' });
    expect(second).toMatchObject({ x: '50', y: '30', fill: '#F00' });
  });

  it("makes the component style's bold the fallback, which a run's own flag beats", () => {
    const svg = drawMarkup((ug, t) => drawCreoleRuns(ug, [run('a'), run('b', { bold: false })], t, 13, true));
    const [a, b] = tagsOf(svg, 'text');
    expect(a).toMatchObject({ 'font-weight': '700' });
    expect(b).not.toHaveProperty('font-weight');
  });

  it('draws nothing for no runs', () => {
    expect(drawMarkup((ug, t) => drawCreoleRuns(ug, [], t, 13))).toBe('');
  });
});
