/**
 * A2s round 2, R2h — bullet-row word wrap counts the Bullet header on EVERY
 * stripe (ponono-25-fevo574 / sumocu-27-vubo674).
 *
 * Upstream's `Fission` seeds the first wrapped stripe with the REAL header
 * atom and every continuation stripe with `blank(header)` (same width), and
 * breaks when `line.getWidth() > valueMaxWidth` — a width that INCLUDES the
 * header. So the text budget is `maxWidth - bulletWidth` for ALL rows, and
 * every wrapped row is indented by the bullet header's width.
 * @see ~/git/plantuml/.../klimt/creole/Fission.java:69-92,120-125
 * @see ~/git/plantuml/.../klimt/creole/atom/Bullet.java:72-76
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
/** `skinparam WrapWidth 300` — style-cascade-class.ts:205 routes it into
 *  `noteCascadeMaximumWidth` for note text. */
const wrapTheme = deepMergeTheme(defaultTheme, {
  colors: { graph: { noteCascadeMaximumWidth: 300 } },
});

/** ponono-25-fevo574 / sumocu-27-vubo674's shared note body (block form). */
const PONONO_NOTE = [
  '* here is a bullet list',
  '* if the sentence before is wrapped then the one after does not follow correctly',
  '* here is a very long sentence which should be wrapped. I can make it even longer by adding more words',
  '',
  '# here is a numbered list',
  '# here is a very long sentence which should be wrapped',
].join('\n');

describe('R2h — Fission counts the Bullet header on every wrapped stripe', () => {
  it('matches the ponono-25/sumocu-27 jar note node width (4.454253in = 320.7062px)', () => {
    // Jar svek DOT: the note node is 4.454253x1.583333in. Width = maxRow +
    // Opale margins (6+15); jar maxRow = 12 (bullet) + 287.7062 (text wrapped
    // at 300-12=288). Pre-fix the port wrapped at the FULL 300 (row 304.5).
    const m = measureNote(PONONO_NOTE, wrapTheme, measurer);
    expect(m.width / 72).toBeCloseTo(4.454253, 4);
    expect(m.height / 72).toBeCloseTo(1.583333, 4);
  });

  it('indents every wrapped continuation row by the bullet width', () => {
    const m = measureNote('* here is a very long sentence which should be wrapped. I can make it even longer by adding more words', wrapTheme, measurer);
    expect(m.lineAtoms.length).toBeGreaterThan(1);
    for (const atoms of m.lineAtoms) {
      // B22/M21: the header is a real `bullet` atom now, not a width-only
      // text spacer. The WIDTH -- what this test is actually about -- is
      // unchanged; only the atom's representation is.
      expect(atoms[0]).toMatchObject({ kind: 'bullet', order: 0, width: 12 });
    }
    // Every row's stored width includes the header (blank(header) on
    // continuations — Fission.java:88-89).
    for (let i = 0; i < m.lineWidths.length; i++) {
      const textWidth = m.lineAtoms[i]!.slice(1).reduce(
        (sum, a) => sum + ('width' in a ? a.width : 0), 0,
      );
      expect(m.lineWidths[i]).toBeCloseTo(12 + textWidth, 3);
    }
  });

  it('keeps the unwrapped (maxWidth <= 0) single-row bullet result unchanged', () => {
    const m = measureNote('* Sjors Kaagman', defaultTheme, measurer);
    const w = measurer.measure('Sjors Kaagman', { family: defaultTheme.fontFamily, size: 13 }).width;
    expect(m.width).toBeCloseTo(12 + w + 21, 4);
    expect(m.lineAtoms).toHaveLength(1);
  });
});
