/**
 * A2s F-G mechanism A13: `skinparam classAttributeIconSize 0` disables the
 * per-member visibility ICON and instead keeps the visibility CHARACTER in
 * the member's display text (fixtures zakufi-53-sofe736, camiba-14-java616).
 *
 * Upstream chain:
 *  - `SkinParam#classAttributeIconSize()` = `getAsInt("classAttributeIconSize",
 *    10)` (@see ~/git/plantuml/.../skin/SkinParam.java:554-556).
 *  - `MethodsOrFieldsArea#hasSmallIcon()` returns false outright when the
 *    size is 0 (@see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea
 *    .java:125-127) -- no icon column is reserved.
 *  - `MethodsOrFieldsArea#createTextBlock`: `withVisibilityChar =
 *    classAttributeIconSize() == 0`; `m.getDisplay(true)` prepends the
 *    member's OWN visibility char (only when one was explicit -- a
 *    modifier-less member gets no char, Member.java:161-178), and a leading
 *    `#` is tilde-escaped via `CharHidder.addTileAtBegin` so the creole
 *    layer renders it as one literal `#` glyph
 *    (@see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:244-246,
 *    @see ~/git/plantuml/.../utils/CharHidder.java:41-43). This port's
 *    member-creole layer has no `~`-escape pass (CharHidder.hide is
 *    deliberately unported, StripeSimple.ts doc), and a bare leading `#` is
 *    not creole markup there -- so prepending the plain char reproduces the
 *    SAME observable one-`#`-glyph result.
 *
 * Jar-exact hand-check (WidthTableMeasurer): zakufi classe1 golden width =
 * 1.165625in = 83.925px -- rows measured WITH the char kept and NO
 * 14px icon zone; the pre-A13 (default) width 89.7px must stay
 * byte-identical when the skinparam is absent.
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { parseClass } from './parse-helper.js';
import { measureClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const measurer = new WidthTableMeasurer();
const SUPPRESS = { fields: false, methods: false };

/** zakufi-53-sofe736's classe1 (5 fields + 5 methods, one modifier-less
 *  member per compartment). */
const CLASSE1_LINES = [
  'class classe1',
  'classe1 : -field1',
  'classe1 : ~field2',
  'classe1 : field3',
  'classe1 : #field4',
  'classe1 : +field5',
  'classe1 : -method1()',
  'classe1 : ~method2()',
  'classe1 : method3()',
  'classe1 : #method4()',
  'classe1 : +method5()',
];

function classe1(): ReturnType<typeof parseClass>['classifiers'][number] {
  const block: UmlSource = { lines: CLASSE1_LINES, type: 'class' };
  return parseClass(block).classifiers[0]!;
}

describe('A13: skinparam classAttributeIconSize plumbing', () => {
  it('maps classattributeiconsize to theme.classAttributeIconSize (0 IS meaningful)', () => {
    const zero = resolveSkinparam(new Map([['classattributeiconsize', '0']]), defaultTheme);
    expect(zero.theme.classAttributeIconSize).toBe(0);
    expect(zero.unknown).toEqual([]);
    const ten = resolveSkinparam(new Map([['classattributeiconsize', '10']]), defaultTheme);
    expect(ten.theme.classAttributeIconSize).toBe(10);
  });

  it('is absent from the default theme (upstream default 10 = icons on)', () => {
    expect(defaultTheme.classAttributeIconSize).toBeUndefined();
  });
});

describe('A13: classAttributeIconSize 0 sizing (zakufi-53-sofe736 classe1)', () => {
  const themed: Theme = { ...defaultTheme, classAttributeIconSize: 0 };

  it('keeps the visibility char in the row text, only for explicit members', () => {
    const m = measureClassifier(classe1(), themed, measurer, SUPPRESS);
    const texts = m.rows.slice(1).map((r) => r.text);
    expect(texts).toEqual([
      '-field1', '~field2', 'field3', '#field4', '+field5',
      '-method1()', '~method2()', 'method3()', '#method4()', '+method5()',
    ]);
  });

  it('emits NO visibilityIcon on any row and no icon-zone indent', () => {
    const m = measureClassifier(classe1(), themed, measurer, SUPPRESS);
    for (const row of m.rows) {
      expect(row.visibilityIcon).toBeUndefined();
    }
    // ROW_TEXT_LEFT_MARGIN only (6), never ROW_INDENT_WITH_ICON (20).
    for (const row of m.rows.slice(1)) {
      expect(row.indent).toBe(6);
    }
  });

  it('computes the jar-exact width 83.925px (golden 1.165625in)', () => {
    const m = measureClassifier(classe1(), themed, measurer, SUPPRESS);
    expect(m.width).toBeCloseTo(83.925, 3);
  });

  it('a non-zero explicit size keeps icon behavior (hasSmallIcon gate is ==0 only)', () => {
    const m = measureClassifier(classe1(), { ...defaultTheme, classAttributeIconSize: 10 }, measurer, SUPPRESS);
    expect(m.rows.slice(1, 3).map((r) => r.text)).toEqual(['field1', 'field2']);
    expect(m.rows[1]!.visibilityIcon).toBe('-');
  });
});

describe('A13: default (no skinparam) behavior is byte-identical', () => {
  it('keeps the pre-A13 width and icon rows (regression pin: 89.7px)', () => {
    const m = measureClassifier(classe1(), defaultTheme, measurer, SUPPRESS);
    expect(m.width).toBeCloseTo(89.7, 3);
    expect(m.rows.slice(1, 3).map((r) => r.text)).toEqual(['field1', 'field2']);
    expect(m.rows[1]!.visibilityIcon).toBe('-');
    expect(m.rows[1]!.indent).toBe(20);
  });
});
