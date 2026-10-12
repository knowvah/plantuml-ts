import { describe, expect, it } from 'vitest';

import { measureTeXIcon, texIconDimension } from '../../../src/core/latex-metrics.js';
import { measureLatex } from '../../../src/core/latex.js';

/**
 * Every expected size below is JLaTeXMath 1.0.7's own `TeXIcon` answer,
 * read from the oracle jar (`oracle/dist/plantuml-oracle.jar`) by building
 * the icon exactly as `math/TeXIconBuilder.java:52-73` does
 * (`setStyle(0)`, `setSize(20)`, `setInsets(new Insets(1, 1, 1, 1))`) and
 * printing `getIconWidth()` × `getIconHeight()`. `\theta`/`\nu` are also
 * the `<image>` sizes in `unknown/sapofa-97-gizu737`'s oracle SVG.
 */
const JLATEXMATH_ICONS: ReadonlyArray<readonly [string, number, number]> = [
  ['\\theta', 18, 22],
  ['\\nu', 18, 17],
  ['x', 20, 17],
  ['{x}', 20, 17],
  ['x_i', 25, 20],
  ['{}^2', 16, 26],
  ['x^2 + y^2', 70, 30],
  ['+a', 35, 22],
  ['a+', 35, 22],
  ['a+=', 56, 22],
  ['{\\mathbin{+}}', 24, 22],
  ['\\mathbin{x}', 20, 17],
  ['\\displaystyle x', 20, 17],
  ['xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 351, 17],
  ['A_{n-1}^{n-1}', 50, 33],
  ['C_{n-1}^{m-1}', 55, 33],
  ['\\mathcal{A}', 24, 22],
  ['\\mathcal{D}', 24, 22],
  ['\\mathcal{H}', 25, 22],
  ['\\mathcal{g}', 18, 21],
  ['\\mathbf{x}+1', 55, 23],
  ['P(\\mathbf{x})', 52, 28],
  ['\\mbox{Loss}(f,g)', 93, 28],
  ['\\text{a b}', 36, 22],
  ['P(y|\\mathbf{x}) \\mbox{ or } f(\\mathbf{x})+\\epsilon', 171, 28],
  ['a\\,b\\quad c', 60, 22],
  ['\\frac{a}{b}', 24, 45],
  ['\\frac{a}{b} + \\frac{c}{d}', 64, 45],
  ['\\frac{c_1}{\\lambda^5 (e^{c_2}-1)}', 103, 50],
  ['\\binom{a}{b}', 48, 45],
  ['\\sqrt{2}', 36, 30],
  ['\\sqrt[3]{x}', 38, 29],
  ['\\prod_{i=1}^{n}', 34, 68],
  ['\\textstyle\\sum_a^b', 42, 34],
  ['\\sin^2 x', 55, 26],
  ['\\lim_{x} f', 52, 36],
  ['\\mathop{x}_a', 20, 31],
  ['\\left( x \\right)', 35, 28],
  ['^2', 16, 26],
  ['{}_2', 15, 18],
  ['a {}^2', 27, 26],
  ['\\textstyle\\frac{a}{b}', 21, 29],
  ['\\textstyle\\binom{a}{b}', 39, 32],
  ['\\frac{abc}{d}', 41, 50],
  ['\\frac{a}{bcd}', 41, 45],
  ['\\left( \\frac{\\frac{a}{b}}{\\frac{c}{d}} \\right)', 55, 58],
  ['\\left. x \\right|', 25, 28],
  ['\\left(\\right)', 24, 28],
  ['\\sqrt[123456]{x}', 57, 29],
  ['\\sqrt[a]{x}', 38, 29],
  ['\\sqrt{\\frac{a}{b}}', 45, 57],
  ['\\sqrt{}', 26, 30],
  ['a\\hspace{1cm}b', 56, 22],
  ['a\\;b', 33, 22],
  ['a\\!b', 24, 22],
  ['a\\:b', 32, 22],
  ['x^{\\;a}', 28, 23],
  ['x_{\\:a}', 27, 20],
  ['x_{a_b}', 32, 23],
  ['x_a^b', 28, 31],
  ['f_a', 26, 26],
  ['f^a', 28, 27],
  ['\\sum_{i}', 37, 55],
  ['\\sum^{n}', 37, 53],
  ['\\sum\\nolimits_a', 49, 41],
  ['\\int_a', 31, 54],
  ['\\int^a', 41, 54],
  ['\\mathop{x}\\limits_a', 20, 31],
  ['\\textstyle\\lim_{n} x', 59, 25],
  ['\\mathrel{x}a', 36, 17],
  ['a\\mathbin{+}', 44, 22],
  ['\\text{a~b}', 36, 22],
  ['\\scriptstyle x', 16, 15],
  ['\\textcolor{red}{x}y', 30, 21],
  ['x^{a+b}', 45, 26],
  ['a\\hspace{1em}b', 48, 22],
  ['a\\hspace{1ex}b', 36, 22],
  ['\\frac{a}{b^2_3}', 29, 51],
  ['\\binom{\\frac{a}{b}}{c}', 55, 56],
  ['\\textstyle\\frac{a}{\\frac{b}{c}}', 21, 36],
  ['\\binom{a_1}{b^2}', 55, 45],
  ['\\frac{\\int}{\\int}', 27, 60],
  ['\\binom{\\int}{\\int}', 56, 59],
  [' \\int_{0}^{\\infty} \\left( \\sum_{i = 0}^{n} \\right) {\\rm d}x ', 137, 69],
];

describe('measureTeXIcon: JLaTeXMath TeXIcon sizes over KaTeX metrics', () => {
  it.each(JLATEXMATH_ICONS)('sizes %s as JLaTeXMath does', (expr, width, height) => {
    expect(measureTeXIcon(expr)).toEqual({ width, height, unsupported: [] });
  });

  it('sizes a formula KaTeX cannot parse as the empty formula, flagged', () => {
    expect(measureTeXIcon('\\frac{')).toEqual({ width: 8, height: 8, unsupported: ['katex-parse-error'] });
  });

  it('flags a construct it does not size by JLaTeXMath rules', () => {
    expect(measureTeXIcon('\\vec{x}').unsupported).toEqual(['accent']);
  });

  it('sizes an unmodelled construct by its body alone', () => {
    const { width, height } = measureTeXIcon('x');
    expect(measureTeXIcon('\\overline{x}')).toEqual({ width, height, unsupported: ['overline'] });
  });

  it('flags a length unit JLaTeXMath does not know and sizes it as nothing', () => {
    const { width, height } = measureTeXIcon('ab');
    expect(measureTeXIcon('a\\kern1nd b')).toEqual({ width, height, unsupported: ['unit nd'] });
  });
});

describe('texIconDimension: TeXIcon#getIconWidth/getIconHeight', () => {
  it('adds the four-unit insets and rounds each dimension up by 0.99', () => {
    // \theta's box: 0.46944 × (0.69444 + 0): 9.3888 + 0.99 + 8 → 18;
    // (13.8888 + 0.99 + 4) → 18, plus (0 + 0.99 + 4) → 4.
    expect(texIconDimension({ width: 0.46944, height: 0.69444, depth: 0 })).toEqual({ width: 18, height: 22 });
  });

  it('sizes the empty box as insets alone', () => {
    expect(texIconDimension({ width: 0, height: 0, depth: 0 })).toEqual({ width: 8, height: 8 });
  });
});

describe('measureLatex', () => {
  it('strips a <latex> wrapper before sizing', () => {
    expect(measureLatex('<latex>\\theta</latex>')).toEqual({ width: 18, height: 22 });
  });

  it('returns only the size', () => {
    expect(measureLatex('\\nu')).toEqual({ width: 18, height: 17 });
  });
});
