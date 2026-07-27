/**
 * S1L-b T3 — leaf-box sizing of a `[ … ]` display body:
 *  - creole formatting tags (`<b>`, `<color:…>`, …) contribute ZERO width
 *    (the deterministic measurer is weight-agnostic — S1L-b ADR-2), and
 *  - a creole horizontal-rule line (`----`/`====`) contributes the thin
 *    `CREOLE_HR_HEIGHT` (8px), not a full text line (S1L-b ADR-4).
 *
 * See `src/diagrams/description/leaf-sizing.ts`.
 */

import { describe, it, expect } from 'vitest';
import { measureLeafNode } from '../../../src/diagrams/description/leaf-sizing.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };

/** Deterministic 10px/char, height = fontSize — so widths are exact and the
 *  measurer is weight-agnostic (bold/italic measure the same as plain), which
 *  is the property ADR-2 relies on. */
const stubMeasurer: StringMeasurer = {
  measure: (text: string, f: FontSpec) => ({ width: text.length * 10, height: f.size }),
  getDescent: () => 0,
};

function node(display: string): DescriptiveNode {
  return { id: 'x', display, symbol: 'node', children: [] };
}

function size(display: string): { width: number; height: number } {
  return measureLeafNode(node(display), fontSpec, stubMeasurer);
}

const CREOLE_HR_HEIGHT = 8;

describe('leaf-sizing — creole-aware width + HR height (S1L-b T3)', () => {
  it('a creole HR line contributes CREOLE_HR_HEIGHT, not a full text line', () => {
    // Derive the per-line text height from single- vs two-line displays, so the
    // assertion is independent of the exact LINE_HEIGHT_FACTOR/margin constants.
    const lineH = size('a\nb').height - size('a').height;
    const withText = size('a\ntext\nb').height;
    const withHr = size('a\n====\nb').height;
    expect(withText - withHr).toBe(lineH - CREOLE_HR_HEIGHT);
  });

  it('`----` and `====` are both treated as an 8px rule (no per-style split)', () => {
    expect(size('a\n----\nb').height).toBe(size('a\n====\nb').height);
  });

  it('`____` (underscores) is NOT a rule — it sizes as a normal text line', () => {
    // The renderer draws `____` as literal text; the sizer must agree (ADR-4
    // refinement). So an `____` body sizes the same as any 4-char text line.
    expect(size('a\n____\nb').height).toBe(size('a\nWXYZ\nb').height);
  });

  it('`<b>…</b>` formatting tags contribute zero width', () => {
    expect(size('<b>arn</b>').width).toBe(size('arn').width);
  });

  it('`<color:red>…</color>` formatting tags contribute zero width', () => {
    expect(size('<color:red>text</color>').width).toBe(size('text').width);
  });

  it('width is still driven by the widest VISIBLE line', () => {
    // "<b>arn</b>" -> "arn" (3), "wider" (5) -> the wider visible line wins.
    expect(size('<b>arn</b>\nwider').width).toBe(size('xxx\nwider').width);
  });
});
