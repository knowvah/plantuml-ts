/**
 * sdd3-T8b: the sequence engine's `UGraphic` seam (`renderer-ug.ts`).
 */
import { describe, it, expect } from 'vitest';
import {
  closeGroup,
  driverBounderOf,
  normaliseMintedIds,
  openSequenceGraphic,
  startGroup,
} from '../../../src/diagrams/sequence/renderer-ug.js';
import { pageThemeOf } from '../../../src/diagrams/sequence/renderer-ug.js';
import { drawMarkup } from './draw-markup.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { UGraphicHandwritten } from '../../../src/core/klimt/drawing/hand/UGraphicHandwritten.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { Back } from '../../../src/core/klimt/Back.js';
import { Fore } from '../../../src/core/klimt/Fore.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { ULine } from '../../../src/core/klimt/shape/ULine.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import { UGroup, UGroupType } from '../../../src/core/klimt/shape/UGroup.js';
import { tagsOf } from '../../helpers/svg-tags.js';

const theme = pageThemeOf(defaultTheme, new DeterministicMeasurer());

const gradient = (color1: string, color2: string): Back => new Back({ color1, color2, policy: '|' });

function shadowedRect(ug: UGraphic): void {
  const rect = URectangle.build(10, 20);
  rect.setDeltaShadow(1);
  ug.apply(new Fore('#181818')).apply(new Back('#FFFFFF')).apply(UTranslate.dx(3)).draw(rect);
}

function gradientRect(ug: UGraphic, back: Back): void {
  ug.apply(new Fore('#181818')).apply(back).apply(UTranslate.dx(1)).draw(URectangle.build(10, 20));
}

describe('openSequenceGraphic', () => {
  it('builds a plain UGraphicSvg: no handwritten decorator for a non-handwritten document', () => {
    const graphic = openSequenceGraphic(theme, { width: 0, height: 0 });
    expect(graphic.ug).toBeInstanceOf(UGraphicSvg);
    expect(graphic.ug).not.toBeInstanceOf(UGraphicHandwritten);
    expect(theme.handwritten).toBeUndefined();
  });

  it('finish() returns the flat content and the extent floored at minDim (scale 1)', () => {
    const graphic = openSequenceGraphic(theme, { width: 120, height: 80 });
    graphic.ug.apply(new Fore('#181818')).apply(UTranslate.dx(5)).draw(ULine.vline(10));
    const { body, extraDefs, maxX, maxY } = graphic.finish();
    expect(tagsOf(body, 'line')).toEqual([
      { x1: '5', y1: '0', x2: '5', y2: '10', stroke: '#181818', 'stroke-width': '1' },
    ]);
    expect(extraDefs).toBe('');
    expect([maxX, maxY]).toEqual([121, 81]);
  });
});

describe('drawMarkup (the page graphic, serialised)', () => {
  it('is the empty string when nothing is drawn', () => {
    expect(drawMarkup(() => undefined, theme)).toBe('');
  });

  it('returns the region markup, groups included', () => {
    const svg = drawMarkup((ug) => {
      startGroup(ug, UGroup.singletonMap(UGroupType.TITLE, 'T'));
      ug.apply(new Fore('#181818')).draw(ULine.vline(4));
      closeGroup(ug);
    }, theme);
    expect(svg.startsWith('<g><title>T</title><line ')).toBe(true);
    expect(svg.endsWith('</g>')).toBe(true);
  });
});

describe('minted ids are page-uniform (module header)', () => {
  it('re-points a shadowed shape at the page filter and drops the minted <filter>', () => {
    const svg = drawMarkup(shadowedRect, theme);
    expect(svg).toContain('filter="url(#sequenceShadow)"');
    expect(svg).not.toContain('<filter');
  });

  it('keys a gradient by its content: two regions drawing the same gradient agree on the id', () => {
    const red = drawMarkup((ug) => gradientRect(ug, gradient('#FF0000', '#0000FF')), theme);
    const again = drawMarkup((ug) => gradientRect(ug, gradient('#FF0000', '#0000FF')), theme);
    expect(again).toBe(red);
    const id = /<linearGradient id="(g[0-9a-z]+)"/.exec(red)?.[1];
    expect(id).toBeDefined();
    expect(tagsOf(red, 'rect')[0]?.['fill']).toBe(`url(#${String(id)})`);
  });

  it('gives different gradients different ids, though each region numbered its own `<seed>0`', () => {
    const idOf = (a: string, b: string): string | undefined =>
      /<linearGradient id="(g[0-9a-z]+)"/.exec(drawMarkup((ug) => gradientRect(ug, gradient(a, b)), theme))?.[1];
    expect(idOf('#FF0000', '#0000FF')).not.toBe(idOf('#00FF00', '#0000FF'));
  });

  it('normaliseMintedIds leaves a document with no minted ids untouched', () => {
    expect(normaliseMintedIds('<rect/>', '')).toEqual({ body: '<rect/>', extraDefs: '' });
  });

  it('keeps a gradient def that has no closing tag as it is', () => {
    expect(normaliseMintedIds('<rect/>', '<linearGradient id="g1"')).toEqual({
      body: '<rect/>',
      extraDefs: '<linearGradient id="g1"',
    });
  });
});

describe('startGroup / closeGroup', () => {
  it('are no-ops on a graphic that cannot open a group', () => {
    const bare = { apply: () => bare, draw: () => undefined } as unknown as UGraphic;
    expect(() => {
      startGroup(bare, UGroup.singletonMap(UGroupType.TITLE, 'x'));
      closeGroup(bare);
    }).not.toThrow();
  });
});

describe('driverBounderOf', () => {
  it("answers the text width from the render's own measurer", () => {
    const measurer = new DeterministicMeasurer();
    const font = { family: 'sans-serif', size: 14, weight: 'normal', style: 'normal' } as const;
    expect(driverBounderOf(measurer).calculateDimension(font, 'abc')).toEqual({
      width: measurer.measure('abc', font).width,
    });
  });
});
