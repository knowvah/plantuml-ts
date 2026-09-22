/**
 * Colocated tests for `renderer-note-lines.ts` + the T10 wiring fix in
 * `renderer-note.ts#renderNoteText`. Every geometric expectation is either
 * lifted verbatim from the jar's real golden SVG
 * (`plans/class-divergence-drive/measurements/out/{sodizo-26-salo123,
 * jovigo-38-tuni063}.jar.svg`) or derived from `measureNote`'s own output,
 * never hand-fitted. The child-ORDER assertions are the regression test
 * for the wiring-fix bug: a first attempt appended every row's divider/
 * table markup once, after the whole note's text, which cannot reproduce
 * the jar's real interleaved order (`BodyEnhancedAbstract.java:107-121`).
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { renderNote, renderPlainNote, renderTipNote } from '../../../src/diagrams/class/renderer-note.js';
import { renderNoteRowExtra } from '../../../src/diagrams/class/renderer-note-lines.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout-types.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const NOTE_BASELINE_OFFSET = 13 - 13 / 4.5; // theme default note font size 13

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

/** The ordered SVG tag sequence a string carries (`<text `/`<line `/
 *  `<path `), for asserting DOCUMENT ORDER rather than mere presence. */
function tagSequence(svg: string): string[] {
  return [...svg.matchAll(/<(text|line|path)[ /]/g)].map((m) => m[1]!);
}

describe('renderNoteText wiring fix — row-order interleave (sodizo-26-salo123)', () => {
  const SODIZO_LINES = 'A0\nA\n----\nB\nloop\nC\nloop\nA\n----\nB\nloop\nC\nloop\nA1';

  it('matches the jar exact child order: path path text text line text x5 line text x5', () => {
    const geo = geoAt(SODIZO_LINES, 6, 6);
    const svg = renderNote(geo, defaultTheme);
    expect(tagSequence(svg)).toEqual([
      'path',
      'path',
      'text',
      'text',
      'line',
      'text',
      'text',
      'text',
      'text',
      'text',
      'line',
      'text',
      'text',
      'text',
      'text',
      'text',
    ]);
  });

  it('draws each <line> at the exact jar x1/y1/x2/y2 (interleaved, not appended)', () => {
    const geo = geoAt(SODIZO_LINES, 6, 6);
    const svg = renderNote(geo, defaultTheme);
    expect(svg).toContain('<line x1="7" y1="37" x2="50.619" y2="37" stroke="#181818" stroke-width="1"/>');
    expect(svg).toContain('<line x1="7" y1="110" x2="50.619" y2="110" stroke="#181818" stroke-width="1"/>');
  });

  it('renderPlainNote returns 3 entityParts (body, fold, text) -- extras are INSIDE the text part, not a 4th', () => {
    const geo = geoAt('a\n--\nb', 0, 0);
    const built = renderPlainNote(geo, defaultTheme);
    expect(built.entityParts).toHaveLength(3);
    expect(built.entityParts[2]).toContain('<line');
  });

  it('produces no extra markup for a note with no separator/table row', () => {
    const geo = geoAt('plain text', 0, 0);
    expect(renderNote(geo, defaultTheme)).not.toContain('<line');
  });
});

describe('renderNoteText wiring fix — member-tip note (fomofi-36-lova857)', () => {
  it('renderTipNote interleaves the divider too, not just renderPlainNote', () => {
    // fomofi's note is a resolved member-tip (`note left of X::a`), drawn
    // via `renderTipNote` -- a DIFFERENT call site from `renderPlainNote`,
    // both sharing the same `renderNoteText`. Confirmed directly (not just
    // "shared code, must work") since this is a real regression surface:
    // the wiring bug this task fixes affected `renderTipNote`'s call site
    // too (coordinator's report: "the tip path now emits the <line> but
    // AFTER all text").
    const geo = geoAt('no "--" may be used here\n--\nto draw horizontal line', 0, 0);
    const tip = { direction: 'left' as const, pp1: { x: 0, y: 10 }, pp2: { x: -5, y: 15 } };
    const svg = renderTipNote(geo, tip, defaultTheme);
    const seq = tagSequence(svg);
    // outline path, corner path (renderTipNote's own 2 leading shapes),
    // text (line1), line (divider), text (line2) -- interleaved, not
    // appended after every row.
    expect(seq.slice(0, 5)).toEqual(['path', 'path', 'text', 'line', 'text']);
  });
});

describe('renderNoteText wiring fix — creole table (jovigo-38-tuni063)', () => {
  const JOVIGO = '| A         | B   |\n| --------- | --- |\n| P(C\\|D)   | E   |';

  it('matches the jar exact child order: path path text x8 line x7 (cells before grid)', () => {
    const geo = geoAt(JOVIGO, 82.94, 6);
    const svg = renderNote(geo, defaultTheme);
    expect(tagSequence(svg)).toEqual([
      'path',
      'path',
      ...Array<'text'>(8).fill('text'),
      ...Array<'line'>(7).fill('line'),
    ]);
  });

  it('draws the jar-exact grid lines and cell text', () => {
    const geo = geoAt(JOVIGO, 82.94, 6);
    const svg = renderNote(geo, defaultTheme);
    expect(svg).toContain('<line x1="88.94" y1="13" x2="141.428" y2="13" stroke="#000" stroke-width="0.5"/>');
    expect(svg).toContain('<line x1="88.94" y1="52" x2="141.428" y2="52" stroke="#000" stroke-width="0.5"/>');
    expect(svg).toContain('<line x1="88.94" y1="13" x2="88.94" y2="52" stroke="#000" stroke-width="0.5"/>');
    expect(svg).toContain('<text x="88.94" y="23.111" font-size="13" fill="#000">A</text>');
    expect(svg).toContain('<text x="128.509" y="23.111" font-size="13" fill="#000">B</text>');
    expect(svg).toContain('<text x="88.94" y="49.111" font-size="13" fill="#000" textLength="39.569">P(C|D)</text>');
  });

  it('draws the markdown-separator row as struck creole text, not a skipped row', () => {
    const geo = geoAt(JOVIGO, 82.94, 6);
    const svg = renderNote(geo, defaultTheme);
    expect(svg).toContain(
      '<text x="88.94" y="36.111" font-size="13" fill="#000" text-decoration="line-through">-</text>',
    );
  });
});

describe('renderNoteRowExtra — primitives', () => {
  it('produces empty string for a row with neither a divider nor a table', () => {
    const geo = geoAt('plain text', 0, 0);
    expect(renderNoteRowExtra(geo, 0, 0, NOTE_BASELINE_OFFSET, defaultTheme)).toBe('');
  });

  it('dashes a .. separator and double-draws a == separator', () => {
    const dotted = geoAt('a\n..\nb', 0, 0);
    const dottedRow = dotted.lineDividers?.findIndex((d) => d !== undefined) ?? -1;
    expect(dottedRow).toBeGreaterThanOrEqual(0);
    const dottedSvg = renderNoteRowExtra(dotted, 0, dottedRow, NOTE_BASELINE_OFFSET, defaultTheme);
    expect(dottedSvg).toContain('stroke-dasharray="1,2"');

    const doubled = geoAt('a\n==\nb', 0, 0);
    const doubledRow = doubled.lineDividers?.findIndex((d) => d !== undefined) ?? -1;
    const doubledSvg = renderNoteRowExtra(doubled, 0, doubledRow, NOTE_BASELINE_OFFSET, defaultTheme);
    expect(doubledSvg.match(/<line /g)).toHaveLength(2); // one row, drawn TWICE
  });
});
