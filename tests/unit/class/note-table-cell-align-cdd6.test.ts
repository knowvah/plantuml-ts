/**
 * cdd6 T3f (colede-79-give418): a creole-table cell's `<r>` marker
 * (`StripeTable.java:147-150` -> `StripeSimple#setCellAlignment(RIGHT)`)
 * shifts a single-line cell right by `cellWidth - dimCell.width`
 * (`AtomTable.java:117-138`). Expected numbers are the jar's own
 * (`test-results/dot-cache/unknown/colede-79-give418/in.svg`, note
 * `deepCSS1` at x=138.37, y=6).
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { renderNote } from '../../../src/diagrams/class/renderer-note.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout-types.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();
const theme = scaleClassTheme(defaultTheme, 1);

function geoAt(text: string, x: number, y: number): NoteGeo {
  const m = measureNote(text, defaultTheme, measurer);
  return { id: 'n', kind: 'note', x, y, ...m, connector: [] };
}

/** `<text x=.. y=..>content` triples in document order. */
function texts(svg: string): string[] {
  return [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</g)].map((m) => `${m[1]!},${m[2]!} ${m[3]!}`);
}

describe('note table cell alignment', () => {
  it('right-aligns a single-line <r> cell inside its column (colede deepCSS1)', () => {
    const svg = renderNote(
      geoAt('|= <#white> Husky / Yorkie |= Foo |\n|<#gainsboro><r> SourceTree1 | foo1 |', 138.37, 6),
      theme,
    );
    expect(texts(svg)).toEqual([
      '144.37,23.111 Husky / Yorkie',
      '220.989,23.111 Foo',
      '145.832,36.111 SourceTree1',
      '220.989,36.111 foo1',
    ]);
  });

  it('leaves an unmarked cell flush left', () => {
    const svg = renderNote(geoAt('|= Husky / Yorkie |\n|<#gainsboro> SourceTree2 |', 138.37, 6), theme);
    expect(texts(svg)[1]).toBe('144.37,36.111 SourceTree2');
  });

  it('shifts a multi-line cell line inside the cell, not the column; <c>/<l> follow StripeSimple', () => {
    // Jar probe (1.2026.8beta1, oracle-render.sh): note at (7, 7). `<r> a`
    // above a wider line shifts by maxWidth - its width (SheetBlock1.java:
    // 160-170); single-line `<c>` has no AtomTable shift (only RIGHT,
    // AtomTable.java:128-133); `<r>r` shifts to the column's right edge;
    // `<l><r>lr` strips only `<l>` (StripeSimple.java:168-197).
    const text =
      '|<r> a\\nlonger line | x |\n| wide wide wide cell | y |\n|<c> mid | z |\n|<r>r | q |\n|<l><r>lr | w |';
    expect(texts(renderNote(geoAt(text, 7, 7), theme))).toEqual([
      '62.238,24.111 a',
      '13,37.111 longer line',
      '113.019,24.111 x',
      '13,50.111 wide wide wide cell',
      '113.019,50.111 y',
      '13,63.111 mid',
      '113.019,63.111 z',
      '108.712,76.111 r',
      '113.019,76.111 q',
      '13,89.111 &lt;r>lr',
      '113.019,89.111 w',
    ]);
  });
});
