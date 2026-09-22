/**
 * Colocated tests for `renderer-note-lines.ts` (T10). Every geometric
 * expectation is either lifted verbatim from the jar's real golden SVG
 * (`plans/class-divergence-drive/measurements/out/{sodizo-26-salo123,
 * jovigo-38-tuni063}.jar.svg`) or derived from `measureNote`'s own
 * output, never hand-fitted.
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { renderNoteExtras, renderPlainNoteWithLines } from '../../../src/diagrams/class/renderer-note-lines.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout-types.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();

/** Builds a full `NoteGeo` at the given absolute origin from a real
 *  `measureNote` result — the same field set `note-layout-tip.ts#plainNoteGeo`
 *  copies, so this exercises the SAME data this task threads through
 *  production, not a hand-fitted literal. */
function geoAt(text: string, x: number, y: number): NoteGeo {
  const m = measureNote(text, defaultTheme, measurer);
  return {
    id: 'n',
    kind: 'note',
    x,
    y,
    width: m.width,
    height: m.height,
    lines: m.lines,
    lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    lineDividers: m.lineDividers,
    lineTables: m.lineTables,
    connector: [],
  };
}

describe('renderNoteExtras — block-separator <line> (E13, sodizo-26-salo123)', () => {
  it('draws one <line> at the exact jar x1/y1/x2/y2 for a single -- separator', () => {
    // jar sodizo (isolated to ONE separator): note origin (6,6), box right
    // edge 51.619 -- reproduced here with the SAME two-block shape at the
    // SAME origin/width as the real fixture's first separator.
    const geo = geoAt('A0\nA\n----\nB\nloop\nC\nloop\nA\n----\nB\nloop\nC\nloop\nA1', 6, 6);
    const svg = renderNoteExtras(geo, defaultTheme);
    expect(svg).toContain('<line x1="7" y1="37" x2="50.619" y2="37" stroke="#181818" stroke-width="1"/>');
    expect(svg).toContain('<line x1="7" y1="110" x2="50.619" y2="110" stroke="#181818" stroke-width="1"/>');
    // Exactly 2 <line>s -- matches jar's own count for this note (E13).
    expect(svg.match(/<line /g)).toHaveLength(2);
  });

  it('produces no extras for a note with no separator/table row', () => {
    const geo = geoAt('plain text', 0, 0);
    expect(renderNoteExtras(geo, defaultTheme)).toBe('');
  });

  it('renderPlainNoteWithLines appends the divider markup as one more entityParts entry', () => {
    const geo = geoAt('a\n--\nb', 0, 0);
    const built = renderPlainNoteWithLines(geo, defaultTheme);
    expect(built.entityParts).toHaveLength(4); // body, fold, text, extras
    expect(built.entityParts[3]).toContain('<line');
  });

  it('leaves entityParts unchanged (T8 shape) when there is nothing to add', () => {
    const geo = geoAt('plain text', 0, 0);
    const built = renderPlainNoteWithLines(geo, defaultTheme);
    expect(built.entityParts).toHaveLength(3);
  });

  it('dashes a .. separator and double-draws a == separator', () => {
    const dotted = renderNoteExtras(geoAt('a\n..\nb', 0, 0), defaultTheme);
    expect(dotted).toContain('stroke-dasharray="1,2"');
    const doubled = renderNoteExtras(geoAt('a\n==\nb', 0, 0), defaultTheme);
    expect(doubled.match(/<line /g)).toHaveLength(2); // one row, drawn TWICE
  });
});

describe('renderNoteExtras — creole table grid + cells (jovigo-38-tuni063)', () => {
  const JOVIGO = '| A         | B   |\n| --------- | --- |\n| P(C\\|D)   | E   |';

  it('draws the jar-exact grid (4 horizontal + 3 vertical) and cell text at note origin (6,6)', () => {
    const geo = geoAt(JOVIGO, 82.94, 6);
    const svg = renderNoteExtras(geo, defaultTheme);
    // Grid, horizontal first (AtomTable.ts#drawGrid's own order).
    expect(svg).toContain('<line x1="88.94" y1="13" x2="141.428" y2="13" stroke="#000" stroke-width="0.5"/>');
    expect(svg).toContain('<line x1="88.94" y1="52" x2="141.428" y2="52" stroke="#000" stroke-width="0.5"/>');
    expect(svg).toContain('<line x1="88.94" y1="13" x2="88.94" y2="52" stroke="#000" stroke-width="0.5"/>');
    expect(svg.match(/<line /g)).toHaveLength(7);
    // Header row cells.
    expect(svg).toContain('<text x="88.94" y="23.111" font-size="13" fill="#000">A</text>');
    expect(svg).toContain('<text x="128.509" y="23.111" font-size="13" fill="#000">B</text>');
    // Data row.
    expect(svg).toContain(
      '<text x="88.94" y="49.111" font-size="13" fill="#000" textLength="39.569">P(C|D)</text>',
    );
  });

  it('draws the markdown-separator row as struck creole text, not a skipped row', () => {
    const geo = geoAt(JOVIGO, 82.94, 6);
    const svg = renderNoteExtras(geo, defaultTheme);
    expect(svg).toContain(
      '<text x="88.94" y="36.111" font-size="13" fill="#000" text-decoration="line-through">-</text>',
    );
  });
});
