/**
 * `sequenceText` — the sequence engine's single `<text>` emitter (D3).
 *
 * The oracle for every expectation here is the jar's own markup for
 * `jobadi-87-jegi648`, whose participant head is a three-character label:
 *
 * ```
 * <text x="17" y="27.889" fill="#000" font-size="14" textLength="24.938">Bob</text>
 * ```
 * (`test-results/dot-cache/sequence/jobadi-87-jegi648/in.svg`)
 *
 * That one element carries all three properties this module exists to
 * enforce: `x` is the LEFT EDGE, `y` is the BASELINE, and the measured width
 * reaches `textLength`. This port had been emitting a centre plus
 * `text-anchor="middle"`/`dominant-baseline="middle"` for the same label,
 * which draws in the same place and compares as a coordinate error against
 * every jar oracle in the corpus.
 */
import { describe, it, expect } from 'vitest';

import { sequenceText, type SequenceTextSpec } from '../../../src/diagrams/sequence/sequence-text.js';

/** The jar's own `jobadi-87-jegi648` participant label, field for field. */
const JOBADI_BOB: SequenceTextSpec = {
  leftX: 17,
  baselineY: 27.889,
  text: 'Bob',
  width: 24.938,
  fontFamily: 'sans-serif',
  fontSize: 14,
  fill: '#000',
};

/** Attribute name → value, so an assertion is order-independent — the jar's
 *  emission order differs from this port's and neither is meaningful. */
function attributesOf(markup: string): Record<string, string> {
  const open = /^<text([^>]*)>/.exec(markup);
  expect(open).not.toBeNull();
  const out: Record<string, string> = {};
  for (const m of open![1]!.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]!] = m[2]!;
  return out;
}

describe('sequenceText', () => {
  it("matches the jar's own markup for jobadi-87-jegi648's participant label", () => {
    const attrs = attributesOf(sequenceText(JOBADI_BOB));
    // `font-family` is absent by design: `sans-serif` is the family hoisted
    // onto the document root, and `svg-text-font.ts#textFontFamily` suppresses
    // a per-element copy of it exactly as the jar does (the oracle carries
    // `font-family="sans-serif"` on the root `<g>`, not on the `<text>`).
    expect(attrs).toEqual({
      x: '17',
      y: '27.889',
      'font-size': '14',
      fill: '#000',
      textLength: '24.938',
    });
    expect(sequenceText(JOBADI_BOB)).toContain('>Bob</text>');
  });

  it('emits neither text-anchor nor dominant-baseline', () => {
    const markup = sequenceText({
      ...JOBADI_BOB,
      fontWeight: '700',
      textDecoration: 'underline',
    });
    expect(markup).not.toContain('text-anchor');
    expect(markup).not.toContain('dominant-baseline');
  });

  it('carries fontWeight and textDecoration through when given', () => {
    const attrs = attributesOf(
      sequenceText({ ...JOBADI_BOB, fontWeight: '700', textDecoration: 'wavy underline' }),
    );
    expect(attrs['font-weight']).toBe('700');
    expect(attrs['text-decoration']).toBe('wavy underline');
  });

  it("omits both when absent, rather than emitting an empty attribute", () => {
    const attrs = attributesOf(sequenceText(JOBADI_BOB));
    expect(attrs['font-weight']).toBeUndefined();
    expect(attrs['text-decoration']).toBeUndefined();
  });

  it("skips textLength for a single character — upstream's text.length() > 1 guard", () => {
    // `DriverTextSvg` hands the width unconditionally; the guard lives in the
    // writer (`svg-shapes.ts#textLengthOf`), which this module does not
    // re-implement. Asserted here so a future change that stops routing
    // through `text()` cannot silently lose it.
    const attrs = attributesOf(sequenceText({ ...JOBADI_BOB, text: 'B', width: 8.313 }));
    expect(attrs['textLength']).toBeUndefined();
    expect(attrs['x']).toBe('17');
  });

  it('emits a per-element font-family only when it differs from the root', () => {
    const attrs = attributesOf(sequenceText({ ...JOBADI_BOB, fontFamily: 'monospaced' }));
    // `monospaced` is PlantUML's logical name; the SVG attribute is the CSS
    // generic (`svg-text-font.ts#renameLogicalMonospace`).
    expect(attrs['font-family']).toBe('monospace');
  });

  it('XML-escapes the text content', () => {
    const markup = sequenceText({ ...JOBADI_BOB, text: 'a < b & c' });
    expect(markup).toContain('a &lt; b &amp; c');
  });
});
