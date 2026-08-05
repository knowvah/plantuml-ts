/**
 * A2s R2j (sovuxo-25-tepi226): `skinparam classAttributeFontSize<<Stereo>> N`
 * — a STEREOTYPE-QUALIFIED skinparam key resolved by DIRECT VALUE LOOKUP,
 * `SkinParam#getFontSize(stereotype, FontParam...)`'s
 * `getFirstValueNonNullWithSuffix("fontsize" + stereotype.getLabel(...))`
 * tier ABOVE the plain per-param value (@see ~/git/plantuml/.../skin/
 * SkinParam.java:433-448) — the SAME mechanism (and Theme-field shape) as
 * the pre-existing `classBorderThickness<<X>>` bucket
 * (`theme-graph-colors-a.ts#classBorderThicknessByStereo`), NOT the
 * `<style>`/`.tagname` cascade.
 *
 * Jar-verified probe numbers (R2c scratchpad ps/p1|p3|p4 — deterministic
 * text; `class foo<<Foo>> { example2 }` + bare `class other`):
 *  - p1 `classAttributeFontSize<<Foo>> 18`: foo 1.251042x1.027778in
 *    (90.075x74 px); other UNAFFECTED at 0.886806x0.666667 (63.85x48);
 *  - p4 plain `classAttributeFontSize 18`: foo IDENTICAL to p1
 *    (stereotyped ≡ plain for matching classes); other bumped (1.013194in);
 *  - p3 no skinparam: foo 1.010069x0.916667 (72.725x66).
 * sovuxo-25 itself combines plain 8 + <<Foo>> 18: dummy { example1 } →
 * 0.808333x0.805556 (58.2x58); foo → the p1 sizes.
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { measureClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const measurer = new WidthTableMeasurer();
const SUPPRESS = { fields: false, methods: false };

function classifiers(lines: string[]) {
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block).classifiers;
}

const FOO_LINES = ['class foo<<Foo>> {', 'example2', '}', 'class other'];

describe('R2j: classAttributeFontSize<<Stereo>> skinparam plumbing', () => {
  it('maps classattributefontsize<<foo>> to colors.graph.classAttributeFontSizeByStereo', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['classattributefontsize<<foo>>', '18']]),
      defaultTheme,
    );
    expect(theme.colors.graph.classAttributeFontSizeByStereo).toEqual({ foo: 18 });
    expect(unknown).toEqual([]);
  });

  it('drops a non-numeric value silently', () => {
    const { theme } = resolveSkinparam(
      new Map([['classattributefontsize<<foo>>', 'not-a-number']]),
      defaultTheme,
    );
    expect(theme.colors.graph.classAttributeFontSizeByStereo).toBeUndefined();
  });

  it('coexists with the plain classAttributeFontSize value', () => {
    const { theme } = resolveSkinparam(
      new Map([['classattributefontsize', '8'], ['classattributefontsize<<foo>>', '18']]),
      defaultTheme,
    );
    expect(theme.colors.graph.classAttributeFontSize).toBe(8);
    expect(theme.colors.graph.classAttributeFontSizeByStereo).toEqual({ foo: 18 });
  });
});

describe('R2j: per-stereotype attribute font size drives measurement', () => {
  it('applies to the matching stereotyped class only (p1 jar numbers)', () => {
    const { theme } = resolveSkinparam(
      new Map([['classattributefontsize<<foo>>', '18']]),
      defaultTheme,
    );
    const [foo, other] = classifiers(FOO_LINES);
    const mFoo = measureClassifier(foo!, theme, measurer, SUPPRESS);
    const mOther = measureClassifier(other!, theme, measurer, SUPPRESS);
    expect(mFoo.width).toBeCloseTo(90.075, 3);
    expect(mFoo.height).toBe(74);
    // The non-stereotyped class is untouched (p1's other ≡ p3's other).
    expect(mOther.width).toBeCloseTo(63.85, 3);
    expect(mOther.height).toBe(48);
  });

  it('stereotyped value ≡ plain value for the matching class (p1 ≡ p4)', () => {
    const [fooStereo] = classifiers(FOO_LINES);
    const [fooPlain] = classifiers(FOO_LINES);
    const stereoTheme = resolveSkinparam(
      new Map([['classattributefontsize<<foo>>', '18']]), defaultTheme,
    ).theme;
    const plainTheme = resolveSkinparam(
      new Map([['classattributefontsize', '18']]), defaultTheme,
    ).theme;
    const a = measureClassifier(fooStereo!, stereoTheme, measurer, SUPPRESS);
    const b = measureClassifier(fooPlain!, plainTheme, measurer, SUPPRESS);
    expect(a.width).toBeCloseTo(b.width, 6);
    expect(a.height).toBe(b.height);
  });

  it('sovuxo-25 combination: plain 8 for dummy, <<Foo>> 18 wins for foo', () => {
    const { theme } = resolveSkinparam(
      new Map([['classattributefontsize', '8'], ['classattributefontsize<<foo>>', '18']]),
      defaultTheme,
    );
    const [dummy] = classifiers(['class dummy {', 'example1', '}']);
    const [foo] = classifiers(FOO_LINES);
    const mDummy = measureClassifier(dummy!, theme, measurer, SUPPRESS);
    const mFoo = measureClassifier(foo!, theme, measurer, SUPPRESS);
    expect(mDummy.width).toBeCloseTo(58.2, 3);
    expect(mDummy.height).toBe(58);
    expect(mFoo.width).toBeCloseTo(90.075, 3);
    expect(mFoo.height).toBe(74);
  });

  it('default-behavior guard: no skinparam keeps the pre-existing sizes (p3)', () => {
    const [foo] = classifiers(FOO_LINES);
    const m = measureClassifier(foo!, defaultTheme, measurer, SUPPRESS);
    expect(m.width).toBeCloseTo(72.725, 3);
    expect(m.height).toBe(66);
  });
});
