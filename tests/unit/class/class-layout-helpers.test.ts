/**
 * Unit tests for class-layout-helpers.ts#splitEdgeLabelLines/edgeLabelAttrs
 * -- G2 item 43 (multi-line edge labels): a relationship label containing
 * `\n`/`\l`/`\r` escape sequences (upstream line-break markers) must split
 * into one line per segment, with the LAST `\l`/`\r` occurrence setting the
 * WHOLE block's alignment (default CENTER when neither appears) --
 * `Display#getWithNewlines`, `klimt/creole/Display.java:259-343`.
 */
import { describe, it, expect } from 'vitest';
import { splitEdgeLabelLines, edgeLabelAttrs, wrapPlainTextLine } from '../../../src/diagrams/class/class-layout-helpers.js';
import type { Relationship } from '../../../src/diagrams/class/ast.js';

describe('splitEdgeLabelLines (G2 item 43)', () => {
  it('returns a single line with center alignment when no escape is present', () => {
    expect(splitEdgeLabelLines('demo')).toEqual({ lines: ['demo'], align: 'center' });
  });

  // Jar-verified against `sicile-99-pefa679`'s own 3-line `\n` label
  // (`cl1 -- cl2 : this is\non several\nlines`).
  it('splits on \\n with no alignment change (default CENTER)', () => {
    expect(splitEdgeLabelLines('this is\\non several\\nlines')).toEqual({
      lines: ['this is', 'on several', 'lines'],
      align: 'center',
    });
  });

  it('splits on \\l and sets alignment to left', () => {
    expect(splitEdgeLabelLines('this is\\lon several\\llines')).toEqual({
      lines: ['this is', 'on several', 'lines'],
      align: 'left',
    });
  });

  it('splits on \\r and sets alignment to right', () => {
    expect(splitEdgeLabelLines('this is\\ron several\\rlines')).toEqual({
      lines: ['this is', 'on several', 'lines'],
      align: 'right',
    });
  });

  it('the LAST \\l/\\r occurrence wins, matching jar\'s overwritten field', () => {
    expect(splitEdgeLabelLines('a\\rb\\lc')).toEqual({ lines: ['a', 'b', 'c'], align: 'left' });
  });

  it('\\t becomes a literal tab within the current line', () => {
    expect(splitEdgeLabelLines('a\\tb')).toEqual({ lines: ['a\tb'], align: 'center' });
  });

  it('\\\\ becomes a literal backslash', () => {
    expect(splitEdgeLabelLines('a\\\\b')).toEqual({ lines: ['a\\b'], align: 'center' });
  });

  it('an unrecognized \\x pair is kept as-is (both characters)', () => {
    expect(splitEdgeLabelLines('a\\zb')).toEqual({ lines: ['a\\zb'], align: 'center' });
  });

  it('a trailing lone backslash is kept as-is', () => {
    expect(splitEdgeLabelLines('abc\\')).toEqual({ lines: ['abc\\'], align: 'center' });
  });
});

const measurer = {
  measure: (s: string) => ({ width: s.length * 7, height: 14 }),
  getDescent: () => 3,
};
const font = { family: 'sans', size: 14 };

function rel(label: string): Relationship {
  return { from: 'A', to: 'B', type: 'association', label };
}

describe('edgeLabelAttrs — multi-line label sizing (G2 item 43)', () => {
  it('measures a single-line label unchanged (pre-existing behavior)', () => {
    const attrs = edgeLabelAttrs(rel('demo'), font, font, measurer);
    expect(attrs.label).toBe('demo');
    // +2 on each axis is SvekEdge#addVisibilityModifier's all-round
    // `withMargin(block, 1, 1)` (svek/SvekEdge.java:372-373), applied once
    // to the finished block. Jar-confirmed on bejusa-95-gafo325, whose
    // 48.425x13 'contains' label emits WIDTH="50" HEIGHT="15".
    expect(attrs.labelWidth).toBe(30); // 'demo'.length * 7 + 2
    expect(attrs.labelHeight).toBe(16); // 14 + 2
  });

  it('reserves the WIDEST line\'s width and the stacked height for a multi-line label', () => {
    // Lines: 'this is' (7), 'on several' (10), 'lines' (5) -- widths *7.
    const attrs = edgeLabelAttrs(rel('this is\\non several\\nlines'), font, font, measurer);
    expect(attrs.label).toBe('this is\\non several\\nlines');
    expect(attrs.labelWidth).toBe(72); // 'on several'.length(10) * 7 + 2
    expect(attrs.labelHeight).toBe(44); // 14 * 3 lines + 2 (block margin, not per line)
  });

  // T4/vuresa-33-kumu160: a creole formatting tag on one line must not be
  // measured as literal glyphs (`stripCreoleMarkup`, `core/edge-label-box
  // .ts:71`) -- upstream RENDERS `<b>..</b>` as bold formatting at
  // `create()`/`create9()` time rather than counting its 7 tag characters
  // (`Display.java:413-419` fixes the ORDER: guillemet at Display-
  // construction time, creole rendering later -- the strip below mirrors
  // that by running AFTER `applyGuillemet`, not before).
  it('strips inline creole tags per line before measuring (T4)', () => {
    const attrs = edgeLabelAttrs(rel('<b>bold</b>\\nlonger plain line'), font, font, measurer);
    // '<b>bold</b>' stripped -> 'bold' (4 chars); 'longer plain line' (17
    // chars) is the real widest line, dominating over the tag-inflated
    // literal width the tag would otherwise contribute.
    expect(attrs.labelWidth).toBe(121); // 'longer plain line'.length(17) * 7 + 2
  });
});

describe('edgeLabelAttrs — per-line magic arrows, D6 (SvekEdge.java:290-297)', () => {
  // jar-verified structurally EQUAL against gobuco-16-ruke239/lapoma-04-
  // vaga142's oracle svek DOT once fed the REAL WidthTableMeasurer -- this
  // file's own mock measurer (`s.length * 7`) is used here only to assert
  // the BRANCH taken (per-line arrow path vs plain stacked-text), not the
  // oracle's exact 29x54 (see class-magic-arrow.test.ts for that).
  it('takes the per-line arrow path when a line starts/ends with a guide-line token', () => {
    const attrs = edgeLabelAttrs(rel('ab >\\ncd <\\n< ef\\n> gh'), font, font, measurer);
    // Each line strips its token (2 letters) and adds a font.size(14) arrow
    // block -- 14 + 2*7 = 28 width per line, height sums across 4 lines:
    // 4 * max(14, 14) = 56, then +2 margin on each axis.
    expect(attrs.labelWidth).toBe(30); // 28 + 2
    expect(attrs.labelHeight).toBe(58); // 56 + 2
  });

  it('a two-line label with no guide-line token keeps the plain stacked-text path', () => {
    const attrs = edgeLabelAttrs(rel('ab cd\\nef gh'), font, font, measurer);
    // Neither line starts with "< "/"> " or ends with " <"/" >" -- the
    // plain per-line-width-max/height-sum formula from the test above runs
    // unchanged, NOT computeGuideLinesBox.
    expect(attrs.labelWidth).toBe(37); // 'ab cd'.length(5) * 7 + 2
    expect(attrs.labelHeight).toBe(30); // 14 * 2 lines + 2
  });

  it('a single line with a token stays on T12c\'s whole-label path, unchanged', () => {
    const attrs = edgeLabelAttrs(rel('> foo'), font, font, measurer);
    // hasSeveralGuideLines requires >= 2 lines -- single-line labels never
    // reach computeGuideLinesBox regardless of token presence.
    expect(attrs.labelWidth).toBe(37); // 14 (arrow) + 'foo'.length(3)*7 + 2
  });
});

describe('edgeLabelAttrs — magic-arrow label sizing (G2 item 44 / M4 cause D)', () => {
  it('reserves the arrow font size plus the stripped text width for "foo >"', () => {
    const attrs = edgeLabelAttrs(rel('foo >'), font, font, measurer);
    // 'foo'.length(3) * 7 = 21. Arrow block = font.size(14)
    // (`TextBlockArrow2.calculateDimension`, `klimt/shape/TextBlockArrow2
    // .java:57,87`) -- NOT `ARROW_GLYPH_SIZE`(10), the draw-only `.80` ink
    // triangle (`:64-65`) that never enters a measurement.
    expect(attrs.labelWidth).toBe(37); // 21 + 14 + 2
    expect(attrs.labelHeight).toBe(16); // max(14, 14) + 2
  });

  it('reserves ONLY the arrow font size for a bare ">" -- no marginLabel at all', () => {
    // `Display.isNull` arm (`SvekEdge.java:281-285`) never calls
    // `addVisibilityModifier`, so the bare token skips marginLabel entirely
    // (unlike every other label shape, including a text-bearing arrow).
    const attrs = edgeLabelAttrs(rel('>'), font, font, measurer);
    expect(attrs.labelWidth).toBe(14); // font.size, no margin
    expect(attrs.labelHeight).toBe(14);
  });

  it('a stereotype guillemet label is measured via the plain (non-arrow) path', () => {
    // M4 cause C (`.agent-notes/m4-single-line-width.md`, `Guillemet.java
    // :78-88`): `<<alias>>` -> `«alias»` BEFORE measuring, so this counts
    // 7 glyphs (`«alias»`.length), not the raw 9-character token.
    const attrs = edgeLabelAttrs(rel('<<alias>>'), font, font, measurer);
    expect(attrs.labelWidth).toBe(51); // '«alias»'.length(7) * 7 + 2
  });
});


describe('wrapPlainTextLine (G2 N65 item 35 -- MaximumWidth word-wrap)', () => {
  // 7px/char, matching this file's own shared `measurer` mock above.
  it('returns the line unchanged when maxWidth is 0 (no MaximumWidth cascade)', () => {
    expect(wrapPlainTextLine('a very long line indeed', font, 0, measurer)).toEqual([
      'a very long line indeed',
    ]);
  });

  it('returns the line unchanged when maxWidth is negative', () => {
    expect(wrapPlainTextLine('a very long line indeed', font, -5, measurer)).toEqual([
      'a very long line indeed',
    ]);
  });

  // Jar-verified shape against `nucite-98-kuga991`'s own `MaximumWidth 150`
  // header ("Long Long Long Long Long Long Long Long Long Long **class**")
  // -- wraps at WORD boundaries, never mid-word (`Fission.ts#getSplitted`'s
  // own greedy-pack algorithm).
  it('word-wraps at the last whitespace boundary that fits maxWidth', () => {
    // 'aaa bbb ccc': each word is 3*7=21px, plus a space. maxWidth=45
    // fits 'aaa bbb' (21+7+21=49 > 45 -- actually fits only 'aaa' + partial;
    // use a wider budget that cleanly fits 2 words).
    expect(wrapPlainTextLine('aaa bbb ccc', font, 50, measurer)).toEqual(['aaa bbb', 'ccc']);
  });

  it('a single word wider than maxWidth is kept whole on its own line (no mid-word break)', () => {
    expect(wrapPlainTextLine('supercalifragilistic', font, 10, measurer)).toEqual([
      'supercalifragilistic',
    ]);
  });

  it('a line that already fits maxWidth is returned as a single unchanged line', () => {
    expect(wrapPlainTextLine('short', font, 1000, measurer)).toEqual(['short']);
  });
});
