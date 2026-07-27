/**
 * S1L-b-unicode T1 — codepoint/entity escapes (`<U+XXXX>`/`&#NNN;`) decode
 * PER-LINE at measure time, AFTER the `\n` line-split, mirroring upstream's
 * per-atom `AtomText.manageSpecialChars` (decisions.md Rule 1 / ADR-1).
 *
 * Two invariants under test:
 *  1. `finalizeDisplay` no longer decodes codepoint escapes — the raw
 *     `<U+…>`/`&#…;` token is PRESERVED on `node.display` (only `\n`/`\r`/`\l`
 *     backslash escapes are resolved to real newlines).
 *  2. The leaf sizer decodes each split line before measuring, so a decoded
 *     inline newline (`<U+000A>`) stays WITHIN its line (one line, not two),
 *     while a real `\n` still splits — and a non-newline codepoint measures
 *     exactly as its decoded glyph (output-neutral vs the old decode-before-
 *     split path).
 *
 * See `src/diagrams/description/leaf-sizing.ts` and
 * `src/diagrams/description/parse-helpers-strings.ts#finalizeDisplay`.
 */

import { describe, it, expect } from 'vitest';
import { measureLeafNode } from '../../../src/diagrams/description/leaf-sizing.js';
import { finalizeDisplay } from '../../../src/diagrams/description/parse-helpers.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';

const fontSpec: FontSpec = { family: 'Helvetica', size: 14 };

/** Deterministic 10px/char, height = fontSize (same stub as leaf-sizing-body). */
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

const INFINITY = String.fromCodePoint(0x221e); // <U+221E> ∞

describe('finalizeDisplay — codepoint escapes preserved, newline escapes resolved', () => {
  it('preserves a raw `<U+XXXX>` codepoint token (decoded later, per-line)', () => {
    expect(finalizeDisplay('aaa<U+000A>bbb')).toBe('aaa<U+000A>bbb');
  });

  it('preserves a raw `&#NNN;` entity token', () => {
    expect(finalizeDisplay('x&#65;y')).toBe('x&#65;y');
  });

  it('still resolves a backslash `\\n` escape to a real newline', () => {
    expect(finalizeDisplay('aaa\\nbbb')).toBe('aaa\nbbb');
  });
});

describe('leaf sizing — codepoint newline is inline, backslash-n still splits (T1)', () => {
  it('`<U+000A>` sizes as ONE line (inline), not two', () => {
    // gafico node `a`: 4× `<U+000A>` is a single line upstream, not 5 lines.
    const oneLine = size('single').height;
    expect(size('aaa<U+000A>bbb').height).toBe(oneLine);
    expect(size('aaa<U+000A>bbb<U+000A>ccc').height).toBe(oneLine);
  });

  it('a real backslash-n `\\n` (resolved to `\\n`) still sizes as TWO lines', () => {
    // Model the post-finalizeDisplay state: `\n` already a real newline.
    expect(size('aaa\nbbb').height).toBeGreaterThan(size('single').height);
    expect(size('aaa\nbbb').height).toBe(size('a\nb').height);
  });

  it('a non-newline codepoint measures as its decoded glyph (output-neutral)', () => {
    // `x<U+221E>y` must measure exactly as `x∞y` — the sizer decodes per-line,
    // so the 8-char token does NOT inflate the width.
    expect(size(`x<U+221E>y`).width).toBe(size(`x${INFINITY}y`).width);
  });

  it('a `&#NNN;` entity also decodes per-line before measuring', () => {
    // &#65; -> 'A'
    expect(size('&#65;').width).toBe(size('A').width);
  });
});
