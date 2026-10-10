/**
 * isw-T2-cls F2a: `DriverTextSvg.java:113-126` -- leading spaces shift the
 * drawn x, `textLength` is the TRIMMED width, the layout width is untouched.
 */
import { describe, expect, it } from 'vitest';
import { textRenderFields } from '../../../src/diagrams/class/class-member-creole-render-text.js';

// 13pt space = 44 tenths of a 16pt em = 3.575 (oracle seam #4).
const SPACE = 3.575;
const measure = (s: string): number => s.length * SPACE;

describe('textRenderFields', () => {
  it('shifts one space width per leading space and trims the measured text', () => {
    expect(textRenderFields('  ab ', measure)).toEqual({
      renderText: 'ab',
      renderWidth: 2 * SPACE,
      renderDx: 2 * SPACE,
    });
  });
  it('keeps trailing-only trim without a shift', () => {
    expect(textRenderFields('ab ', measure)).toEqual({ renderText: 'ab', renderWidth: 2 * SPACE });
  });
  it('turns a whitespace-only run into NBSP with no shift', () => {
    expect(textRenderFields(' ', measure)).toEqual({ renderText: ' ', renderWidth: SPACE });
  });
  it('returns undefined for untouched, empty and tab-bearing text', () => {
    expect(textRenderFields('ab', measure)).toBeUndefined();
    expect(textRenderFields('', measure)).toBeUndefined();
    expect(textRenderFields(' a\tb', measure)).toBeUndefined();
  });
});
