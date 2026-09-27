/**
 * cdd4-T12 — a multi-line classifier NAME stacks each physical line by its
 * OWN height, not a flat `fontSize` per line index.
 *
 * Upstream: the name is one `Display#create8` TextBlock (EntityImageClass
 * Header.java:107-108) -> `Display.java:699` `new SheetBlock1(...)`, whose
 * `initMap` (SheetBlock1.java:129-148) runs `sea.translateMinYto(y); ...
 * y += height;` per stripe -- each line's top is the running sum of every
 * previous stripe's `Sea` height. An emoji line is `39*factor` tall
 * (AtomEmoji), a sub-10pt text line floors at 10 (AtomText.java:179-181).
 */
import { describe, expect, test } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { buildHeaderRows } from '../../../src/diagrams/class/class-stereotype-layout.js';
import type { MemberRenderAtom } from '../../../src/diagrams/class/class-member-creole.js';

const NAME_TOP = 5;
const BASELINE_OFFSET = 12.9951;
const FONT_SIZE = 14;
/** `39 * (14 / 24)` -- AtomEmoji's box height at a 14pt line. */
const EMOJI_LINE_HEIGHT = 22.75;

function rowsFor(lineHeights: readonly number[] | undefined, lineAtoms?: Array<MemberRenderAtom[] | undefined>) {
  const lines = ['a', 'b', 'c'];
  return buildHeaderRows({
    header: { headerText: lines.join('\n'), headerItalic: false, genericDisplayOld: false },
    lines,
    lineWidths: [10, 10, 10],
    align: 'center',
    circleWidth: 0,
    widthStereoAndName: 16,
    nameWidth: 16,
    h1: 0,
    h2: 0,
    nameTop: NAME_TOP,
    baselineOffset: BASELINE_OFFSET,
    fontSpec: { family: 'sans-serif', size: FONT_SIZE },
    headerTextWidth: 10,
    badgeRadius: 11,
    blankLineRenderWidth: 3.85,
    ...(lineAtoms !== undefined ? { lineAtoms } : {}),
    ...(lineHeights !== undefined ? { lineHeights } : {}),
  });
}

describe('buildHeaderRows — per-line cumulative stacking (SheetBlock1#initMap)', () => {
  test('a taller first line pushes every later line down by its own height', () => {
    const ys = rowsFor([EMOJI_LINE_HEIGHT, FONT_SIZE, FONT_SIZE]).map((r) => r.y);
    expect(ys).toEqual([
      NAME_TOP + BASELINE_OFFSET,
      NAME_TOP + EMOJI_LINE_HEIGHT + BASELINE_OFFSET,
      NAME_TOP + EMOJI_LINE_HEIGHT + FONT_SIZE + BASELINE_OFFSET,
    ]);
  });

  test('two tall lines accumulate (the line after both is shifted by both)', () => {
    const ys = rowsFor([EMOJI_LINE_HEIGHT, EMOJI_LINE_HEIGHT, EMOJI_LINE_HEIGHT]).map((r) => r.y);
    expect(ys[2]).toBeCloseTo(NAME_TOP + 2 * EMOJI_LINE_HEIGHT + BASELINE_OFFSET, 9);
  });

  test('without per-line heights each line falls back to fontSize (plain text)', () => {
    const ys = rowsFor(undefined).map((r) => r.y);
    expect(ys).toEqual([0, 1, 2].map((i) => NAME_TOP + i * FONT_SIZE + BASELINE_OFFSET));
  });

  test('an image-bearing line keeps its bottom anchor on top of the running sum', () => {
    const image: MemberRenderAtom = { kind: 'image', href: 'x', width: 20, height: 20 };
    const ys = rowsFor([EMOJI_LINE_HEIGHT, 20, FONT_SIZE], [undefined, [image], undefined]).map((r) => r.y);
    // top of line 1 is NAME_TOP + 22.75; bottom anchor = top + height - (fontSize - baselineOffset).
    expect(ys[1]).toBeCloseTo(NAME_TOP + EMOJI_LINE_HEIGHT + 20 - (FONT_SIZE - BASELINE_OFFSET), 9);
    expect(ys[2]).toBeCloseTo(NAME_TOP + EMOJI_LINE_HEIGHT + 20 + BASELINE_OFFSET, 9);
  });
});

describe('lecelo-92-loma110 emoji name lines (jar golden)', () => {
  test('wrench / hammer_and_wrench baselines sit one emoji line (22.75) apart', () => {
    const svg = renderSync(
      [
        '@startuml',
        'hide empty members',
        'hide circle',
        'class "<:label:> label\\n<:wrench:> wrench\\n<:hammer_and_wrench:> hammer_and_wrench"',
        '@enduml',
      ].join('\n'),
      { measurer: new WidthTableMeasurer() },
    );
    const yOf = (word: string): number => {
      const m = new RegExp(`<text[^>]*y="([0-9.]+)"[^>]*>${word}</text>`).exec(svg);
      if (m === null) throw new Error(`no <text> for ${word}`);
      return Number(m[1]);
    };
    // jar lecelo-92-loma110 ent0003: label 143.639, wrench 166.389, hammer 189.139.
    expect(yOf('wrench') - yOf('label')).toBeCloseTo(EMOJI_LINE_HEIGHT, 3);
    expect(yOf('hammer_and_wrench') - yOf('wrench')).toBeCloseTo(EMOJI_LINE_HEIGHT, 3);
  });
});
