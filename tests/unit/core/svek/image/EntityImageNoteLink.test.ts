/**
 * Unit tests for the shared `EntityImageNoteLink` port
 * (`core/svek/image/EntityImageNoteLink.ts`, `shared-seam-extraction` T6).
 *
 * The fontFamily-only call shape (no `pureText` strategy) is the state
 * engine's former call -- `state-dot-graph.ts`/`state-composite-edge-label
 * .ts` each used to build this dimension privately via a raw `\n` split +
 * flat `measurer.measure` per line, then the SAME Opale/Rose padding this
 * module now applies via `roseNoteDim`. Pinned against `fotigo-12-gufu949`
 * (`test-results/dot-cache/state/fotigo-12-gufu949/in.puml`), whose two
 * `note on link` bodies are "Should be red" / "Should be blue" at the note
 * font (13pt, `sans-serif` -- `defaultTheme.fontFamily`) -- the SAME
 * fixture `state-dot-graph.ts`'s own former doc comment cited (oracle
 * `WIDTH="104"`/`WIDTH="110"`, `HEIGHT="33"` both, after the DOT-gate's own
 * `Math.floor`, which this test does not apply -- it pins the RAW
 * `measureLinkNoteDim` output the DOT gate floors downstream).
 *
 * Expected numbers are DERIVED from the real `WidthTableMeasurer` + the same
 * formula this module's own doc comment cites as state's former one --
 * never fitted literals (mirrors `class-note-link-label.test.ts`'s own
 * convention).
 */
import { describe, it, expect } from 'vitest';
import { measureLinkNoteDim } from '../../../../../src/core/svek/image/EntityImageNoteLink.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import { NOTE_FONT_SIZE } from '../../../../../src/core/klimt/font/FontParam.js';
import { OPALE_MARGIN_X1, OPALE_MARGIN_X2, OPALE_MARGIN_Y } from '../../../../../src/core/svek/image/Opale.js';

const measurer = new WidthTableMeasurer();
const FONT_FAMILY = 'sans-serif';
/** `Rose.java:65-66` -- `paddingX`/`paddingY`, both 5. */
const ROSE_NOTE_PADDING = 5;

/** State's own former formula (`state-dot-graph.ts:172-181`'s pre-T6 body),
 *  reproduced here from the SAME cited constants so the pin below asserts
 *  independently of the port rather than re-deriving it. */
function stateFormerDim(text: string): { width: number; height: number } {
  const font = { family: FONT_FAMILY, size: NOTE_FONT_SIZE };
  const lines = text.split('\n');
  let maxW = 0;
  for (const ln of lines) maxW = Math.max(maxW, measurer.measure(ln, font).width);
  return {
    width: maxW + OPALE_MARGIN_X1 + OPALE_MARGIN_X2 + 2 * ROSE_NOTE_PADDING,
    height: lines.length * NOTE_FONT_SIZE + 2 * OPALE_MARGIN_Y + 2 * ROSE_NOTE_PADDING,
  };
}

describe('measureLinkNoteDim -- fontFamily-only shape (state engine, no pureText strategy)', () => {
  it('fotigo-12-gufu949 "Should be red": byte-identical to the former state formula', () => {
    const expected = stateFormerDim('Should be red');
    const actual = measureLinkNoteDim('Should be red', { family: FONT_FAMILY }, measurer);
    expect(actual).toEqual(expected);
    expect(Math.floor(actual.width)).toBe(104); // oracle svek-1.dot WIDTH="104"
    expect(actual.height).toBe(33); // oracle svek-1.dot HEIGHT="33"
  });

  it('fotigo-12-gufu949 "Should be blue": byte-identical to the former state formula', () => {
    const expected = stateFormerDim('Should be blue');
    const actual = measureLinkNoteDim('Should be blue', { family: FONT_FAMILY }, measurer);
    expect(actual).toEqual(expected);
    expect(Math.floor(actual.width)).toBe(110); // oracle svek-1.dot WIDTH="110"
    expect(actual.height).toBe(33); // oracle svek-1.dot HEIGHT="33"
  });
});

describe('measureLinkNoteDim -- pureText strategy override', () => {
  it('routes through the supplied strategy instead of the naive split, then pads identically', () => {
    const pureText = (): { width: number; height: number } => ({ width: 50, height: 20 });
    const actual = measureLinkNoteDim('ignored', { family: FONT_FAMILY }, measurer, pureText);
    expect(actual).toEqual({
      width: 50 + OPALE_MARGIN_X1 + OPALE_MARGIN_X2 + 2 * ROSE_NOTE_PADDING,
      height: 20 + 2 * OPALE_MARGIN_Y + 2 * ROSE_NOTE_PADDING,
    });
  });
});
