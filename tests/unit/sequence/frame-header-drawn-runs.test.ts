import { describe, expect, it } from 'vitest';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import type { TextRun } from '../../../src/diagrams/sequence/text-block-geo.js';
import { drawnRuns } from '../../../src/diagrams/sequence/renderer-frame-header.js';

/** Only `color` is read; the rest of the block font is irrelevant here. */
const FONT = { color: '#000000' } as unknown as FontConfiguration;

const base: TextRun = { text: 'g', x: 0, y: 10, textWidth: 8, textAscent: 10, textLineHeight: 13 };

describe('drawnRuns — DriverTextSvg skips transparent text only (DriverTextSvg.java:93-94)', () => {
  it('drops a text run with no colour: the creole seam left it transparent', () => {
    expect(drawnRuns([base], FONT)).toEqual([]);
  });

  it('keeps a text run that carries its colour', () => {
    expect(drawnRuns([{ ...base, color: '#FF0000' }], FONT)).toEqual([{ ...base, color: '#FF0000' }]);
  });

  it('keeps an image primitive (a `<$sprite>` atom), painted in the block font colour', () => {
    const sprite: TextRun = { ...base, text: '', image: { href: 'data:x', width: 10, height: 12, y: 0 } };
    expect(drawnRuns([sprite], FONT)).toEqual([{ ...sprite, color: '#000000' }]);
  });
});
