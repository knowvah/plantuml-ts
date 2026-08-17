/**
 * Unit tests for class-magic-arrow.ts — G2 item 44 (magic-arrow edge-label
 * glyph): a relationship label ending in `" >"`/`" <"` (or the bare
 * `>`/`<`/`"< "`/`"> "` forms) strips the arrow character and draws a small
 * inline triangle glyph (`StringWithArrow.java`, `TextBlockArrow2`).
 */
import { describe, it, expect } from 'vitest';
import {
  ARROW_GLYPH_SIZE,
  parseMagicArrowLabel,
  magicArrowAngle,
  magicArrowGlyphPoints,
  hasSeveralGuideLines,
  computeGuideLinesBox,
  splitGuideLines,
} from '../../../src/diagrams/class/class-magic-arrow.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

describe('parseMagicArrowLabel (G2 item 44)', () => {
  it('returns undefined for a plain label with no arrow token', () => {
    expect(parseMagicArrowLabel('demo')).toBeUndefined();
  });

  it('a bare "<" strips to no text, direction backward', () => {
    expect(parseMagicArrowLabel('<')).toEqual({ text: undefined, direction: 'backward' });
  });

  it('a bare ">" strips to no text, direction forward', () => {
    expect(parseMagicArrowLabel('>')).toEqual({ text: undefined, direction: 'forward' });
  });

  it('"< to center" strips the leading "< " token, direction backward', () => {
    expect(parseMagicArrowLabel('< to center')).toEqual({ text: 'to center', direction: 'backward' });
  });

  it('"> to center" strips the leading "> " token, direction forward', () => {
    expect(parseMagicArrowLabel('> to center')).toEqual({ text: 'to center', direction: 'forward' });
  });

  it('"foo >" strips the trailing " >" token, direction forward', () => {
    expect(parseMagicArrowLabel('foo >')).toEqual({ text: 'foo', direction: 'forward' });
  });

  it('"foo <" strips the trailing " <" token, direction backward', () => {
    expect(parseMagicArrowLabel('foo <')).toEqual({ text: 'foo', direction: 'backward' });
  });

  it('a stereotype guillemet ("<<alias>>") is NOT a magic-arrow token', () => {
    expect(parseMagicArrowLabel('<<alias>>')).toBeUndefined();
  });

  it('an inner "<" with no leading/trailing space is not a magic-arrow token', () => {
    expect(parseMagicArrowLabel('a<b')).toBeUndefined();
  });
});

describe('magicArrowAngle (G2 item 44)', () => {
  // Jar-verified against `lojepe-37-liri985`'s straight horizontal edge
  // (start (48.73,31) -> end (105.67,31), atan2(dx,dy) = atan2(+,0) = PI/2).
  it('computes atan2(dx, dy) over the edge\'s own start/end points (forward)', () => {
    const points = [{ x: 48.73, y: 31 }, { x: 105.67, y: 31 }];
    expect(magicArrowAngle(points, 'forward')).toBeCloseTo(Math.PI / 2, 10);
  });

  it('adds PI for the backward direction', () => {
    const points = [{ x: 48.73, y: 31 }, { x: 105.67, y: 31 }];
    expect(magicArrowAngle(points, 'backward')).toBeCloseTo(Math.PI / 2 + Math.PI, 10);
  });

  it('uses only the first and last point of a multi-point spline', () => {
    const points = [{ x: 0, y: 0 }, { x: 999, y: 999 }, { x: 10, y: 0 }];
    expect(magicArrowAngle(points, 'forward')).toBeCloseTo(Math.PI / 2, 10);
  });
});

describe('magicArrowGlyphPoints (G2 item 44)', () => {
  // Jar-verified byte-exact SHAPE against `lojepe-37-liri985`'s golden
  // `<polygon points="75.68,20.5,66.6349,17.5611,66.6349,23.4389,...">`:
  // relative deltas from the tip to each back corner are (-9.0451,-2.9389)
  // and (-9.0451,2.9389) -- reproduced here from the local (0,0)-origin box.
  it('produces the exact jar-verified triangle shape for a PI/2 (rightward) angle', () => {
    const [tip, a, b] = magicArrowGlyphPoints(0, 0, Math.PI / 2, 13);
    expect(tip).toBeDefined();
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.x - tip!.x).toBeCloseTo(-9.0451, 3);
    expect(a!.y - tip!.y).toBeCloseTo(-2.9389, 3);
    expect(b!.x - tip!.x).toBeCloseTo(-9.0451, 3);
    expect(b!.y - tip!.y).toBeCloseTo(2.9389, 3);
  });

  it('the tip sits at (originX + ARROW_GLYPH_SIZE, originY + arrowFontSize/2) for a PI/2 angle', () => {
    // cx = originX + half, tip.x = cx + half*sin(PI/2) = cx + half = originX + 2*half.
    const [tip] = magicArrowGlyphPoints(10, 20, Math.PI / 2, 13);
    expect(tip!.x).toBeCloseTo(10 + ARROW_GLYPH_SIZE, 6);
    expect(tip!.y).toBeCloseTo(20 + 6.5, 6);
  });

  it('the y-center tracks the CALLER\'s arrowFontSize, not ARROW_GLYPH_SIZE', () => {
    // TextBlockArrow2.java:68: UTranslate(triSize/2, size/2) -- the
    // y-translate is the FULL font size, never the draw-only ink triangle.
    const [tip] = magicArrowGlyphPoints(0, 0, Math.PI / 2, 20);
    expect(tip!.y).toBeCloseTo(10, 6); // 20/2, not ARROW_GLYPH_SIZE/2
  });

  it('rotating by PI mirrors the tip to the opposite side', () => {
    const [tipRight] = magicArrowGlyphPoints(0, 0, Math.PI / 2, 13);
    const [tipLeft] = magicArrowGlyphPoints(0, 0, Math.PI / 2 + Math.PI, 13);
    // sin(angle+PI) = -sin(angle) -- the tip's x-offset flips sign.
    expect(tipLeft!.x - ARROW_GLYPH_SIZE / 2).toBeCloseTo(-(tipRight!.x - ARROW_GLYPH_SIZE / 2), 6);
  });
});

describe('hasSeveralGuideLines (D6, Display.java:715-740)', () => {
  it('is false for a single line, even one carrying a token', () => {
    expect(hasSeveralGuideLines(['> foo'])).toBe(false);
  });

  it('is false for a multi-line label where no line carries a token', () => {
    expect(hasSeveralGuideLines(['this is', 'on several', 'lines'])).toBe(false);
  });

  it('is true when a line STARTS WITH "< "', () => {
    expect(hasSeveralGuideLines(['a', '< ef'])).toBe(true);
  });

  it('is true when a line STARTS WITH "> "', () => {
    expect(hasSeveralGuideLines(['a', '> gh'])).toBe(true);
  });

  it('is true when a line ENDS WITH " <"', () => {
    expect(hasSeveralGuideLines(['a', 'cd <'])).toBe(true);
  });

  it('is true when a line ENDS WITH " >"', () => {
    expect(hasSeveralGuideLines(['a', 'ab >'])).toBe(true);
  });

  it('gobuco/lapoma\'s exact 4-line label is a several-guide-line label', () => {
    expect(hasSeveralGuideLines(['ab >', 'cd <', '< ef', '> gh'])).toBe(true);
  });
});

describe('computeGuideLinesBox (D6, StringWithArrow.java:115-127)', () => {
  const measurer = new WidthTableMeasurer();
  const font = { family: 'sans-serif', size: 13 };

  // jar-verified structurally EQUAL against gobuco-16-ruke239/lapoma-04-
  // vaga142's oracle svek DOT (`npx jiti scripts/dot-sync-report.ts --slug
  // gobuco-16-ruke239 class`): WIDTH="29" HEIGHT="54" after edgeLabelAttrs'
  // own +2*marginLabel and floor -- this function returns the PRE-margin
  // block (29.4625 x 54), matching computeMeasuredLabelAttrs' contract.
  it('sizes gobuco/lapoma\'s 4-line all-token label to the oracle box', () => {
    const box = computeGuideLinesBox(['ab >', 'cd <', '< ef', '> gh'], font, measurer);
    expect(box.width).toBeCloseTo(27.4625, 4); // + 2*1 margin = 29.4625 -> floors to 29
    expect(box.height).toBe(52); // + 2*1 margin = 54
  });

  it('a line with no token measures its own text only, no arrow block added', () => {
    const box = computeGuideLinesBox(['ab >', 'q'], font, measurer);
    const abWidth = measurer.measure('ab', font).width;
    // 'ab >' -> 13 (arrow block) + 'ab' text width; 'q' has no token, so its
    // OWN line width is just measurer.measure('q').width -- were the arrow
    // block wrongly added to 'q' too, the max would be pulled higher still.
    expect(box.width).toBeCloseTo(font.size + abWidth, 6);
    expect(box.height).toBe(font.size + font.size); // sum, not max, across lines
  });
});

describe('splitGuideLines (D3, StringWithArrow.java:115-127)', () => {
  const measurer = new WidthTableMeasurer();
  const font = { family: 'sans-serif', size: 13 };
  const gobuco = ['ab >', 'cd <', '< ef', '> gh'];

  it("splits gobuco's 4-line label into one entry per line, direction per token", () => {
    const lines = splitGuideLines(gobuco, font, measurer);
    expect(lines.map((l) => l.text)).toEqual(['ab', 'cd', 'ef', 'gh']);
    expect(lines.map((l) => l.direction)).toEqual([
      'forward', // 'ab >' -> right
      'backward', // 'cd <' -> left
      'backward', // '< ef' -> left
      'forward', // '> gh' -> right
    ]);
    for (const l of lines) {
      // TextBlockArrow2.calculateDimension is (size, size), TextBlockArrow2.java:87-89
      expect(l.textWidth).toBe(measurer.measure(l.text, font).width);
      expect(l.blockWidth).toBe(font.size + l.textWidth);
      expect(l.blockHeight).toBe(Math.max(font.size, measurer.measure(l.text, font).height));
    }
  });

  it('a line with no token has no direction and a bare text block', () => {
    const [q] = splitGuideLines(['q'], font, measurer);
    expect(q!.text).toBe('q');
    expect(q!.direction).toBeUndefined();
    expect(q!.blockWidth).toBe(q!.textWidth);
    expect(q!.blockHeight).toBe(measurer.measure('q', font).height);
  });

  it('a bare token line has empty text and a size x size block', () => {
    const [bare] = splitGuideLines(['<'], font, measurer);
    expect(bare!.text).toBe('');
    expect(bare!.direction).toBe('backward');
    expect(bare!.textWidth).toBe(0);
    expect(bare!.blockWidth).toBe(font.size);
    expect(bare!.blockHeight).toBe(font.size);
  });

  it('computeGuideLinesBox is exactly max(blockWidth) x sum(blockHeight) over the walk', () => {
    for (const input of [gobuco, ['ab >', 'q'], ['<', 'plain', 'x >']]) {
      const walk = splitGuideLines(input, font, measurer);
      expect(computeGuideLinesBox(input, font, measurer)).toEqual({
        width: Math.max(...walk.map((l) => l.blockWidth)),
        height: walk.reduce((acc, l) => acc + l.blockHeight, 0),
      });
    }
    // The pre-T1 pinned value (SI24 T4): 27.4625 x 52 pre-margin = 29x54 DOT box.
    const box = computeGuideLinesBox(gobuco, font, measurer);
    expect(box.width).toBeCloseTo(27.4625, 4);
    expect(box.height).toBe(52);
  });
});
