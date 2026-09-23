/**
 * Unit tests for `class-scale-geo-note.ts` (cdd-T29, D4) — covers the
 * `lineAtoms`/`lineHeights`/`lineDividers`/`lineTables`/`tipRequest`/
 * `opale` optional fields `class-scale-geo.test.ts`'s "note leaves"
 * describe block doesn't reach (kept to this project's 90/90/90 coverage
 * floor). None of T29's seven named fixtures carry a note (module header).
 */
import { describe, it, expect } from 'vitest';
import { scaleNoteGeo } from '../../../src/diagrams/class/class-scale-geo-note.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';
import type { MemberRenderAtom } from '../../../src/diagrams/class/class-member-creole.js';

const textAtom: MemberRenderAtom = {
  kind: 'text',
  text: 'hi',
  font: { family: 'sans-serif', size: 10, color: null, styles: new Set() },
  width: 12,
};

function makeNote(overrides?: Partial<NoteGeo>): NoteGeo {
  return {
    id: 'n1',
    kind: 'note',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    lines: ['hi'],
    lineWidths: [10],
    connector: [],
    ...overrides,
  };
}

describe('scaleNoteGeo — lineAtoms/lineHeights', () => {
  it('scales every atom in lineAtoms and every lineHeights entry', () => {
    const note = makeNote({ lineAtoms: [[textAtom]], lineHeights: [10] });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.lineAtoms).toEqual([[{ ...textAtom, font: { ...textAtom.font, size: 20 }, width: 24 }]]);
    expect(scaled.lineHeights).toEqual([20]);
  });
});

describe('scaleNoteGeo — lineDividers', () => {
  it('scales a present divider including its dash pattern', () => {
    const note = makeNote({
      lineDividers: [{ dividerYOffset: 2, strokeWidth: 1, strokeDasharray: '1,2', doubleLine: true }],
    });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.lineDividers).toEqual([{ dividerYOffset: 4, strokeWidth: 2, strokeDasharray: '2,4', doubleLine: true }]);
  });

  it('preserves an undefined divider slot', () => {
    const note = makeNote({ lineDividers: [undefined] });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.lineDividers).toEqual([undefined]);
  });

  it('scales a divider with no dash pattern', () => {
    const note = makeNote({ lineDividers: [{ dividerYOffset: 2, strokeWidth: 1 }] });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.lineDividers).toEqual([{ dividerYOffset: 4, strokeWidth: 2 }]);
  });
});

describe('scaleNoteGeo — lineTables', () => {
  it('scales colBounds/rowBounds/cells, including cell atoms', () => {
    const note = makeNote({
      lineTables: [
        {
          colBounds: [0, 10],
          rowBounds: [0, 5],
          lineColor: '#000',
          cells: [{ col: 0, row: 0, lines: [{ y: 1, atoms: [textAtom] }] }],
        },
      ],
    });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.lineTables).toEqual([
      {
        colBounds: [0, 20],
        rowBounds: [0, 10],
        lineColor: '#000',
        cells: [{ col: 0, row: 0, lines: [{ y: 2, atoms: [{ ...textAtom, font: { ...textAtom.font, size: 20 }, width: 24 }] }] }],
      },
    ]);
  });

  it('preserves an undefined table slot', () => {
    const note = makeNote({ lineTables: [undefined] });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.lineTables).toEqual([undefined]);
  });
});

describe('scaleNoteGeo — tipRequest and opale', () => {
  it('scales tipRequest baselineOffset/rowHeight', () => {
    const note = makeNote({ tipRequest: { member: 'x', position: 'right', baselineOffset: 3, rowHeight: 14 } });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.tipRequest).toEqual({ member: 'x', position: 'right', baselineOffset: 6, rowHeight: 28 });
  });

  it('scales opale pp1/pp2', () => {
    const note = makeNote({ opale: { direction: 'left', pp1: { x: 1, y: 2 }, pp2: { x: 3, y: 4 } } });
    const scaled = scaleNoteGeo(note, 2);
    expect(scaled.opale).toEqual({ direction: 'left', pp1: { x: 2, y: 4 }, pp2: { x: 6, y: 8 } });
  });
});
