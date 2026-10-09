/**
 * cdd6 T3f (nuveji-19-jabi587 (c)): a note body's TITLED block separator
 * (`==Title==`, `--Another title--`). `BodyEnhancedAbstract.java:114-120`
 * wraps the following block in `withMargin(block, 0, 6, titleH/2, 4)` +
 * `TextBlockLineBefore(..., title)` + an outer `titleH/2` top margin;
 * `TextBlockLineBefore.java:87-101` draws the block FIRST, then
 * `UHorizontalLine.infinite(th, 1, 1, title, sep)`, whose
 * `drawLineInternal` (`UHorizontalLine.java:84-98`) draws the first half,
 * the centred title (`drawTitleInternal`, `y - titleH/2 - 0.5`), then the
 * second half. Every expected number is the jar's own
 * (`test-results/dot-cache/unknown/nuveji-19-jabi587/in.svg`, re-captured
 * under oracle seam #4 v2 -- the note is wider now that its spaces count --
 * the note at x=237.26, y=39).
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
const NUVEJI_NOTE =
  'This is working also in notes\nYou can also add title in all these lines\n==Title==\n--Another title--';
const NOTE_X = 237.26;
const NOTE_Y = 39;

function nuvejiGeo(text: string = NUVEJI_NOTE): NoteGeo {
  const m = measureNote(text, defaultTheme, measurer);
  return {
    id: 'n',
    kind: 'note',
    x: NOTE_X,
    y: NOTE_Y,
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

/** `<line>` / `<text>` markup in document order, reduced to its coordinates. */
function drawn(svg: string): string[] {
  return [
    ...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)"|<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)</g),
  ].map((m) => (m[1] !== undefined ? `line ${m[1]},${m[2]}-${m[3]}` : `text ${m[4]},${m[5]} ${m[6]!}`));
}

describe('note titled block separator (nuveji-19-jabi587)', () => {
  it('keeps the jar note size 241.35 x 75', () => {
    const geo = nuvejiGeo();
    expect(geo.width).toBeCloseTo(241.35, 3);
    expect(geo.height).toBe(75);
  });

  it('draws both titled separators at the jar positions, in the jar order', () => {
    expect(drawn(renderNote(nuvejiGeo(), theme))).toEqual([
      'text 243.26,54.111 This is working also in notes',
      'text 243.26,67.111 You can also add title in all these lines',
      'line 238.26,76.5-345.626',
      'line 238.26,78.5-345.626',
      'text 345.626,79.611 Title',
      'line 370.244,76.5-477.61',
      'line 370.244,78.5-477.61',
      'line 238.26,96-323.282',
      'text 323.282,99.111 Another title',
      'line 392.588,96-477.61',
    ]);
  });

  it('draws a titled block content BEFORE its separator line (TextBlockLineBefore.java:90-100)', () => {
    const order = drawn(renderNote(nuvejiGeo('a\n--T--\nb'), theme)).map((d) =>
      d.startsWith('text') ? `text${d.slice(d.lastIndexOf(' '))}` : 'line',
    );
    expect(order).toEqual(['text a', 'text b', 'line', 'text T', 'line']);
  });
});
