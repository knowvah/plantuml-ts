/**
 * A2s R2j (mizupo-59-zala765): an EXPLICIT `skinparam defaultFontSize N` is
 * a DISTINCT resolution tier of `SkinParam#getFontSize` — per-param
 * skinparam → `defaultfontsize` value → each FontParam's own hardcoded
 * default (@see ~/git/plantuml/.../skin/SkinParam.java:441-448) — so an
 * explicit `defaultFontSize 14` differs from UNSET even though 14 equals
 * the port's ambient `theme.fontSize` default: `FontParam.CIRCLED_CHARACTER`
 * (default 17, FontParam.java:55) drops to the explicit value, shrinking
 * the badge radius via `getCircledCharacterRadius()` = fontSize/3 + 6
 * (@see SkinParam.java:548-551).
 *
 * Jar-verified probe numbers (R2c scratchpad pm/, pm14/ — deterministic
 * text): bare `class Alpha`/`class Beta` +
 *  - `skinparam defaultFontSize 12` → 0.843750x0.638889 / 0.759375x0.638889
 *    in (60.75x46 / 54.675x46 px);
 *  - `skinparam defaultFontSize 14` → 0.914931x0.638889 / 0.816493x0.638889
 *    in (65.875x46 / 58.7875x46 px) — height 46, NOT the unset 48
 *    (0.666667in), because radius = floor(14/3)+6 = 10, not floor(17/3)+6=11.
 *
 * The builtin `aws-orange` theme sets BOTH `skinparam defaultFontName
 * "Verdana"` and `skinparam defaultFontSize 12` (@see ~/git/plantuml/src/
 * main/resources/themes/puml-theme-aws-orange.puml:195-196), which the
 * compiled builtin entry must carry (themes-builtin-a-m.ts).
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme, deepMergeTheme, resolveTheme } from '../../../src/core/theme.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { parseClass } from './parse-helper.js';
import { measureClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const measurer = new WidthTableMeasurer();
const SUPPRESS = { fields: false, methods: false };

function bareClass(name: string): ReturnType<typeof parseClass>['classifiers'][number] {
  const block: UmlSource = { lines: [`class ${name}`], type: 'class' };
  return parseClass(block).classifiers[0]!;
}

describe('R2j: skinparam defaultFontSize explicit-set marker plumbing', () => {
  it('maps defaultfontsize to BOTH fontSize and the defaultFontSize marker', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['defaultfontsize', '12']]),
      defaultTheme,
    );
    expect(theme.fontSize).toBe(12);
    expect(theme.defaultFontSize).toBe(12);
    expect(unknown).toEqual([]);
  });

  it('bare fontsize sets fontSize only — NOT the explicit marker', () => {
    // Upstream stores a bare `fontsize` key that getValue("defaultfontsize")
    // never sees (SkinParam.java:443 reads only the defaultfontsize key).
    const { theme } = resolveSkinparam(new Map([['fontsize', '12']]), defaultTheme);
    expect(theme.fontSize).toBe(12);
    expect(theme.defaultFontSize).toBeUndefined();
  });

  it('deepMergeTheme copies the marker (OPTIONAL_SCALAR_KEYS)', () => {
    const merged = deepMergeTheme(defaultTheme, { defaultFontSize: 12 });
    expect(merged.defaultFontSize).toBe(12);
    expect(defaultTheme.defaultFontSize).toBeUndefined();
  });

  it('builtin aws-orange carries Verdana + explicit defaultFontSize 12', () => {
    const t = resolveTheme('aws-orange');
    expect(t.fontFamily).toBe('Verdana');
    expect(t.fontSize).toBe(12);
    expect(t.defaultFontSize).toBe(12);
    // `skinparam class { AttributeFontSize 11 }`
    // (puml-theme-aws-orange.puml:446) — member rows AND (via the N32
    // attribute->header cascade) the class header render at 11pt.
    expect(t.colors.graph.classAttributeFontSize).toBe(11);
  });

  it('aws-orange: bare class measures the mizupo-59 golden size exactly', () => {
    // mizupo-59-zala765 golden sh0007 (AbstractCollection):
    // 1.648438x0.638889in = 118.6875x46px — name at 11pt (AttributeFontSize
    // cascade), badge radius 10 (explicit defaultFontSize 12 -> 12/3+6).
    const m = measureClassifier(
      bareClass('AbstractCollection'), resolveTheme('aws-orange'), measurer, SUPPRESS,
    );
    expect(m.width).toBeCloseTo(118.6875, 3);
    expect(m.height).toBe(46);
  });
});

describe('R2j: explicit defaultFontSize drives CIRCLED_CHARACTER sizing', () => {
  function themed(size: string) {
    return resolveSkinparam(new Map([['defaultfontsize', size]]), defaultTheme).theme;
  }

  it('defaultFontSize 12: bare classes measure the jar-exact 46px height', () => {
    // pm/ probe goldens: 0.843750x0.638889 (Alpha), 0.759375x0.638889 (Beta).
    const alpha = measureClassifier(bareClass('Alpha'), themed('12'), measurer, SUPPRESS);
    const beta = measureClassifier(bareClass('Beta'), themed('12'), measurer, SUPPRESS);
    expect(alpha.height).toBe(46);
    expect(beta.height).toBe(46);
    expect(alpha.width).toBeCloseTo(60.75, 3);
    expect(beta.width).toBeCloseTo(54.675, 3);
  });

  it('EXPLICIT defaultFontSize 14 differs from unset: height 46, not 48', () => {
    // pm14/ probe goldens: 0.914931x0.638889 (Alpha), 0.816493x0.638889
    // (Beta) — radius floor(14/3)+6 = 10 vs the unset floor(17/3)+6 = 11.
    const alpha = measureClassifier(bareClass('Alpha'), themed('14'), measurer, SUPPRESS);
    const beta = measureClassifier(bareClass('Beta'), themed('14'), measurer, SUPPRESS);
    expect(alpha.height).toBe(46);
    expect(beta.height).toBe(46);
    expect(alpha.width).toBeCloseTo(65.875, 3);
    expect(beta.width).toBeCloseTo(58.7875, 3);
  });

  it('default-behavior guard: unset stays at the pre-existing 48px height', () => {
    const alpha = measureClassifier(bareClass('Alpha'), defaultTheme, measurer, SUPPRESS);
    expect(alpha.height).toBe(48);
  });

  it('an explicit circledCharacterFontSize still wins over the marker', () => {
    // SkinParam#getFontSize: the per-param skinparam tier sits ABOVE the
    // defaultfontsize tier (SkinParam.java:441-443).
    const { theme } = resolveSkinparam(
      new Map([['defaultfontsize', '12'], ['circledcharacterfontsize', '17']]),
      defaultTheme,
    );
    const alpha = measureClassifier(bareClass('Alpha'), theme, measurer, SUPPRESS);
    expect(alpha.height).toBe(48); // radius 11 from the explicit 17
  });
});
