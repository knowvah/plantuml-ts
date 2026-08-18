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

  it('<math>x</math> and <sup>2</sup> are NOT ported (CommandCreoleBuilder.java:104-105,111 registers CommandCreoleExposantChange/CommandCreoleMath; this port never added either) -- both measure as literal, tag-inclusive text', () => {
    const measurer = new WidthTableMeasurer();

    const mathLines = creoleTextLines('<math>x</math>', font, measurer);
    expect(mathLines).toHaveLength(1);
    expect(mathLines[0]!.runs).toHaveLength(1);
    expect(mathLines[0]!.runs[0]!.text).toBe('<math>x</math>');
    expect(mathLines[0]!.width).toBeCloseTo(measurer.measure('<math>x</math>', font).width, 10);

    const supLines = creoleTextLines('<sup>2</sup>', font, measurer);
    expect(supLines).toHaveLength(1);
    expect(supLines[0]!.runs).toHaveLength(1);
    expect(supLines[0]!.runs[0]!.text).toBe('<sup>2</sup>');
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

  it('<:rocket:> emoji -> no run, width/height from emojiBoxDim (AtomEmoji.java:57-64: 36*factor / 39*factor)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<:rocket:>', font, measurer);
    const factor = font.size / 24; // AtomEmoji.MAGIC, AtomEmoji.java:46

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toEqual([]);
    expect(lines[0]!.width).toBeCloseTo(36 * factor, 10);
    expect(lines[0]!.height).toBeCloseTo(39 * factor, 10);
  });

  it('<latex>x</latex> -> no run, zero width/height (measured through a separate LaTeX path, not this atom stream -- the same documented divergence leaf-sizing-text.ts#creoleVisibleText carries)', () => {
    const measurer = new WidthTableMeasurer();
    const lines = creoleTextLines('<latex>x</latex>', font, measurer);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.runs).toEqual([]);
    expect(lines[0]!.width).toBe(0);
    expect(lines[0]!.height).toBe(0);
  });
});
