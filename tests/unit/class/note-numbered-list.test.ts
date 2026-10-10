/**
 * C-2 (ponono-25-fevo574 / sumocu-27-vubo674): `#`-prefixed creole numbered
 * lists in class notes. Upstream: `CreoleStripeSimpleParser.java:71`
 * (`HASH_HEADING_PATTERN`), `StripeStyle.java:56-60`/`legacy/AtomTextUtils
 * .java:145-159` (`createListNumber`). Expected numbers read off the jar
 * golden (`plans/class-divergence-drive-3/diagnosis/C.md`'s own quote):
 * `<text x="12" ... textLength="10.806">2.</text>` then `here` at `26.381`.
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();
const F13 = { family: defaultTheme.fontFamily, size: 13 };
const w = (s: string): number => measurer.measure(s, F13).width;

describe('C-2 — creole numbered lists in notes (StripeStyle LIST_WITH_NUMBER)', () => {
  it('builds a listNumber header atom for "# text" -- "1." at order 0 (dx=0)', () => {
    const m = measureNote('# here is a numbered list', defaultTheme, measurer);
    const header = m.lineAtoms[0]![0];
    expect(header).toMatchObject({
      kind: 'listNumber',
      text: '1.',
      dx: 0,
      textWidth: w('1.'),
    });
    // width = dx(0) + textWidth("1.") + marginRight(".") -- AtomTextUtils
    // .java:146-157. Jar: x=12 (order 0, no indent), textLength for "2." is
    // 10.806, next run starts 14.381 later (26.381 - 12) -- the SAME
    // dx+textWidth+marginRight shape at order 0.
    expect((header as { width: number }).width).toBeCloseTo(w('1.') + w('.'), 4);
  });

  it('numbers consecutive "#" lines sequentially within one block (CreoleContext#getLocalNumber)', () => {
    const m = measureNote('# alpha\n# beta\n# gamma', defaultTheme, measurer);
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'listNumber', text: '1.' });
    expect(m.lineAtoms[1]![0]).toMatchObject({ kind: 'listNumber', text: '2.' });
    expect(m.lineAtoms[2]![0]).toMatchObject({ kind: 'listNumber', text: '3.' });
  });

  it('resets the counter at a block separator (fresh CreoleContext per Sheet/Display, CreoleParser.java:142-145)', () => {
    const m = measureNote('# alpha\n# beta\n--\n# gamma', defaultTheme, measurer);
    expect(m.lines).toEqual(['alpha', 'beta', '--', 'gamma', '']);
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'listNumber', text: '1.' });
    expect(m.lineAtoms[1]![0]).toMatchObject({ kind: 'listNumber', text: '2.' });
    // lineAtoms[2] is the untitled separator's own leading divider row ([]).
    expect(m.lineAtoms[3]![0]).toMatchObject({ kind: 'listNumber', text: '1.' });
  });

  it('matches the jar-quoted geometry for "2." at order 0: x=12, textLength=10.806, next run at 26.381', () => {
    // ponono-25's second numbered line renders "1." then "2." (two separate
    // `#` list items each on their own line) -- reproduce the SECOND item's
    // own header directly via CreoleContext sequencing (order 0, localNumber
    // 1 -> "2.").
    const m = measureNote('# first\n# here', defaultTheme, measurer);
    const header = m.lineAtoms[1]![0] as { text: string; dx: number; textWidth: number; width: number };
    expect(header.text).toBe('2.');
    expect(header.dx).toBe(0);
    expect(header.textWidth).toBeCloseTo(10.80625, 4); // jar textLength="10.806"
    expect(header.width).toBeCloseTo(10.80625 + 3.575, 4); // 14.381 == 26.381-12
  });

  it('does not treat a full-line "# " with no HASH match differently -- classifies on the RAW line', () => {
    // HASH_HEADING_PATTERN requires at least one char after the `#`+ run;
    // a bare "#" alone (zero corpus reach either way) is out of scope here,
    // matching matchBulletLine's own "**bold**" non-match precedent.
    const m = measureNote('#', defaultTheme, measurer);
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'text', text: '#' });
  });
});

describe('C-2 — nested numbered lists (order > 0 indent)', () => {
  it('indents a "##" (order 1) header by width("9. ") * 1', () => {
    const m = measureNote('## nested', defaultTheme, measurer);
    const header = m.lineAtoms[0]![0] as { dx: number; text: string };
    expect(header.text).toBe('1.');
    expect(header.dx).toBeCloseTo(w('9. '), 4);
  });
});
