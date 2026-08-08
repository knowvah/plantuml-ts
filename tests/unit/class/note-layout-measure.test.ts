/**
 * Colocated tests for `note-layout-measure.ts` — mission A2s task F-C
 * (mechanisms A4 bullets, B5-note literal `\n`, A11 block separators, A12
 * creole tables). Every expected number is either a jar-probe value
 * (`plans/a2s-class-record-sizing/batch-3/mechanisms.md`; probes under the
 * F-C scratchpad, re-generated as `oracle/goldens/class/a2s-note-hline-N/`)
 * or derived live from `WidthTableMeasurer` + an upstream Java constant —
 * no fitted constants.
 */
import { describe, it, expect } from 'vitest';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const F13 = { family: defaultTheme.fontFamily, size: 13 };
const w = (s: string): number => measurer.measure(s, F13).width;
const wBold = (s: string): number =>
  measurer.measure(s, { ...F13, weight: 'bold' }).width;

/** `Opale.java` margins — text width + 6 + 15, text height + 2*5. */
const MX = 21;
const MY = 10;

const note = (text: string): ReturnType<typeof measureNote> =>
  measureNote(text, defaultTheme, measurer);

describe('A4 — creole bullet lines in notes (Bullet atom header)', () => {
  // Bullet.java:72-76: order 0 -> XDimension2D(12, 5); text = trin(group(2))
  // (CreoleStripeSimpleParser.java:121-123). Jar-verified: pejone-71's note
  // width == 12 + w('Domain Decomposition Assignment') + 21 exactly.
  it('measures "* text" as Bullet(12) + trimmed text', () => {
    const m = note('* Sjors Kaagman');
    expect(m.width).toBeCloseTo(12 + w('Sjors Kaagman') + MX, 4);
    expect(m.height).toBe(13 + MY);
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'text', text: '', width: 12 });
    expect(m.lineAtoms[0]![1]).toMatchObject({ kind: 'text', text: 'Sjors Kaagman' });
  });

  it('measures nested "** text" as Bullet(8+8*order) + trimmed text', () => {
    const m = note('** Deep');
    expect(m.width).toBeCloseTo(8 + 8 * 1 + w('Deep') + MX, 4);
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'text', text: '', width: 16 });
  });

  it('matches temise-16 jar note widths (max bullet line + margins)', () => {
    // temise-16-neco018 jar-only sizes: 2.033681in / 2.193924in / 2.355295in.
    const worker = note('* Initialisiert die pView\n* berwacht die Ausf?hrung');
    expect(worker.width / 72).toBeCloseTo(2.355295, 4);
    expect(worker.height / 72).toBeCloseTo(0.5, 4);
    const queue = note('* Enthlt erledigte Jobs\n* Enth?lt n?chste Jobs');
    expect(queue.width / 72).toBeCloseTo(2.033681, 4);
    const n1 = note('* Initialisiert freie Worker\n* Lscht veraltete Entries');
    expect(n1.width / 72).toBeCloseTo(2.193924, 4);
  });

  it('does not treat a full-line "**bold**" creole run as a bullet', () => {
    // ASTERISK_PREFIXED_LINE_PATTERN cannot match '**bold** x' (group 2
    // must start [^*]); the creole engine handles the bold run instead.
    const m = note('**bold** x');
    expect(m.lineAtoms[0]![0]).toMatchObject({ kind: 'text', text: 'bold' });
    expect(m.width).toBeCloseTo(wBold('bold') + w(' x') + MX, 4);
  });

  it('classifies bullets on the RAW line, before <U+XXXX> escape resolution', () => {
    const m = note('<U+002A> x');
    expect(m.lines[0]).toBe('* x');
    expect(m.width).toBeCloseTo(w('* x') + MX, 4);
  });
});

describe('B5-note — literal \\n in note text', () => {
  // Display.getWithNewlines (Display.java:262-346) splits the single-line
  // note form on literal \n. lejoga-79 jar note: 2.017101in x 0.5in.
  it('splits a single-physical-line note on literal \\n', () => {
    const m = note('a\\nb');
    expect(m.lines).toEqual(['a', 'b']);
    expect(m.height).toBe(2 * 13 + MY);
  });

  it('matches lejoga-79 jar note size', () => {
    const m = note('Concatenation of a part\\nand component line');
    expect(m.width / 72).toBeCloseTo(2.017101, 4);
    expect(m.height / 72).toBeCloseTo(0.5, 4);
  });

  it('matches bumuma-72 jar note size (empty middle line)', () => {
    const m = note('some\\n\\nnotes');
    expect(m.lines).toEqual(['some', '', 'notes']);
    expect(m.width / 72).toBeCloseTo(0.732899, 4);
    expect(m.height / 72).toBeCloseTo(0.680556, 4);
  });

  it('keeps literal \\n literal in a block note (real newlines present)', () => {
    // CommandFactoryNoteOnEntity.java:238 builds block notes via
    // lines.toDisplay() — no getWithNewlines split. Jar-probe `bsplit`:
    // a block note line 'aaa\nbbb' measures ONE line, 1.044358in wide.
    const m = note('x\ny\\nz');
    expect(m.lines).toEqual(['x', 'y\\nz']);
    expect(m.height).toBe(2 * 13 + MY);
  });

  it('resolves escaped backslash: \\\\n is a literal backslash + n', () => {
    const m = note('a\\\\nb');
    expect(m.lines).toEqual(['a\\nb']);
    expect(m.height).toBe(13 + MY);
  });
});

describe('A11 — --/---- block separators in notes (BodyEnhanced2)', () => {
  // BodyEnhancedAbstract.decorate (java:107-121): untitled separator wraps
  // the following block in withMargin(block, 0, 4) — +8 height, +0 width.
  // Jar probes a2s-note-hline-{1,2,3}: 0.734028x0.611111, 0.893142x0.902778,
  // 0.893142x1.194444.
  it('measures one untitled -- separator as +8 height, 0 width (a2s-note-hline-1)', () => {
    const m = note('alpha\n--\nbeta');
    expect(m.width / 72).toBeCloseTo(0.734028, 4);
    expect(m.height / 72).toBeCloseTo(0.611111, 4);
    expect(m.lineHeights).toEqual([13, 8, 13]);
  });

  it('treats -- and ---- identically (a2s-note-hline-2)', () => {
    const m = note('alpha\n--\nbeta\n----\ngamma');
    expect(m.width / 72).toBeCloseTo(0.893142, 4);
    expect(m.height / 72).toBeCloseTo(0.902778, 4);
  });

  it('stacks three separators (a2s-note-hline-3)', () => {
    const m = note('alpha\n--\nbeta\n--\ngamma\n--\ndelta');
    expect(m.height / 72).toBeCloseTo(1.194444, 4);
  });

  it('measures a titled --Title-- separator (jar probe btitled: 0.744705x0.736111)', () => {
    // decorate title branch: withMargin(block, 0, 6, titleH/2, 4) +
    // TextBlockLineBefore.atLeast(titleW+8, titleH) + outer withMargin
    // (raw, 0, 0, titleH/2, 0).
    const m = note('alpha\n--Title--\nbeta');
    expect(m.width / 72).toBeCloseTo(0.744705, 4);
    expect(m.height / 72).toBeCloseTo(0.736111, 4);
  });

  it('matches sodizo-26 (12 text rows + 2 hlines) height exactly', () => {
    const lines = [
      'A0',
      'A', '----', 'B', 'loop', 'C', 'loop',
      'A', '----', 'B', 'loop', 'C', 'loop',
      'A1',
    ];
    const m = note(lines.join('\n'));
    expect(m.width / 72).toBeCloseTo(0.633594, 4);
    expect(m.height / 72).toBeCloseTo(2.527778, 4);
  });

  it('recognizes ==/../__ separators too, but not "..."', () => {
    expect(note('a\n==\nb').height).toBe(13 + 8 + 13 + MY);
    expect(note('a\n__\nb').height).toBe(13 + 8 + 13 + MY);
    expect(note('a\n..\nb').height).toBe(13 + 8 + 13 + MY);
    // '...' is excluded by isBlockSeparator (java:76-77) — a text row.
    expect(note('a\n...\nb').height).toBe(3 * 13 + MY);
  });
});

describe('A12 — creole tables in notes (StripeTable/AtomTable geometry)', () => {
  const JOVIGO = '| A         | B   |\n| --------- | --- |\n| P(C\\|D)   | E   |';

  it('matches jovigo-38 jar note size (1.02066in x 0.736111in)', () => {
    const m = note(JOVIGO);
    expect(m.width / 72).toBeCloseTo(1.02066, 4);
    expect(m.height / 72).toBeCloseTo(0.736111, 4);
  });

  it('collapses consecutive table lines into one row entry', () => {
    const m = note(JOVIGO);
    expect(m.lineHeights).toEqual([3 * 13 + 4]); // AtomWithMargin(table,2,2)
    expect(m.lineAtoms[0]).toEqual([]);
  });

  it('measures a table mixed with plain text lines', () => {
    const m = note('head\n|a|b|');
    expect(m.height).toBe(13 + (13 + 4) + MY);
    expect(m.width).toBeCloseTo(Math.max(w('head'), w('a') + w('b')) + MX, 4);
  });

  it('bolds |= header cells', () => {
    const m = note('|= H | x |');
    expect(m.width).toBeCloseTo(wBold(' H ') + w(' x ') + MX, 4);
  });
});

describe('R2b — TIM BLOCK_E1 sentinels in single-line notes', () => {
  // Jaws.BLOCK_E1_NEWLINE ('', jaws/Jaws.java:47) reaches a note's
  // stored text two ways: `%retrieve_procedure`'s multi-line capture joins
  // with it (TContext#extractFromResultList), and `%n()`/`%newline()` return
  // it inline (tim/builtin/Newline.java + JawsFlags.java:40,
  // USE_BLOCK_E1_IN_NEWLINE_FUNCTION == true). Either way the single-line
  // note form decodes it as a line break via Display#getWithNewlines
  // (Display.java:330-332). Golden targets below are the pinned jar DOT
  // node sizes (deterministic-text oracle).
  const E1 = '\u{e100}';

  it('splits at BLOCK_E1_NEWLINE (roputo-88-fuxo199 golden 1.535243x0.861111)', () => {
    const m = note(`foo class Object {${E1}name : token${E1}name : flag${E1}} dummy`);
    expect(m.lines).toEqual(['foo class Object {', 'name : token', 'name : flag', '} dummy']);
    expect(m.width / 72).toBeCloseTo(1.535243, 4);
    expect(m.height / 72).toBeCloseTo(0.861111, 4);
  });

  it('%n()-produced sentinels match rozudo-79-zavu288 golden 0.732899x0.680556', () => {
    const m = note(`some${E1}${E1}notes`);
    expect(m.lines).toEqual(['some', '', 'notes']);
    expect(m.width / 72).toBeCloseTo(0.732899, 4);
    expect(m.height / 72).toBeCloseTo(0.680556, 4);
  });

  it('matches xadado-92 note1 (quoted retrieve_procedure note, 1.284722x0.861111)', () => {
    const m = note(`class Object {${E1}  name : token${E1}  name : flag${E1}}`);
    expect(m.lines).toEqual(['class Object {', '  name : token', '  name : flag', '}']);
    expect(m.width / 72).toBeCloseTo(1.284722, 4);
    expect(m.height / 72).toBeCloseTo(0.861111, 4);
  });
});

describe('R2b — {{...}} embedded diagram regions in notes', () => {
  // EmbeddedDiagram.calculateDimensionSlow (EmbeddedDiagram.java:125-151):
  // the whole {{ ... }} region is ONE atom; with no working nested-diagram
  // raster/renderer the catch path returns `new XDimension2D(42, 42)`
  // (java:150). Jar-probe 2026-08-05: the oracle jar NPEs on the nested
  // raster in the deterministic DOT-dump environment and takes exactly this
  // path — probe DOT byte-identical to the pinned xadado-92-lazo250 golden.
  // Note dims: 42+6+15 = 63px = 0.875in; 42 + 13 (trailing '' line) + 2*5
  // = 65px = 0.902778in.
  it('collapses a class-flavored {{...}} to the 42x42 fallback (xadado detailsNote2)', () => {
    const m = note('{{\\nclass Object {\\n name : token\\n name : flag\\n}\\n}}\\n');
    expect(m.width / 72).toBeCloseTo(0.875, 4);
    expect(m.height / 72).toBeCloseTo(0.902778, 4);
    expect(m.lineHeights).toEqual([42, 13]);
    expect(m.lineAtoms[0]).toEqual([]);
  });

  it('collapses a sequence-flavored {{...}} identically (xadado detailsNote1)', () => {
    const m = note('{{\\nparticipant MyA as A\\nA->>B: prepare\\n}}\\n');
    expect(m.width / 72).toBeCloseTo(0.875, 4);
    expect(m.height / 72).toBeCloseTo(0.902778, 4);
  });

  it('keeps text after the closing }} as ordinary rows', () => {
    const m = note('{{\\nA->>B: x\\n}}\\ntail');
    expect(m.lineHeights).toEqual([42, 13]);
    expect(m.lines[1]).toBe('tail');
    expect(m.width).toBeCloseTo(Math.max(42, w('tail')) + MX, 4);
  });

  it('does not treat a mid-line {{ as an embedded region', () => {
    // getEmbeddedType (java:257-366) requires the trimmed line to START
    // with '{{'; 'x {{ y' is a plain text row.
    const m = note('x {{ y');
    expect(m.height).toBe(13 + MY);
  });
});

describe('existing behavior preserved', () => {
  it('single plain line — cajicu-52 byte-exact formula unchanged', () => {
    const m = note('hi');
    expect(m.width).toBeCloseTo(w('hi') + MX, 3); // row widths are unrounded (T8); rounding happens at SVG emission
    expect(m.height).toBe(13 + MY);
  });

  it('real-newline multi-line note unchanged', () => {
    const m = note('l1\nl2\nl3');
    expect(m.lines).toEqual(['l1', 'l2', 'l3']);
    expect(m.height).toBe(3 * 13 + MY);
  });
});
