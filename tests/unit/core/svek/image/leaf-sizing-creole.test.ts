/**
 * creole-lexer-unification T2 — the sizer (`leaf-sizing.ts#creoleVisibleText`)
 * now routes through the SAME shared "line -> visible atoms" lexer the
 * renderer draws with (`StripeSimple.ts#buildLineAtoms`, ADR-1), rather than
 * the separate `parseCreole` lexer it used to call. The two disagreed on
 * unclosed/`:`-variant tags — `lurupu-11-fubo915`'s driver line is the
 * jar-verified case (`plans/creole-lexer-unification/decisions.md` ADR-1/2):
 * the sizer used to measure the LITERAL tag text (53 codepoints), the
 * renderer always drew the STRIPPED+decoded text (22 codepoints, matching
 * the oracle). This file pins the fix and its no-regression cases.
 *
 * See `tests/unit/description/leaf-sizing-body.test.ts` for the
 * stub-measurer convention reused below.
 */

import { describe, it, expect } from 'vitest';
import { measureLeafNode } from '../../../../../src/core/svek/image/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import type { FontSpec, StringMeasurer } from '../../../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../../../src/diagrams/description/ast.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };

/** Deterministic 10px/char, height = fontSize — matches
 *  `leaf-sizing-body.test.ts`'s own stub, reused for the tag-stripping
 *  no-regression cases below (bold/plain parity does not need real Unicode
 *  glyph widths). */
const stubMeasurer: StringMeasurer = {
  measure: (text: string, f: FontSpec) => ({ width: text.length * 10, height: f.size }),
  getDescent: () => 0,
};

function node(display: string): DescriptiveNode {
  return { id: 'x', display, symbol: 'node', children: [] };
}

function boxWidth(display: string, measurer: StringMeasurer): number {
  return measureLeafNode(node(display), fontSpec, measurer).width;
}

describe('leaf-sizing — shared sizer/renderer creole lexer (creole-lexer-unification T2)', () => {
  it("lurupu-11-fubo915's driver line measures at the stripped+decoded width, not the literal-tag width", () => {
    // Upstream `<b>` never closes and `<font Segoe UI Emoji>` is the
    // space-form, both of which `buildStripeAtoms` (the renderer's lexer,
    // now shared by the sizer) strips; `<U+XXXX>` codepoint escapes decode
    // to their glyphs. Ground truth: the renderer draws (and the oracle
    // measures) the visible 22-codepoint form below.
    const display = '<b>this is also <U+221E> <font Segoe UI Emoji><U+1F680><U+263A></font> long';
    const strippedDecoded = 'this is also ∞ 🚀☺ long';
    const measurer = new WidthTableMeasurer();

    const sizerWidth = boxWidth(display, measurer);
    const groundTruthWidth = boxWidth(strippedDecoded, measurer);
    // toBeCloseTo, not toBe: the sizer now measures each creole atom under
    // ITS OWN font and SUMS (matching the renderer's `measureAtomsWidthHeight`
    // and so picking up `==heading`/`<size:N>` cascades, S1L-f), so the tagged
    // form accumulates across several atoms while the plain form is one
    // `measure` call -- a ~1e-14 floating-point association difference, not a
    // behavioural one.
    expect(sizerWidth).toBeCloseTo(groundTruthWidth, 10);

    // Had the sizer left the tags/escapes literal (the pre-fix `parseCreole`
    // behavior), the box would measure at least the RAW literal text's own
    // char width plus the same fixed box margin -- strictly wider than the
    // correctly-stripped width, since the literal form carries strictly more
    // visible characters (the tag markup itself, unstripped).
    const literalCharWidth = measurer.measure(display, fontSpec).width;
    const strippedCharWidth = measurer.measure(strippedDecoded, fontSpec).width;
    const marginAndIcon = sizerWidth - strippedCharWidth;
    const hypotheticalLiteralBoxWidth = marginAndIcon + literalCharWidth;
    expect(sizerWidth).toBeLessThan(hypotheticalLiteralBoxWidth);
  });

  it('a balanced `<b>arn</b>` measures identically to plain `arn` (no regression)', () => {
    expect(boxWidth('<b>arn</b>', stubMeasurer)).toBe(boxWidth('arn', stubMeasurer));
  });

  it('a plain tag-free line is unchanged', () => {
    const plain = 'a plain line with no creole markup at all';
    expect(boxWidth(plain, stubMeasurer)).toBe(plain.length * 10 + 40);
  });
});
