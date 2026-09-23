/**
 * cdd-B7FU-R1 — `driver-text-svg-decorations.ts`, the shared port of
 * `DriverTextSvg#draw`'s font-configuration decisions (java:93-173).
 *
 * Every expected value here is read off upstream's own branches, and the
 * geometry constants are cross-checked against the jar oracle
 * `test-results/dot-cache/class/ziripa-77-zizo842/in.svg`: at font-size 13
 * and baseline y=80.611 the jar draws the `<u:#FF0000>` rule at y=81.54
 * (13/14 = 0.9286 below) and the `<s:#00FFFF>` rule at y=77.361 (13/4 =
 * 3.25 above), both stroked 0.464 (13/28).
 */
import { describe, expect, test } from 'vitest';
import { FontStyle, type FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import {
  extraLineStrokeWidth,
  fontStyleOf,
  fontWeightOf,
  textRenderDecorations,
} from '../../../../../src/core/klimt/drawing/svg/driver-text-svg-decorations.js';

function fc(over: Partial<FontConfiguration> = {}): FontConfiguration {
  return { family: 'sans-serif', size: 13, color: '#000', styles: new Set<FontStyle>(), ...over };
}

describe('fontWeightOf — DriverTextSvg.java:97-103 two-tier fallback', () => {
  test('no BOLD, default face → no font-weight at all', () => {
    expect(fontWeightOf(fc())).toBeNull();
  });

  test('BOLD with a default (400) face forces 700', () => {
    expect(fontWeightOf(fc({ styles: new Set([FontStyle.BOLD]) }))).toBe('700');
  });

  test('BOLD with a heavier face honours the face weight', () => {
    const font = fc({ styles: new Set([FontStyle.BOLD]), fontFace: { cssWeight: 900, italic: false } });
    expect(fontWeightOf(font)).toBe('900');
  });

  test('BOLD with a LIGHTER face still forces 700 (the `>= 700` gate)', () => {
    const font = fc({ styles: new Set([FontStyle.BOLD]), fontFace: { cssWeight: 300, italic: false } });
    expect(fontWeightOf(font)).toBe('700');
  });

  test('no BOLD but a non-400 face emits the face weight — the tier `<plain>` cannot clear', () => {
    expect(fontWeightOf(fc({ fontFace: { cssWeight: 700, italic: false } }))).toBe('700');
    expect(fontWeightOf(fc({ fontFace: { cssWeight: 300, italic: false } }))).toBe('300');
  });
});

describe('fontStyleOf — DriverTextSvg.java:105-107', () => {
  test('neither the ITALIC style nor an italic face → omitted', () => {
    expect(fontStyleOf(fc())).toBeNull();
  });

  test('the ITALIC style alone is enough', () => {
    expect(fontStyleOf(fc({ styles: new Set([FontStyle.ITALIC]) }))).toBe('italic');
  });

  test('an italic FACE alone is enough (the `|| face.isItalic()` arm)', () => {
    expect(fontStyleOf(fc({ fontFace: { cssWeight: 400, italic: true } }))).toBe('italic');
  });
});

describe('textRenderDecorations — decoration split, java:129-173', () => {
  test('colourless UNDERLINE/STRIKE stay CSS, in upstream order', () => {
    const font = fc({ styles: new Set([FontStyle.UNDERLINE, FontStyle.STRIKE]) });
    const deco = textRenderDecorations(font, 13);
    expect(deco.textDecoration).toBe('underline line-through');
    expect(deco.extraLines).toEqual([]);
  });

  test('`<u:#FF0000>` moves out of CSS into an extra line at +size/14', () => {
    const font = fc({ styles: new Set([FontStyle.UNDERLINE]), extendedColor: '#FF0000' });
    const deco = textRenderDecorations(font, 13);
    expect(deco.textDecoration).toBeNull();
    expect(deco.extraLines).toEqual([{ color: '#FF0000', deltaY: 13 / 14 }]);
    expect(80.611 + (deco.extraLines[0]?.deltaY ?? 0)).toBeCloseTo(81.54, 3);
  });

  test('`<s:#00FFFF>` produces an extra line ABOVE the baseline at -size/4', () => {
    const font = fc({ styles: new Set([FontStyle.STRIKE]), extendedColor: '#00FFFF' });
    const deco = textRenderDecorations(font, 13);
    expect(deco.textDecoration).toBeNull();
    expect(deco.extraLines).toEqual([{ color: '#00FFFF', deltaY: -13 / 4 }]);
    expect(80.611 + (deco.extraLines[0]?.deltaY ?? 0)).toBeCloseTo(77.361, 3);
  });

  test('WAVE has no extended-colour arm — `<w:green>` is still plain CSS', () => {
    const font = fc({ styles: new Set([FontStyle.WAVE]), extendedColor: 'green' });
    const deco = textRenderDecorations(font, 13);
    expect(deco.textDecoration).toBe('wavy underline');
    expect(deco.extraLines).toEqual([]);
  });

  test('the extra-line stroke width is size/28 (jar: 0.464 at size 13)', () => {
    expect(extraLineStrokeWidth(13)).toBeCloseTo(0.464, 3);
  });

  test('a solid `<back:red>` becomes the feFlood colour, never a gradient', () => {
    const font = fc({ styles: new Set([FontStyle.BACKCOLOR]), extendedColor: 'red' });
    const deco = textRenderDecorations(font, 14);
    expect(deco.backColor).toBe('red');
    expect(deco.backGradient).toBeNull();
  });

  test('a gradient `<back:red|blue>` takes the HColorGradient arm instead', () => {
    const font = fc({ styles: new Set([FontStyle.BACKCOLOR]), extendedColor: 'red|blue' });
    const deco = textRenderDecorations(font, 14);
    expect(deco.backColor).toBeNull();
    expect(deco.backGradient).toBe('red|blue');
  });

  test('BACKCOLOR with no captured colour draws no background at all', () => {
    const deco = textRenderDecorations(fc({ styles: new Set([FontStyle.BACKCOLOR]) }), 14);
    expect(deco.backColor).toBeNull();
    expect(deco.backGradient).toBeNull();
  });

  test('an extended colour on a run that carries none of the four styles is inert', () => {
    const deco = textRenderDecorations(fc({ extendedColor: 'red' }), 14);
    expect(deco).toMatchObject({ textDecoration: null, backColor: null, backGradient: null });
    expect(deco.extraLines).toEqual([]);
  });
});
