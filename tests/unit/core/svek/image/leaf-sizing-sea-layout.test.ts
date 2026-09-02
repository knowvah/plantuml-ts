/**
 * `leaf-sizing-text.ts#leafTextLineLayout` — SI30 T3's class-facing seam
 * (`decisions.md#D1/#D2/#D3`): per-atom effective size + `Sea` baseline
 * offset, plus the line's own `Sea` height.
 *
 * TDD: written before the implementation. Every expectation is derived from
 * the injected measurer and the cited upstream rule, never captured.
 */
import { describe, it, expect } from 'vitest';
import { leafTextLineLayout, lineCount } from '../../../../../src/core/svek/image/leaf-sizing-text.js';
import { layoutLineThroughSea } from '../../../../../src/core/svek/image/creole-sea-line.js';
import { WidthTableMeasurer } from '../../../../../src/core/measurer.js';
import type { FontSpec } from '../../../../../src/core/measurer.js';

/** The class engine's own default member font size (`skinparam
 *  classAttributeFontSize`, 12) — the size that makes a `<sup>` mute BELOW
 *  `AtomText.java:178-179`'s 10px floor, which is the case this seam has to
 *  get right for `exposant-01-class`. */
const classFont: FontSpec = { family: 'Helvetica', size: 12 };
const measurer = new WidthTableMeasurer();
const descent = (size: number): number => measurer.getDescent({ family: 'Helvetica', size }, 'x');

describe('leafTextLineLayout', () => {
  it('all-NORMAL line: width = Σ atom widths, height = tallest atom box, every dy 0 (the identity this task must preserve for class text)', () => {
    for (const line of ['member', '**bold** text', '<size:20>big</size> small']) {
      const layout = leafTextLineLayout(line, classFont, measurer);
      const sizes = layout.placements.map((p) => p.size);
      const widths = layout.atoms.map((a, i) =>
        a.kind === 'text' ? measurer.measure(a.text, { ...classFont, size: sizes[i]! }).width : 0,
      );

      expect(layout.width).toBeCloseTo(
        widths.reduce((a, b) => a + b, 0),
        10,
      );
      expect(layout.height).toBeCloseTo(Math.max(...sizes.map((s) => Math.max(s, 10))), 10);
      for (const p of layout.placements) expect(p.dy).toBe(0);
    }
  });

  it('exposant-01-class member `x<sup>2</sup>` at font 12: the sup measures at 9 (FontPosition.java:51-60) and the line grows to the raised box (Sea.java:72-80)', () => {
    const layout = leafTextLineLayout('x<sup>2</sup>', classFont, measurer);

    expect(layout.placements.map((p) => p.size)).toEqual([12, 9]);
    expect(layout.width).toBeCloseTo(
      measurer.measure('x', classFont).width + measurer.measure('2', { ...classFont, size: 9 }).width,
      10,
    );
    // The sup's box is FLOORED at 10 (`AtomText.java:178-179`) even though
    // it draws at 9, so the raised atom's own minY is -(10) + (-6) = -16.
    expect(layout.height).toBeCloseTo(Math.max(12, 10 + 6), 10);
    expect(layout.placements[0]!.dy).toBe(0);
    // Draw baseline (`AtomText.java:213-215`) inside that floored box: the
    // -1 beyond the plain `-6 - d(9) + d(12)` raise IS the floor.
    expect(layout.placements[1]!.dy).toBeCloseTo(-6 - descent(9) + descent(12) - 1, 10);
  });

  it('`H<sub>2</sub>O` at font 12: +3 altitude grows the line at the bottom, so the NORMAL atoms carry dy -3 (FontPosition.java:41-49)', () => {
    const layout = leafTextLineLayout('H<sub>2</sub>O', classFont, measurer);

    expect(layout.placements.map((p) => p.size)).toEqual([12, 9, 12]);
    expect(layout.height).toBeCloseTo(12 + 3, 10);
    expect(layout.placements[0]!.dy).toBeCloseTo(-3, 10);
    expect(layout.placements[2]!.dy).toBeCloseTo(-3, 10);
    expect(layout.placements[1]!.dy).toBeGreaterThan(layout.placements[0]!.dy);
  });

  it('nested `<size:20><sup>x</sup></size>` mutes the CASCADED size -> 17 (FontConfiguration.java:98-104)', () => {
    const layout = leafTextLineLayout('<size:20><sup>x</sup></size>', classFont, measurer);
    expect(layout.placements.map((p) => p.size)).toEqual([17]);
    expect(layout.height).toBeCloseTo(17, 10);
  });

  it('an inline atom contributes its own box and no baseline (AtomImg.java:242-244 altitude 0); a non-text atom reports the ambient size', () => {
    const layout = leafTextLineLayout('<$missing>text', classFont, measurer);
    const inlineIndex = layout.atoms.findIndex((a) => a.kind === 'inline');

    expect(inlineIndex).toBeGreaterThanOrEqual(0);
    expect(layout.placements[inlineIndex]!.size).toBe(classFont.size);
    expect(layout.placements[inlineIndex]!.dy).toBe(0);
  });

  it('an EMPTY line still lexes to one blank text atom, so it is measured, not skipped (StripeSimple: a blank stripe is a real stripe)', () => {
    const layout = leafTextLineLayout('', classFont, measurer);

    expect(layout.atoms.map((a) => (a.kind === 'text' ? a.text : a.kind))).toEqual([' ']);
    expect(layout.width).toBe(0); // the deterministic width table's SPACE is 0
    expect(layout.height).toBe(classFont.size);
    expect(layout.placements[0]!.dy).toBe(0);
    // The pre-existing empty-DISPLAY contract (no lines at all) is a
    // different, untouched rule one level up.
    expect(lineCount('')).toBe(0);
  });

  it('an atom-free stripe reports zeros rather than reaching Sea#getHeight, which throws on an empty sea (Sea.java:120-126; SheetBlock1.java:136-137 skips it upstream)', () => {
    const ops = { dim: () => ({ width: 0, height: 0 }), drawHeight: () => 0, descent: () => 0, normalDescent: () => 0 };
    expect(layoutLineThroughSea([], ops)).toEqual({ width: 0, height: 0, dy: [], top: [] });
  });
});
