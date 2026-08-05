/**
 * A2s R2d (pejone-71-tige404 / xonamo-50-podo529): blank lines inside an
 * ENHANCED `{}` body each render as one standard-height empty row.
 *
 * Upstream mechanism: `BodierLikeClassOrObject#getBody`'s enhanced branch
 * feeds `BodyFactory.create1` the output of `rawBodyWithoutHidden()`
 * (cucadiagram/BodierLikeClassOrObject.java:191-205), which keeps EVERY raw
 * line — blank included — as a `Member`; `BodyEnhanced1#getArea`
 * (cucadiagram/BodyEnhanced1.java:159-166) adds each non-separator line to
 * the current block's display, and `MethodsOrFieldsArea
 * #calculateDimensionOnlyMembers` (cucadiagram/MethodsOrFieldsArea.java:161-166)
 * sums one row height per display line. The classic-body empties filtering
 * (`getFieldsToDisplay`/`getMethodsToDisplay`, java:114-172 — F-A's
 * parser.ts port) is NEVER consulted on this path.
 *
 * jar-verified (deterministic-text probes, scratch R2d):
 *  - trailing blank in the last block: +0.194444in (exactly one 14px row)
 *  - blank between two fields inside a divider block: same +1 row
 *  - no blank: byte-exact (delta 0) before and after.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { EnhancedBodyPart } from '../../../src/diagrams/class/class-body-enhanced-layout.js';

const measurer = new WidthTableMeasurer();
const theme = defaultTheme;

/** Preserves blank lines — the subject under test. */
function src(lines: string[]): UmlSource {
  return { lines, type: 'class' };
}

function rowsParts(parts: readonly EnhancedBodyPart[]): Extract<EnhancedBodyPart, { kind: 'rows' }>[] {
  return parts.filter((p): p is Extract<EnhancedBodyPart, { kind: 'rows' }> => p.kind === 'rows');
}

function layoutOne(lines: string[]) {
  const geo = layoutClass(parseClass(src(lines)), theme, measurer);
  const c = geo.classifiers.find((cl) => cl.id === 'A')!;
  expect(c.enhancedBody).toBeDefined();
  return c;
}

describe('enhanced-body blank rows (A2s R2d)', () => {
  const noBlank = ['class A {', '  .. Fields ..', '- x: int', '  .. Methods ..', '+f()', '}'];

  it('a trailing blank line in the last block adds exactly one member-row height', () => {
    const withBlank = ['class A {', '  .. Fields ..', '- x: int', '  .. Methods ..', '+f()', '', '}'];
    const base = layoutOne(noBlank);
    const c = layoutOne(withBlank);
    // The last rows-block gains one row...
    const baseRows = rowsParts(base.enhancedBody!.parts).at(-1)!.rows;
    const rows = rowsParts(c.enhancedBody!.parts).at(-1)!.rows;
    expect(baseRows).toHaveLength(1);
    expect(rows).toHaveLength(2);
    // ...that is empty, width 0, one standard row-pitch below its neighbor.
    expect(rows[1]!.text).toBe('');
    expect(rows[1]!.width).toBe(0);
    const pitch = rows[1]!.y - rows[0]!.y;
    expect(pitch).toBeGreaterThan(0);
    // Total node height grows by exactly that row pitch.
    expect(c.height - base.height).toBeCloseTo(pitch, 6);
  });

  it('a blank line between two fields inside a divider block is one empty row', () => {
    const c = layoutOne(['class A {', '  .. Fields ..', '- x: int', '', '- y: int', '  .. Methods ..', '+f()', '}']);
    const fieldRows = rowsParts(c.enhancedBody!.parts).find((p) => p.rows.some((r) => r.text === 'x: int'))!.rows;
    expect(fieldRows.map((r) => r.text)).toEqual(['x: int', '', 'y: int']);
    // Uniform pitch: the blank row occupies a full slot.
    expect(fieldRows[1]!.y - fieldRows[0]!.y).toBeCloseTo(fieldRows[2]!.y - fieldRows[1]!.y, 6);
  });

  it('a blank row never reserves the visibility icon column for itself', () => {
    const c = layoutOne(['class A {', '  .. Fields ..', 'plain', '', '  .. Methods ..', '+f()', '}']);
    const fieldRows = rowsParts(c.enhancedBody!.parts).find((p) => p.rows.some((r) => r.text === 'plain'))!.rows;
    // No explicit-visibility member in the block: indent stays icon-less for
    // every row, blank included.
    expect(new Set(fieldRows.map((r) => r.indent)).size).toBe(1);
    expect(fieldRows[1]!.visibilityIcon).toBeUndefined();
  });

  it('a body with no blank lines is unchanged (regression guard)', () => {
    const c = layoutOne(noBlank);
    const all = rowsParts(c.enhancedBody!.parts).flatMap((p) => p.rows.map((r) => r.text));
    expect(all).toEqual(['x: int', 'f()']);
  });
});
