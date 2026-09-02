/**
 * creole-text-lines — T1 of mission `state-declared-size-fix` (D1's core
 * seam). TDD: written before `src/core/svek/image/creole-text-lines.ts`.
 *
 * Every case below cites the Java rule it pins, per CLAUDE.md's "every
 * numeric constant cites a Java file:line" and this task's own acceptance
 * criteria (`plans/state-declared-size-fix/batch-1/T1-creole-text-seam.md`).
 */
import { describe, it, expect } from 'vitest';
import { creoleTextLines } from '../../../../../src/core/svek/image/creole-text-lines.js';
import { WidthTableMeasurer, FixedMeasurer } from '../../../../../src/core/measurer.js';
import type { FontSpec, StringMeasurer } from '../../../../../src/core/measurer.js';
import { parseSimpleColor, toSvgHex } from '../../../../../src/core/klimt/color/HColorSet.js';
import { renderLatexAsImage } from '../../../../../src/core/latex.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../../../../src/core/decoration/symbol/usymbol-resolve.js';

const font: FontSpec = { family: 'Helvetica', size: 14 };

describe('creoleTextLines', () => {
  it('empty display -> no lines (leaf-sizing-text.ts#lineCount S1L-e precedent)', () => {
    const lines = creoleTextLines('', font, new WidthTableMeasurer());
    expect(lines).toEqual([]);
  });

  it('<color:red>bleh</color> -> one line, one run, visible text "bleh", resolved color, width matches a plain measure of "bleh"', () => {
    // CommandCreoleColorChange.ts: color resolves via parseSimpleColor/toSvgHex
    // (HColorSet.ts), not the literal token — CommandCreoleColorChange.java.
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<color:red>bleh</color>', font, measurer);
    const expectedColor = toSvgHex(parseSimpleColor('red')!);
    const expectedWidth = measurer.measure('bleh', font).width;

    expect(lines).toHaveLength(1);
    expect(lines[0]!.kind).toBe('text');
    expect(lines[0]!.runs).toHaveLength(1);
    expect(lines[0]!.runs[0]!.text).toBe('bleh');
    expect(lines[0]!.runs[0]!.color).toBe(expectedColor);
    expect(lines[0]!.width).toBeCloseTo(expectedWidth, 10);
  });

  it('**entry** -> one run, visible text "entry" (markup stripped), bold flag set (FontStyle.java getUbrexCreoleSyntax BOLD="**", CommandCreoleStyle.ts)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('**entry**', font, measurer);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toHaveLength(1);
    expect(lines[0]!.runs[0]!.text).toBe('entry');
    expect(lines[0]!.runs[0]!.style.bold).toBe(true);
    expect(lines[0]!.runs[0]!.style.italic).toBe(false);
    expect(lines[0]!.width).toBeCloseTo(measurer.measure('entry', font).width, 10);
  });

  it('<math>x</math> IS ported now -- it becomes a latex atom, carried as an IMAGE run whose width/height are core/latex.ts#renderLatexAsImage\'s, not the tag-inclusive literal\'s', () => {
    const measurer = new WidthTableMeasurer();

    // This assertion used to pin the OPPOSITE, citing
    // `CommandCreoleBuilder.java:111` as a registration this port had not
    // made. `CommandCreoleMath` is ported now (ASCIIMath -> LaTeX via
    // `math/ASCIIMathTeXImg.ts`), so `<math>x</math>` no longer measures as
    // 14 literal characters.
    //
    // The line holds a `'latex'` atom, which this seam carries as a run with
    // an `image` and no text -- `AtomMath#calculateDimensionSlow` measures the
    // rendered image and `#drawU` draws it (`AtomMath.java:64-97`). The width
    // comes from `core/latex.ts#renderLatexAsImage` (KaTeX), a PERMANENT
    // divergence from the jar's JLaTeXMath metrics (`DIVERGENCES.md`, "LaTeX
    // rendering engine", which names `<math>` explicitly) -- so it is compared
    // against that function, never against a number the jar would have to
    // agree with.
    const mathLines = creoleTextLines('<math>x</math>', font, measurer);
    const drawn = renderLatexAsImage('{x}', JAR_DEFAULT_TEXT_COLOR);
    expect(mathLines).toHaveLength(1);
    expect(mathLines[0]!.runs).toHaveLength(1);
    // No `<text>` half at all: `AtomMath#drawU` draws an image and nothing
    // else (`AtomMath.java:78-97`).
    expect(mathLines[0]!.runs[0]!.text).toBe('');
    expect(mathLines[0]!.runs[0]!.image).toEqual({
      href: drawn.href,
      width: drawn.width,
      height: drawn.height,
      // Alone on its line, so `Sea#translateMinYto(0)` puts its box at the
      // line's own top (`Sea.java:72-80`).
      top: 0,
    });
    expect(mathLines[0]!.width).toBeCloseTo(drawn.width, 10);
    expect(mathLines[0]!.height).toBeCloseTo(drawn.height, 10);
    expect(mathLines[0]!.width).not.toBeCloseTo(measurer.measure('<math>x</math>', font).width, 10);
  });

  it('a <math> atom sharing a line with text: the image box is BOTTOM-aligned against the text box, so its own top is the line height minus its height (Sea.java:72-80, AtomMath.java:73-75 altitude 0)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('ab<math>x</math>', font, measurer);
    const drawn = renderLatexAsImage('{x}', JAR_DEFAULT_TEXT_COLOR);

    expect(lines).toHaveLength(1);
    const [textRun, imageRun] = lines[0]!.runs;
    expect(textRun!.text).toBe('ab');
    expect(textRun!.image).toBeUndefined();
    // `Sea#add` advances x by the previous atom's own width, so the line is
    // the text plus the image (`Sea.java:60-70`).
    expect(lines[0]!.width).toBeCloseTo(measurer.measure('ab', font).width + drawn.width, 10);
    // The taller atom sets the line height; both share `maxY === 0`.
    expect(lines[0]!.height).toBeCloseTo(drawn.height, 10);
    expect(imageRun!.image!.top).toBeCloseTo(lines[0]!.height - drawn.height, 10);
  });

  it('[[http://x]] -> one run, visible text defaults to the url itself, hyperlink color+underline, url set (CommandCreoleUrl.java / Url label-defaulting ctor)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('[[http://x]]', font, measurer);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toHaveLength(1);
    expect(lines[0]!.runs[0]!.text).toBe('http://x');
    expect(lines[0]!.runs[0]!.url).toBe('http://x');
    expect(lines[0]!.runs[0]!.color).toBe('#0000FF');
    expect(lines[0]!.runs[0]!.style.underline).toBe(true);
  });

  it('[[S1]] -> one run, visible text "S1" (no space in the bracket -> label defaults to the url itself)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('[[S1]]', font, measurer);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toHaveLength(1);
    expect(lines[0]!.runs[0]!.text).toBe('S1');
    expect(lines[0]!.runs[0]!.url).toBe('S1');
  });

  it('wrapWidth=25 splits "aa bb cc" into 3 lines via Fission#getSplitted, each one run wide 20px under a 10px/char fixed measurer', () => {
    // Fission.java's neutron walk: each 2-char unbreakable word (20px) plus
    // its bracketing whitespace (10px) exceeds 25px only once the trailing
    // space is added, so each word lands on its own line -- hand-traced
    // against Fission.ts's own ported algorithm (getSplitted/slightyShorten).
    const measurer: StringMeasurer = new FixedMeasurer(10, 14);
    const lines = creoleTextLines('aa bb cc', font, measurer, { wrapWidth: 25 });

    expect(lines).toHaveLength(3);
    expect(lines.map((l) => l.runs.map((r) => r.text))).toEqual([['aa'], ['bb'], ['cc']]);
    for (const line of lines) {
      expect(line.kind).toBe('text');
      expect(line.width).toBe(20);
    }
  });

  it('tabSize=2 vs default(8): a\\tb measures differently under a measurer where space has nonzero width (AtomText.java:239-256,270-275)', () => {
    // 1 char = 5px. tabString(2) = "  " (2 spaces) = 10px -> nonzero, so the
    // tab stop IS that measured width (no fontSize*4 fallback, unlike the
    // deterministic width table where every space measures 0).
    const measurer: StringMeasurer = new FixedMeasurer(5, 14);

    const linesTab2 = creoleTextLines('a\tb', font, measurer, { tabSize: 2 });
    // x=0 -> 'a' -> x=5 -> tab advances to next multiple of 10 -> x=10 -> 'b' -> x=15.
    expect(linesTab2[0]!.width).toBe(15);

    const linesTab8 = creoleTextLines('a\tb', font, measurer, { tabSize: 8 });
    // tabString(8) = 8 spaces = 40px -> x=0->5(a)->40(tab)->45(b).
    expect(linesTab8[0]!.width).toBe(45);
    expect(linesTab2[0]!.width).not.toBe(linesTab8[0]!.width);
  });

  it('a leading tab ("\\tb") advances from x=0 with no preceding pending text (AtomText.java:239-256, tokenizer boundary case)', () => {
    const measurer: StringMeasurer = new FixedMeasurer(5, 14);
    const lines = creoleTextLines('\tb', font, measurer, { tabSize: 2 });
    // tabStop = measure('  ')=10; x=0 -> tab -> advanceToTabStop(0,10)=10 -> 'b' -> x=15.
    expect(lines[0]!.width).toBe(15);
  });

  it('---- -> kind "hr", no runs, fixed 8px height (CREOLE_HR_HEIGHT, leaf-sizing-text.ts, jar-verified oracle)', () => {
    const lines = creoleTextLines('----', font, new WidthTableMeasurer());

    expect(lines).toHaveLength(1);
    expect(lines[0]!.kind).toBe('hr');
    expect(lines[0]!.runs).toEqual([]);
    expect(lines[0]!.height).toBe(8);
    expect(lines[0]!.width).toBe(0);
  });

  it('|= h |= h2 | -> kind "table-row" (CreoleParser.java:117,121-122 isTableLine, checked before HR/heading classification, CreoleParser.java:91-100)', () => {
    const lines = creoleTextLines('|= h |= h2 |', font, new WidthTableMeasurer());

    expect(lines).toHaveLength(1);
    expect(lines[0]!.kind).toBe('table-row');
    expect(lines[0]!.runs).toHaveLength(1);
    expect(lines[0]!.runs[0]!.text).toBe('|= h |= h2 |');
  });

  it('two physical lines ("a\\nb") -> two CreoleTextLine entries (Display#getWithNewlines splits on real newlines, Display.java:262-346)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('a\nb', font, measurer);

    expect(lines).toHaveLength(2);
    expect(lines[0]!.runs[0]!.text).toBe('a');
    expect(lines[1]!.runs[0]!.text).toBe('b');
  });

  it('<$unknownSprite> -> no run (CreoleTextRun has no image/sprite variant), zero width/height (StripeSimple.addSprite: an unresolved name contributes nothing, java:228-236)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<$unknownSprite>', font, measurer);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toEqual([]);
    expect(lines[0]!.width).toBe(0);
    expect(lines[0]!.height).toBe(0);
  });

  it('<:rocket:> alone on its line -> no run, the 36*factor SQUARE both ways (AtomEmoji.java:57-59); Sea supplies both bounds, so the -3*factor hang does NOT grow it (SI30 T3)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<:rocket:>', font, measurer);
    const factor = font.size / 24; // AtomEmoji.MAGIC, AtomEmoji.java:46

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toEqual([]);
    expect(lines[0]!.width).toBeCloseTo(36 * factor, 10);
    // Was 39*factor while this seam pre-combined the hang into the DIMENSION
    // (`emojiBoxDim`). Now it drives the real `Sea`: `minY = -36f + (-3f)`,
    // `maxY = -3f` -> `getHeight() == 36f` when the emoji is alone on the
    // line, and 39*factor only when a text atom (maxY 0) shares it -- the
    // jar-probed split `AtomEmoji.ts#emojiLineHeightFactor` documents
    // (`rectangle "<:rocket:>"` measures 41x41, not 41x42.75).
    expect(lines[0]!.height).toBeCloseTo(36 * factor, 10);
  });

  it('<:rocket:> WITH a text atom on the line -> 39*factor (Sea: emoji minY -39f vs text maxY 0, AtomEmoji.java:57-64)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<:rocket:>x', font, measurer);
    const factor = font.size / 24;

    expect(lines[0]!.height).toBeCloseTo(39 * factor, 10);
  });

  it('<latex>x</latex> -> one image run sized by renderLatexAsImage, the SAME contract <math> gets (both build a latex atom; AtomMath.java:64-97)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<latex>x</latex>', font, measurer);
    // `<latex>` is passed through verbatim -- only `<math>` goes through the
    // ASCIIMath -> LaTeX conversion (`CommandCreoleLatex` uses
    // `fromLatex`, `CommandCreoleMath` uses `fromAsciiMath`,
    // `ScientificEquationSafe.java:78-88`).
    const drawn = renderLatexAsImage('x', JAR_DEFAULT_TEXT_COLOR);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toHaveLength(1);
    expect(lines[0]!.runs[0]!.image).toEqual({
      href: drawn.href,
      width: drawn.width,
      height: drawn.height,
      top: 0,
    });
    expect(lines[0]!.width).toBe(drawn.width);
    expect(lines[0]!.height).toBe(drawn.height);
  });
});

// ---------------------------------------------------------------------------
// SI30 T3 — `<sup>`/`<sub>` sizing + `Sea` placement (`decisions.md#D1/#D2`).
// Written before the implementation; every expectation is DERIVED from the
// measurer and the cited Java rule, never a captured number.
// ---------------------------------------------------------------------------

describe('creoleTextLines — FontPosition runs through Sea (SI30 D1/D2)', () => {
  const measurer = new WidthTableMeasurer();
  /** `StringBounder#getDescent`, this port's `size/4.5` (`measurer.ts:195-197`,
   *  D3 — no new constant). `AtomText#drawU` reads it at java:214. */
  const descent = (size: number): number => measurer.getDescent({ ...font, size }, 'x');
  /** `FontPosition#mute` (`FontPosition.java:51-60`): −3, floored at 2. */
  const muted = (size: number): number => Math.max(size - 3, 2);

  it('NORMAL-only lines are byte-identical to the pre-Sea seam: width = Σ atom widths, height = MAX atom height, dy = 0 (README stop 9)', () => {
    // The identity proof. Each display below exercises a different atom
    // cascade the old sum/max loop handled: plain, styled, an inline
    // `<size:N>` (two different NORMAL sizes on one line), and a heading
    // (`StripeSimple.ts:271`'s +4/+2/+1 cascade).
    for (const display of ['plain text', '**bold** and //italic//', '<size:20>big</size> small', '==heading', 'x']) {
      const line = creoleTextLines(display, font, measurer)[0]!;
      const widths = line.runs.map((r) => measurer.measure(r.text, { ...font, size: r.size }).width);
      const heights = line.runs.map((r) =>
        // `AtomText.java:176-181` — measured height, floored at 10.
        Math.max(measurer.measure(r.text, { ...font, size: r.size }).height, 10),
      );

      expect(line.width).toBeCloseTo(
        widths.reduce((a, b) => a + b, 0),
        10,
      );
      expect(line.height).toBeCloseTo(Math.max(...heights), 10);
      for (const run of line.runs) expect(run.dy).toBe(0);
    }
  });

  it('a NORMAL run reports its own cascaded size unchanged (getFont is the identity for FontPosition.NORMAL, FontPosition.java:51-53)', () => {
    const line = creoleTextLines('<size:20>big</size> small', font, measurer)[0]!;
    expect(line.runs.map((r) => r.size)).toEqual([20, 14]);
  });

  it("juvagu-33's `\\t<sup>1</sup>`: the sup run measures at the MUTED size 11, and the tab stop still comes from the NORMAL run's own 14 (AtomText.java:251,271-273)", () => {
    const line = creoleTextLines('\t<sup>1</sup>', font, measurer)[0]!;

    expect(line.runs.map((r) => r.text)).toEqual(['\t', '1']);
    expect(line.runs.map((r) => r.size)).toEqual([font.size, muted(font.size)]);
    // Tab stop = `getFont().getSize2D() * 4` (`AtomText.java:273` — the
    // zero-width-space fallback that always fires under the deterministic
    // width table), on the NORMAL run's own font: 14*4 = 56. Then the sup
    // glyph at its muted size.
    expect(line.width).toBeCloseTo(font.size * 4 + measurer.measure('1', { ...font, size: 11 }).width, 10);
    // Pre-mute this line measured `'1'` at 14 — 1.67px wider, exactly the
    // jar delta T0 recorded for `s1 width idx1` (1.163715in vs 1.140538in).
    expect(line.width).toBeLessThan(font.size * 4 + measurer.measure('1', font).width);
  });

  it("juvagu-33's line: Sea grows the line to the sup's box + its raise, and dy is the sup's own baseline (Sea.java:72-80, AtomText.java:213-215,321-323)", () => {
    const line = creoleTextLines('\t<sup>1</sup>', font, measurer)[0]!;
    // Sea: normal atom y = -14, sup atom y = -11 + (-6) = -17 ->
    // minY = -17, maxY = max(0, -6) = 0 -> height 17 (was 14).
    expect(line.height).toBeCloseTo(Math.max(14, 11 + 6), 10);
    expect(line.runs[0]!.dy).toBe(0);
    // The raise, net of the two descents: the run draws at its own muted
    // descent while the renderer's reference baseline uses the UNMUTED one.
    expect(line.runs[1]!.dy).toBeCloseTo(-6 - descent(11) + descent(14), 10);
    expect(line.runs[1]!.dy).toBeLessThan(0); // raised, not lowered
  });

  it('<sub> lowers by +3 and grows the line at the BOTTOM, so the NORMAL runs sit 3px above it (FontPosition.java:41-49, Sea.java:72-80)', () => {
    const line = creoleTextLines('H<sub>2</sub>O', font, measurer)[0]!;

    expect(line.runs.map((r) => r.text)).toEqual(['H', '2', 'O']);
    expect(line.runs.map((r) => r.size)).toEqual([14, 11, 14]);
    // minY = -14 (the H/O atoms), maxY = +3 (the sub's own altitude).
    expect(line.height).toBeCloseTo(14 + 3, 10);
    // maxY moved off 0, so the bottom-anchored reference baseline every
    // renderer reconstructs (`lineTop + height - size/4.5`) now sits 3px
    // too low for the NORMAL runs — `Sea` says so, and `dy` carries it.
    expect(line.runs[0]!.dy).toBeCloseTo(-3, 10);
    expect(line.runs[2]!.dy).toBeCloseTo(-3, 10);
    // The sub itself: 3 lower than the normal runs, net of the descents.
    expect(line.runs[1]!.dy).toBeCloseTo(descent(14) - descent(11), 10);
    expect(line.runs[1]!.dy - line.runs[0]!.dy).toBeGreaterThan(0); // lowered
  });

  it('<size:20><sup>x</sup></size> and the reverse nesting both mute the CASCADED size -> 17 (FontConfiguration.java:98-104 mutes at READ time, D1)', () => {
    for (const display of ['<size:20><sup>x</sup></size>', '<sup><size:20>x</size></sup>']) {
      const line = creoleTextLines(display, font, measurer)[0]!;
      expect(line.runs).toHaveLength(1);
      expect(line.runs[0]!.size).toBe(17);
      expect(line.width).toBeCloseTo(measurer.measure('x', { ...font, size: 17 }).width, 10);
      // Alone on its line: minY = -17-6, maxY = -6 -> height 17, and the
      // run keeps its own baseline (nothing NORMAL shares the line).
      expect(line.height).toBeCloseTo(17, 10);
      expect(line.runs[0]!.dy).toBeCloseTo(descent(20) - descent(17), 10);
    }
  });

  it('an emoji and a <sup> on one line: the emoji sets the line height (39*factor) without moving the sup off its own baseline (AtomEmoji.java:57-64)', () => {
    const line = creoleTextLines('<:rocket:> a<sup>b</sup>', font, measurer)[0]!;
    const factor = font.size / 24;

    expect(line.runs.map((r) => r.size)).toEqual([14, 11]);
    // Emoji minY = -36f-3f, text maxY = 0.
    expect(line.height).toBeCloseTo(39 * factor, 10);
    expect(line.width).toBeCloseTo(
      36 * factor + measurer.measure(' a', font).width + measurer.measure('b', { ...font, size: 11 }).width,
      10,
    );
    expect(line.runs[0]!.dy).toBe(0);
    // Identical to the same sup on a text-only line: `dy` is measured
    // against the line's own reference baseline, so a taller neighbour
    // shifts both terms equally.
    expect(line.runs[1]!.dy).toBeCloseTo(-6 - descent(11) + descent(14), 10);
  });

  it('a run measured under the 10px floor draws at its REAL height inside the floored box (AtomText.java:178-179 floors the DIMENSION, java:213 reads the unfloored rect)', () => {
    // `<size:8>`: dimension 10 (floored), draw height 8 — upstream's own
    // asymmetry, so `dy` is -2 even though the run is NORMAL. Named here
    // rather than smoothed away; the same 10px floor is what makes a
    // `<sup>` muted below 10 (e.g. class font 12 -> 9) carry an extra -1.
    const line = creoleTextLines('<size:8>tiny</size>', font, measurer)[0]!;
    expect(line.runs[0]!.size).toBe(8);
    expect(line.height).toBe(10);
    expect(line.runs[0]!.dy).toBeCloseTo(8 - 10, 10);
  });

  it('a table row reports one NORMAL run at the caller font (not lexed, CreoleParser.java:91-100)', () => {
    const line = creoleTextLines('|= h |= h2 |', font, measurer)[0]!;
    expect(line.runs[0]!.size).toBe(font.size);
    expect(line.runs[0]!.dy).toBe(0);
  });
});
