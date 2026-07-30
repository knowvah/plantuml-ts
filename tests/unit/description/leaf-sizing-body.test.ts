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

  it('`____` (underscores) IS a rule — it does NOT size as a normal text line', () => {
    // CORRECTED by T4 (bodyenhanced-atom-seams). This pin previously asserted
    // the opposite — that `____` sizes as literal text — and that was wrong
    // against upstream.
    //
    // `BodyEnhancedAbstract.isBlockSeparator` (java:67-82) returns true for
    // `s.startsWith("__") && s.endsWith("__")`, with no "no inner delimiter"
    // constraint, so `____` is a block separator. Jar-probed directly rather
    // than argued from the source:
    //
    //   component "line1\n____\nline2" as c1
    //   component second
    //   c1 --> second
    //
    //   java -DPLANTUML_DETERMINISTIC_TEXT=true \
    //        -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <puml>
    //
    // gives data-diagram-type="DESCRIPTION" and emits
    //   <line x1="15.74" y1="41" x2="83.4025" y2="41"
    //         style="stroke:#181818;stroke-width:0.5;"/>
    // while the literal string `____` appears ZERO times in the SVG. The jar
    // draws a rule, not text. (The 0.5 thickness independently corroborates
    // T2a's `getDefaultThickness` finding.)
    //
    // Why the old pin looked right: the pre-T4 sizer used
    // `CreoleStripeSimpleParser.classifyStripeLine`, whose patterns are
    // anchored regexes (`^--([^-]*)--$` and friends) and are therefore
    // STRICTER than upstream's startsWith/endsWith test. T4 routed `desc`
    // through `BodyFactory.create3`, so upstream's own predicate now governs.
    expect(size('a\n____\nb').height).not.toBe(size('a\nWXYZ\nb').height);
    // A rule is shorter than a text line: 66 vs 72 for this body.
    expect(size('a\n____\nb').height).toBe(66);
    expect(size('a\nWXYZ\nb').height).toBe(72);
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
