import { describe, it, expect } from 'vitest';
import { renderNote, renderPlainNote } from '../../../src/diagrams/class/renderer-note.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import { FontStyle } from '../../../src/core/klimt/shape/UText.js';
import {
  buildMemberAtoms,
  resolveMemberAtoms,
  memberBaseFont,
  type MemberRenderAtom,
} from '../../../src/diagrams/class/class-member-creole.js';
import { noteLineAtomDy } from '../../../src/diagrams/class/class-member-creole-sea.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

const theme = scaleClassTheme(defaultTheme, 1);

const baseNote: NoteGeo = {
  id: '__note_0',
  kind: 'note',
  x: 0,
  y: 0,
  width: 40,
  height: 23,
  lines: ['l1', 'l2'],
  lineWidths: [10, 8],
  connector: [],
};

// cdd-T8 (A5/M2): body is a `<path>` in `Opale.getPolygonNormal`'s vertex
// order (`Opale.java:149-167`), stroke-width 0.5; the fold is a CLOSED
// `<path>` (`Opale.getCorner`, `Opale.java:134-147`) filled with the note's
// own background at stroke-width 1 (the diagram default, not the note
// style's 0.5) -- `EntityImageNote.java:275-289`. `baseNote`: x=0 y=0 w=40
// h=23, cornersize=10.
describe('renderNote / renderPlainNote — body vertex order and fold paint (cdd-T8, A5/M2)', () => {
  it("draws the body as a <path> with getPolygonNormal's exact vertex order and stroke-width 0.5", () => {
    const svg = renderNote(baseNote, theme);
    expect(svg).toContain(
      '<path d="M0,0 L0,23 L40,23 L40,10 L30,0 L0,0" fill="#FEFFDD" stroke="#181818" stroke-width="0.5"/>',
    );
    expect(svg).not.toContain('<polygon');
  });

  it('draws the fold as a closed <path> (getCorner) with the note background fill and stroke-width 1', () => {
    const svg = renderNote(baseNote, theme);
    expect(svg).toContain('<path d="M30,0 L30,10 L40,10 L30,0" fill="#FEFFDD" stroke="#181818" stroke-width="1"/>');
  });

  it('never fills the fold with none', () => {
    const svg = renderNote(baseNote, theme);
    // Isolate the fold element (the second <path ... fill=...> after body).
    const foldMatch = svg.match(/<path d="M30,0[^/]*\/>/);
    expect(foldMatch).not.toBeNull();
    expect(foldMatch![0]).not.toContain('fill="none"');
  });

  it('uses the resolved note background (not the hardcoded default) for both body and fold when overridden', () => {
    const coloredNote: NoteGeo = { ...baseNote, color: '#FF0000' };
    const svg = renderNote(coloredNote, theme);
    // Rule 2 (`svg.ts#resolvePaint`) shortens `#FF0000` -> `#F00` at emission.
    const fills = [...svg.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]);
    expect(fills[0]).toBe('#F00');
    expect(fills[1]).toBe('#F00');
  });

  it('renderPlainNote returns only entityParts (body, fold, text) -- no connector shape at all', () => {
    const result = renderPlainNote(baseNote, theme);
    expect('connector' in result).toBe(false);
    expect(result.entityParts).toHaveLength(3);
    expect(result.entityParts[0]).toContain('M0,0 L0,23 L40,23 L40,10 L30,0 L0,0');
    expect(result.entityParts[1]).toContain('M30,0 L30,10 L40,10 L30,0');
  });

  // cdd-T9b: a note's host connector is a completely separate upstream
  // `Link` (`CommandFactoryNoteOnEntity.java:342`), never the note's own
  // `NOTE_STROKE_WIDTH`/`'4 4'` style -- `renderPlainNote`/`renderNote` no
  // longer build it at all, regardless of `note.connector` geometry (see
  // `renderer-note-connector.ts#renderNoteConnectorPath` for where it now
  // lives). This replaces the pre-T9b tests asserting `renderPlainNote`
  // returned a `'4 4'`-dashed connector string.
  it('renderPlainNote ignores note.connector geometry entirely -- entityParts never carry a dashed connector', () => {
    const anchored: NoteGeo = {
      ...baseNote,
      connector: [
        { x: 40, y: 10 },
        { x: 60, y: 10 },
      ],
    };
    const result = renderPlainNote(anchored, theme);
    expect('connector' in result).toBe(false);
    expect(result.entityParts).toHaveLength(3);
    for (const part of result.entityParts) {
      expect(part).not.toContain('stroke-dasharray');
    }
  });

  it('renderNote draws only the box+text, never a connector, even when note.connector is non-empty', () => {
    const anchored: NoteGeo = {
      ...baseNote,
      connector: [
        { x: 40, y: 10 },
        { x: 60, y: 10 },
      ],
    };
    const svg = renderNote(anchored, theme);
    expect(svg).not.toContain('stroke-dasharray');
    expect(svg).toContain('M0,0 L0,23');
  });
});

// G2 N39: `<style> note { FontSize N }` / `skinparam noteFontSize N` --
// jar-verified `xokipa-29-rafu481`. `theme.colors.elements['note'].fontSize`
// is ALREADY populated by the pre-existing generic bucket mechanism
// (`ELEMENT_BUCKET_SNAMES`, G2 N34); this only wires the consuming side.
describe('renderNote — theme-overridden note fontSize (G2 N39)', () => {
  it('draws every text row at the theme-overridden fontSize, not the hardcoded default 13', () => {
    const overridden = scaleClassTheme(
      { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { note: { fontSize: 10 } } } },
      1,
    );
    const svg = renderNote(baseNote, overridden);
    expect(svg).toContain('font-size="10"');
    expect(svg).not.toContain('font-size="13"');
  });

  it('falls back to the hardcoded default 13 when no note fontSize override is set', () => {
    const svg = renderNote(baseNote, theme);
    expect(svg).toContain('font-size="13"');
  });

  it('spaces stacked lines by the OVERRIDDEN fontSize, not the hardcoded default', () => {
    const overridden = scaleClassTheme(
      { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { note: { fontSize: 10 } } } },
      1,
    );
    const svg = renderNote(baseNote, overridden);
    const ys = [...svg.matchAll(/<text x="[^"]*" y="([^"]*)"/g)].map((m) => Number(m[1]));
    expect(ys).toHaveLength(2);
    // baselineOffset = 10 - 10/4.5; row i's y = note.y + marginY + i*fontSize + baselineOffset.
    const baselineOffset = 10 - 10 / 4.5;
    expect(ys[1]! - ys[0]!).toBeCloseTo(10, 2);
    expect(ys[0]).toBeCloseTo(5 + baselineOffset, 2);
  });
});

// G2 N55: `note.lineAtoms` present -> per-RUN creole atom rendering, one
// `<text>` per styled run, x-advancing by each atom's OWN measured width --
// the note-local mirror of `renderer-classifier-box.test.ts`'s member-row
// atom coverage (G2 N22). `baseNote` above (no `lineAtoms`) proves the
// FALLBACK path stays byte-identical to pre-cutover behavior; this block
// proves the NEW per-atom path.
describe('renderNote — per-run creole atom rendering (G2 N55)', () => {
  const plainFont = { family: 'sans-serif', size: 13, color: null, styles: new Set<FontStyle>() };
  const boldFont = { family: 'sans-serif', size: 13, color: null, styles: new Set([FontStyle.BOLD]) };

  const boldNote: NoteGeo = {
    id: '__note_0',
    kind: 'note',
    x: 0,
    y: 0,
    width: 80,
    height: 23,
    lines: ['Yet another'],
    lineWidths: [70],
    lineAtoms: [
      [
        { kind: 'text', text: 'Yet ', font: plainFont, width: 20 } satisfies MemberRenderAtom,
        { kind: 'text', text: 'another', font: boldFont, width: 50 } satisfies MemberRenderAtom,
      ],
    ],
    connector: [],
  };

  it("draws one <text> per atom run, x-advancing by the PRIOR atom's own width (jar: tenobo-24-liga464)", () => {
    const svg = renderNote(boldNote, theme);
    const texts = [...svg.matchAll(/<text x="([^"]*)"[^>]*>([^<]*)<\/text>/g)];
    expect(texts).toHaveLength(2);
    // `StringUtils.trin` — the SVG driver trims chars <= U+0020 from both ends
    // of every label (`DriverTextSvg.java:125`, ported into
    // `core/svg-shapes.ts#emittedTextForm`). This atom's own text is `'Yet '`;
    // what reaches the SVG is `'Yet'`. Jar-verified on this very fixture:
    //   <text x="12" … textLength="19.5" …>Yet</text>
    //   <text x="31.5" …>another</text>
    // Note the ADVANCE is unaffected (31.5 = 12 + 19.5) — trimming changes the
    // emitted content, not the atom's measured width, which is why the x
    // assertions below are unchanged.
    expect(texts[0]![2]).toBe('Yet');
    expect(texts[1]![2]).toBe('another');
    expect(Number(texts[0]![1])).toBe(0 + 6); // note.x + NOTE_MARGIN_X1
    expect(Number(texts[1]![1])).toBe(0 + 6 + 20); // prior atom's own width
  });

  it('the BOLD run carries font-weight="700", the plain run does not', () => {
    const svg = renderNote(boldNote, theme);
    const texts = [...svg.matchAll(/<text[^>]*>[^<]*<\/text>/g)].map((m) => m[0]);
    expect(texts[0]).not.toContain('font-weight');
    expect(texts[1]).toContain('font-weight="700"');
  });

  it("an atom's OWN resolved color overrides the hardcoded #000000 default", () => {
    const coloredNote: NoteGeo = {
      ...boldNote,
      lineAtoms: [[{ kind: 'text', text: 'warning', font: { ...plainFont, color: '#FF0000' }, width: 40 }]],
    };
    const svg = renderNote(coloredNote, theme);
    expect(svg).toContain('fill="#F00"');
  });

  it('a hand-built NoteGeo with NO lineAtoms falls back to the pre-cutover single-<text>-per-line path unchanged', () => {
    const svg = renderNote(baseNote, theme);
    const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];
    expect(texts.map((m) => m[1])).toEqual(['l1', 'l2']);
  });
});

// G2 N67 item 49: `<style> note { FontColor N } }` cascade -- the note-body
// FontColor fallback tier `renderNoteLineAtoms`/`renderNoteText` previously
// never consulted (hardcoded `fill="#000"` unconditionally, per that
// function's own now-superseded doc comment). `theme.colors.graph
// .noteCascadeFontColor` (`style-cascade-class.ts`, `NOTE_SNAMES`) sits
// BELOW an atom's own explicit `<color>` run (unchanged precedence, G2 N55)
// but ABOVE the hardcoded black default -- jar-verified `nufini-44-jofo787`
// (`<style> note { Fontcolor red } }`, every note text run `fill="#F00"`).
describe('renderNote — note FontColor cascade (G2 N67 item 49)', () => {
  it('the per-atom creole path (lineAtoms) uses the cascade when the atom has no OWN color (nufini-44-jofo787 shape)', () => {
    const themed = scaleClassTheme(
      {
        ...defaultTheme,
        colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, noteCascadeFontColor: '#FF0000' } },
      },
      1,
    );
    const plainFont = { family: 'sans-serif', size: 13, color: null, styles: new Set<FontStyle>() };
    const note: NoteGeo = {
      ...baseNote,
      lines: ['red note'],
      lineWidths: [40],
      lineAtoms: [[{ kind: 'text', text: 'red note', font: plainFont, width: 40 } satisfies MemberRenderAtom]],
    };
    const svg = renderNote(note, themed);
    expect(svg).toContain('fill="#F00"');
  });

  it("an atom's OWN explicit color still wins over the cascade", () => {
    const themed = scaleClassTheme(
      {
        ...defaultTheme,
        colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, noteCascadeFontColor: '#FF0000' } },
      },
      1,
    );
    const plainFont = { family: 'sans-serif', size: 13, color: '#0000FF', styles: new Set<FontStyle>() };
    const note: NoteGeo = {
      ...baseNote,
      lines: ['blue run'],
      lineWidths: [40],
      lineAtoms: [[{ kind: 'text', text: 'blue run', font: plainFont, width: 40 } satisfies MemberRenderAtom]],
    };
    const svg = renderNote(note, themed);
    expect(svg).toContain('fill="#00F"');
    expect(svg).not.toContain('fill="#F00"');
  });

  it('the pre-cutover fallback path (no lineAtoms) ALSO uses the cascade', () => {
    const themed = scaleClassTheme(
      {
        ...defaultTheme,
        colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, noteCascadeFontColor: '#FF0000' } },
      },
      1,
    );
    const svg = renderNote(baseNote, themed);
    const texts = [...svg.matchAll(/<text[^>]*fill="([^"]*)"[^>]*>/g)];
    expect(texts.map((m) => m[1])).toEqual(['#F00', '#F00']);
  });

  it('falls back to the hardcoded #000000 default when no cascade is set (unset-is-noop regression guard)', () => {
    const svg = renderNote(baseNote, theme);
    const texts = [...svg.matchAll(/<text[^>]*fill="([^"]*)"[^>]*>/g)];
    expect(texts.map((m) => m[1])).toEqual(['#000', '#000']);
  });
});

// G2 N56: per-atom baseline within a mixed-size line -- jar-verified against
// `fogexa-30-zupo141`'s real golden SVG: "In java," @ y=26.1111 (13pt),
// "every" @ y=25 (18pt, `<size:18>`), " "/"class" @ y=26.1111 (13pt) again --
// all FOUR atoms sit on the SAME physical line, but the 18pt run's baseline
// sits 1.1111 HIGHER (its own larger descent pulls it up relative to the
// smaller runs, since every atom's measured-rect BOTTOM -- not baseline --
// aligns to the line's shared `lineTop + lineHeight`). See `note-layout.ts
// #noteLineHeight`'s own doc comment for the full derivation.
describe('renderNote — per-atom baseline on a mixed-font-size line (G2 N56)', () => {
  const plain13 = { family: 'sans-serif', size: 13, color: null, styles: new Set<FontStyle>() };
  const big18 = { family: 'sans-serif', size: 18, color: null, styles: new Set<FontStyle>() };

  const mixedNote: NoteGeo = {
    id: '__note_0',
    kind: 'note',
    x: 6,
    y: 6,
    width: 132.9125,
    height: 54,
    lines: ['In java, every class'],
    lineWidths: [80.85],
    lineAtoms: [
      [
        { kind: 'text', text: 'In java, ', font: plain13, width: 38.2688 } satisfies MemberRenderAtom,
        { kind: 'text', text: 'every', font: big18, width: 43.9875 } satisfies MemberRenderAtom,
        { kind: 'text', text: ' ', font: plain13, width: 3.575 } satisfies MemberRenderAtom,
        { kind: 'text', text: 'class', font: plain13, width: 29.6563 } satisfies MemberRenderAtom,
      ],
    ],
    lineHeights: [18],
    connector: [],
  };

  it("the 18pt run's baseline sits ABOVE the 13pt runs' baseline on the SAME line", () => {
    const svg = renderNote(mixedNote, theme);
    const ys = [...svg.matchAll(/<text x="[^"]*" y="([^"]*)"/g)].map((m) => Number(m[1]));
    expect(ys).toHaveLength(4);
    // note.y(6) + NOTE_MARGIN_Y(5) + lineHeight(18) - descent(13pt: 13/4.5).
    const y13 = 6 + 5 + 18 - 13 / 4.5;
    // Same lineTop/lineHeight, this atom's OWN (larger) descent: 18/4.5.
    const y18 = 6 + 5 + 18 - 18 / 4.5;
    expect(ys[0]).toBeCloseTo(y13, 2); // "In java, "
    expect(ys[1]).toBeCloseTo(y18, 2); // "every"
    expect(ys[2]).toBeCloseTo(y13, 2); // " "
    expect(ys[3]).toBeCloseTo(y13, 2); // "class"
    expect(y13 - y18).toBeCloseTo(1.1111, 2); // jar: 26.1111 - 25 == 1.1111
  });
});

// SI30 T4: a note line with `<sub>` -- `renderNote` draws the EXACT
// `MemberRenderAtom[]` `resolveMemberAtoms` (`class-member-creole.ts`)
// produced (never a hand-built literal), so "measure and render use the
// SAME runs" is enforced by construction, not just by separate assertions.
describe('renderNote — <sub> note line: measure and render share the same runs (SI30 T4)', () => {
  const measurer = new FormulaMeasurer();
  const font = memberBaseFont({ family: 'sans-serif', size: 13 }, {});
  const atoms = buildMemberAtoms('A<sub>1</sub> B', font);
  const build = resolveMemberAtoms(atoms, font, measurer);

  const subNote: NoteGeo = {
    id: '__note_0',
    kind: 'note',
    x: 6,
    y: 6,
    width: build.width + 20,
    height: build.height + 20,
    lines: ['A1 B'],
    lineWidths: [build.width],
    lineAtoms: [build.atoms],
    lineHeights: [build.height],
    connector: [],
  };

  it('draws the sub run at its sizer-measured muted size and dy', () => {
    const svg = renderNote(subNote, theme);
    const texts = [...svg.matchAll(/<text x="[^"]*" y="([^"]*)" font-size="([^"]*)"/g)];
    expect(texts).toHaveLength(3);
    const [a, sub, b] = texts as [RegExpMatchArray, RegExpMatchArray, RegExpMatchArray];
    // note.y(6) + NOTE_MARGIN_Y(5) + this line's own Sea height.
    const lineTop = 6 + 5;
    // D1: muted 13 - 3 = 10.
    expect(sub.at(2)).toBe('10');
    expect(a.at(2)).toBe('13');
    expect(b.at(2)).toBe('13');
    // SI30 T4: the RENDERER (`renderer-note.ts#renderNoteLineAtoms`) draws
    // via `noteLineAtomDy` -- NOT `atom.dy` (that field carries `class-
    // member-creole-sea.ts#textAtomDy`'s MEMBER-row reference, a DIFFERENT
    // value; `noteLineAtomDy`'s own doc comment has the full derivation of
    // why notes and members need separate corrections). This test asserts
    // the SAME primitive the renderer calls, over the SAME atoms the sizer
    // built -- "measure and render use the same runs", jar-verified against
    // `exposant-01-class`'s own note line (`bold <sub>sub</sub> ...`).
    const dys = noteLineAtomDy(build.atoms, build.height);
    for (const [i, m] of [a, sub, b].entries()) {
      const atom = build.atoms[i] as Extract<MemberRenderAtom, { kind: 'text' }>;
      const expectedY = lineTop + build.height - atom.font.size / 4.5 + dys[i]!;
      expect(Number(m.at(1))).toBeCloseTo(expectedY, 2);
    }
    // The `<sub>` (altitude +3) sinks the sub run below its NORMAL siblings.
    expect(dys[1]).toBeGreaterThan(dys[0]!);
  });
});
