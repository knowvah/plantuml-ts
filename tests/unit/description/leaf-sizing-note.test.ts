/**
 * F1-a (mission `s1l-tail-fix`, group G2) — the description NOTE body
 * measures through the REAL `BodyFactory.create3` → `BodyEnhanced2` route
 * (upstream `EntityImageNote.java:114-118`), replacing the flat
 * `lineCount(display) × NOTE_FONT_SIZE` model.
 *
 * One 12-line function served FOUR independently-diagnosed causes
 * (`plans/s1l-tail-diagnosis/findings/SYNTHESIS.md` §3); ADR-3 requires each
 * to be verified separately rather than assumed subsumed, so each has its
 * own `it` below:
 *
 * - **C1** block-separator geometry (`BodyEnhancedAbstract#isBlockSeparator`
 *   + `#decorate`): the separator line is REMOVED from the display and
 *   replaced by `decorate`'s margins — +8 untitled (`withMargin(block,
 *   marginX, 4)`, 4 top + 4 bottom), `4 + titleHeight` titled.
 * - **C2** `{{ … }}` collapses to ONE `EmbeddedDiagram` atom, measured at
 *   upstream's own 42×42 catch-block fallback (`EmbeddedDiagram.java:149`,
 *   ported at `src/core/EmbeddedDiagram.ts:415`). Maintainer-ruled 2026-08-06:
 *   faithful reproduction of the jar's own render FAILURE, not a divergence.
 * - **C3** the note font size honours a per-element override
 *   (`<style> note { FontSize 10 }`) instead of the hardcoded 13 —
 *   read from `opts.fontSize`, NEVER from `fontSpec.size` (ADR-4's trap:
 *   `leaf-sizing.ts:109` has already collapsed "no override" into the
 *   diagram font 14 by the time `measureNote` runs, so reading `fontSpec
 *   .size` would regress every plain note by 1px).
 * - **C4** a line whose RUN font is not the note's own (an `<img:…>` that
 *   cannot be decoded falls back to a fixed monospace 14) contributes ITS
 *   height, which `lineCount × 13` structurally cannot express.
 *
 * Every dimension asserted here is JAR-PINNED — each comes from the
 * committed `oracle/goldens/description/<slug>/svek-1.dot`, in DOT inches
 * ×72. The two `xufexu-38-fola855` numbers are additionally re-derived from
 * `decorate`'s Java expression with zero free parameters (see that `it`).
 *
 * ## Known residual, NOT this group's — the creole line advance
 *
 * The renderer block below is asserted structurally (run/rule counts, first
 * baseline) rather than by strict containment inside the note box, because a
 * PRE-EXISTING defect outside G2 makes the last baseline overhang: the creole
 * DRAW path advances each line by `fontSize × 1.17773` while
 * `calculateDimension` bills `fontSize` exactly. Measured identically on the
 * ENTITY `desc` path, which has been on `BodyFactory.create3` since mission
 * `bodyenhanced-atom-seams` T4 and is untouched here — `rectangle R [ aa /
 * bb / cc ]` steps 16.4883px at font 14 (= 14 × 1.17773) against the jar's
 * 14; a note steps 15.3105px at font 13 (= 13 × 1.17773) against the jar's
 * 13. F1-a strictly REDUCED the resulting overhang on `xufexu-38-fola855`'s
 * first note, from 28.15px (pre-change) to 2.12px, and the SVG diff-baseline
 * ratchet fell 3 → 1 for that fixture. Filed for the owner of the
 * `Sea`/`SheetBlock` draw-vs-measure seam.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { measureLeafNode } from '../../../src/diagrams/description/leaf-sizing.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';

/** The diagram-wide font `measureLeafNode` receives — deliberately 14, NOT
 *  the note's 13: `leaf-sizing.ts:109` has already collapsed "no per-element
 *  override" into this value, which is exactly why `measureNote` may not
 *  derive the note font from it (ADR-4). */
const fontSpec: FontSpec = { family: 'SansSerif', size: 14 };
const measurer = new WidthTableMeasurer();

function note(display: string): DescriptiveNode {
  return { id: 'n', display, symbol: 'note', children: [] };
}

/** `EntityImageNote.java:89-91` — `marginX1 = 6`, `marginX2 = 15`,
 *  `marginY = 5`: width += 21, height += 2 × 5. */
const NOTE_MARGIN_H = 21;
const NOTE_MARGIN_V = 10;

describe('F1-a / C1 — block-separator geometry (isBlockSeparator + decorate)', () => {
  // xufexu-38-fola855, note 1: 5 TEXT lines + 4 separators (`--`, `==toto==`,
  // `==`, `--`). Upstream drops each separator line from the display and
  // bills `decorate`'s margin instead:
  //   5 × 13 (text) + (8 + 17 + 8 + 8) (separators) + 10 (note margin) = 116px
  // where 8 = `withMargin(block, marginX, 4)` (4 top + 4 bottom) for an
  // untitled separator (`getTitle` returns undefined for `s.length <= 4`)
  // and 17 = `4 + titleHeight` for the 13px `==toto==` title.
  const NOTE1 = 'foo\n--\nfoo2\n==toto==\nmeu\n==\nya\n--\n[[http://www.cot{cloud} my link]] hello';
  const NOTE2 = 'foo\n--\nfoo2\n==toto==\nmeu\n==\nya\n--\ncot\n[[http://www.cot{cloud} my link]] hello';

  it('xufexu-38 note 1: jar 1.186545x1.611111in = 85.43125x116px', () => {
    const d = measureLeafNode(note(NOTE1), fontSpec, measurer);
    expect(d.height).toBeCloseTo(116, 6);
    expect(d.width).toBeCloseTo(85.43125, 4);
  });

  it('xufexu-38 note 1 height falls out of the Java expression, no free parameters', () => {
    const d = measureLeafNode(note(NOTE1), fontSpec, measurer);
    const TEXT_LINES = 5;
    const NOTE_FONT_SIZE = 13;
    const UNTITLED_SEPARATOR = 4 + 4; // withMargin(block, marginX, 4)
    const TITLED_SEPARATOR = 4 + NOTE_FONT_SIZE; // 4 + dimTitle.getHeight()
    expect(d.height).toBeCloseTo(
      TEXT_LINES * NOTE_FONT_SIZE + (UNTITLED_SEPARATOR * 3 + TITLED_SEPARATOR) + NOTE_MARGIN_V,
      6,
    );
  });

  it('xufexu-38 note 2 (one more text line, same 4 separators): jar 1.791667in = 129px', () => {
    const d = measureLeafNode(note(NOTE2), fontSpec, measurer);
    expect(d.height).toBeCloseTo(129, 6);
    expect(d.width).toBeCloseTo(85.43125, 4);
  });

  it('pivudu-29 `C / ---- / D`: jar 0.422569x0.611111in = 30.425x44px', () => {
    // 13 + (13 + 8) + 10 — the 4-char `----` is untitled (`length <= 4`).
    const d = measureLeafNode(note('C\n----\nD'), fontSpec, measurer);
    expect(d.width).toBeCloseTo(30.425, 4);
    expect(d.height).toBeCloseTo(44, 6);
  });

  it('a 2-char `--` IS a block separator (isBlockSeparator has no length floor)', () => {
    // The refutation `classifyStripeLine` could not express: its four patterns
    // all need >= 4 characters, upstream's `startsWith`/`endsWith` needs 2.
    const withSep = measureLeafNode(note('A\n--\nB'), fontSpec, measurer);
    const withoutSep = measureLeafNode(note('A\nB'), fontSpec, measurer);
    expect(withSep.height - withoutSep.height).toBeCloseTo(8, 6);
  });

  it('a TITLED separator costs 4 + titleHeight, not the untitled 8', () => {
    const titled = measureLeafNode(note('A\n==toto==\nB'), fontSpec, measurer);
    const untitled = measureLeafNode(note('A\n==\nB'), fontSpec, measurer);
    expect(titled.height - untitled.height).toBeCloseTo(4 + 13 - 8, 6);
  });
});

describe('F1-a / C2 — `{{ … }}` collapses to one EmbeddedDiagram atom (42x42)', () => {
  const EMBEDDED =
    '{{\nskinparam wrap_width 150\nstart\nwhile (count < max?)\n:count = count + increment;\nendwhile\nstop\n}}';

  it('kovaxi-11 / zidebi-71 embedded note: jar 0.875x0.722222in = 63x52px', () => {
    const d = measureLeafNode(note(EMBEDDED), fontSpec, measurer);
    expect(d.width).toBeCloseTo(NOTE_MARGIN_H + 42, 6);
    expect(d.height).toBeCloseTo(NOTE_MARGIN_V + 42, 6);
  });

  it('the whole block is ONE atom — body line count does not move the box', () => {
    const shorter = measureLeafNode(note('{{\nstart\nstop\n}}'), fontSpec, measurer);
    const longer = measureLeafNode(note(EMBEDDED), fontSpec, measurer);
    expect(shorter).toEqual(longer);
  });
});

describe('F1-a / C3 — the note font size honours a per-element override', () => {
  it('tijexo-10 `<style> note { FontSize 10 }`: jar 1.248264x0.277778in = 89.875x20px', () => {
    const d = measureLeafNode(note('note that is green'), fontSpec, measurer, { fontSize: 10 });
    expect(d.width).toBeCloseTo(89.875, 4);
    expect(d.height).toBeCloseTo(20, 6);
  });

  it('ADR-4 regression check — NO override still measures at the note default 13', () => {
    // `fontSpec.size` is 14 here (the collapsed diagram font). Reading it
    // instead of `opts?.fontSize ?? NOTE_FONT_SIZE` would return 51.74x24 and
    // widen every plain note in the corpus by 1px.
    const d = measureLeafNode(note('Hello'), fontSpec, measurer);
    expect(d.width).toBeCloseTo(50.7375, 4);
    expect(d.height).toBeCloseTo(23, 6);
  });

  it('an override of 14 is NOT the same as no override (the collapse is not observable)', () => {
    const overridden = measureLeafNode(note('Hello'), fontSpec, measurer, { fontSize: 14 });
    const plain = measureLeafNode(note('Hello'), fontSpec, measurer);
    expect(overridden.height).toBeCloseTo(24, 6);
    expect(plain.height).toBeCloseTo(23, 6);
  });
});

describe('F1-a / C4 — a run whose font is not the note font contributes ITS height', () => {
  // nobiza-91-fimo741's note: one 13px text line + one `<img:…>` line whose
  // URL cannot be decoded, so the atom falls back to a fixed monospace 14.
  const IMG_NOTE =
    'You can use images\n<img:https://chart.googleapis.com/chart?cht=p3&chd=t:60,40&chs=250x100&chl=Hello%7CWorld>';

  it('nobiza-91 note: jar 9.661458x0.513889in = 695.625x37px', () => {
    const d = measureLeafNode(note(IMG_NOTE), fontSpec, measurer);
    expect(d.width).toBeCloseTo(695.625, 3);
    expect(d.height).toBeCloseTo(37, 6);
  });

  it('the img-fallback line is 14 tall, not the note font 13 (lineCount x 13 = 36)', () => {
    const both = measureLeafNode(note(IMG_NOTE), fontSpec, measurer);
    const textOnly = measureLeafNode(note('You can use images'), fontSpec, measurer);
    expect(both.height - textOnly.height).toBeCloseTo(14, 6);
  });
});

// ---------------------------------------------------------------------------
// Sizer <-> renderer lock-step (`planning/sizer-renderer-parity.md`)
// ---------------------------------------------------------------------------

/** `xufexu-38-fola855`'s first note, as source. */
const NOTE_SOURCE = ['note as N', 'foo', '--', 'foo2', '==toto==', 'meu', '==', 'ya', '--', 'zz', 'end note'].join('\n');

function render(style: string): string {
  // A second element + an edge is mandatory: a single-entity diagram emits no
  // DOT at all (`isDegeneratedWithFewEntities`). `UC` shares no substring with
  // any note line, so the assertions below cannot match it by accident.
  return renderSync(`@startuml\n${style}usecase UC\n${NOTE_SOURCE}\nN .. UC\n@enduml`, {
    measurer: new WidthTableMeasurer(),
  });
}

/** The note's own `<rect>` — `drawFallbackBox` is the only `fill="#FEFECE"`
 *  rect in these fixtures. */
function noteRect(svg: string): { x: number; y: number; width: number; height: number } {
  const m = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#FEFECE"/.exec(svg);
  if (m === null) throw new Error('no note rect in SVG');
  return { x: Number(m[1]), y: Number(m[2]), width: Number(m[3]), height: Number(m[4]) };
}

describe('F1-a — the note RENDERER builds its block the same way the sizer does', () => {
  it('draws note text at the note font 13, not the diagram font 14', () => {
    // The renderer half of C3: `textFont`'s own fallback is `theme.fontSize`
    // (14), so notes drew 1px-per-line taller than the box the sizer had
    // measured at 13. Jar (`test-results/dot-cache/component/
    // xufexu-38-fola855/in.svg`) emits font-size="13" on every note line.
    const svg = render('');
    expect(svg).toMatch(/font-size="13"[^>]*>foo</);
    expect(svg).not.toMatch(/font-size="14"[^>]*>foo</);
  });

  it('a `<style> note { FontSize N }` override moves the ink too', () => {
    const svg = render('<style>\nnote {\n  FontSize 10\n}\n</style>\n');
    expect(svg).toMatch(/font-size="10"[^>]*>foo</);
  });

  it('a titled separator draws its TITLE plus rules, never the raw markup', () => {
    // Was: `==toto==` drew as one literal 14px UText run and `==` as an 18px
    // bold creole heading — three-way disagreement with both the sizer and
    // the jar. Now `TextBlockLineBefore` draws `toto` between two rules.
    const svg = render('');
    expect(svg).toMatch(/>toto</);
    expect(svg).not.toMatch(/>==toto==</);
    expect(svg).not.toMatch(/>--</);
    expect(svg).toContain('<line ');
  });

  it('draws upstream`s block model: 5 text runs + 8 rules, same counts as the jar', () => {
    // The lock-step evidence. Upstream's `decorate` turns these 4 separators
    // into 8 `UHorizontalLine`s -- 1 for `--`, 2+2 for the TITLE-split `==`
    // (a `=` separator draws a doubled rule), 2 for `==`, 1 for `--` -- and
    // leaves 5 text lines plus the `toto` title. The jar's own cached SVG
    // (`test-results/dot-cache/component/xufexu-38-fola855/in.svg`) emits
    // exactly 8 `<line>` and 6 `<text>` for the identical body. The pre-F1-a
    // renderer emitted 9 text runs and 0 rules.
    const svg = render('');
    const rect = noteRect(svg);
    const runs = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="13"/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }));
    expect(runs).toHaveLength(6); // foo, foo2, toto, meu, ya, zz
    expect([...svg.matchAll(/<line /g)]).toHaveLength(8);
    // Top-anchored inside the box: first baseline is one ascent below the
    // box top + `marginY` (5). Catches a wrong margin or a wrong font.
    const first = runs.reduce((a, b) => (a.y <= b.y ? a : b));
    expect(first.x).toBeCloseTo(rect.x + 6, 6); // marginX1
    expect(first.y).toBeGreaterThan(rect.y + 5);
    expect(first.y).toBeLessThan(rect.y + 5 + 13);
  });

  it('the note box is the jar`s 116px -- the renderer does not re-derive it', () => {
    const svg = render('');
    expect(noteRect(svg).height).toBeCloseTo(116, 6);
  });
});
