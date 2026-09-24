/**
 * cdd-T19 — A3 M1 (text half) + M2: two independent FontColor tiers that
 * `renderer-classifier-rows.ts`'s `fontColor` chain never read before this
 * task. Every expected fill below is jar-verified directly (pinned oracle
 * `plantuml-1.2026.7beta11.jar`, `-DPLANTUML_DETERMINISTIC_TEXT=true`) for
 * these exact `.puml` sources — not guessed, and not merely the corpus
 * fixture (which bundles OTHER skinparams too).
 *
 * M1: a classifier's OWN inline `#text:color` decoration
 * (`class-declaration-extractors.ts#extractDecorations`'s `text?` field,
 * T18) -- `Style.java:206-208 eventuallyOverride(Colors)` puts it into
 * `PName.FontColor` at `Integer.MAX_VALUE` priority, and
 * `getFontConfiguration(set, colors)` (`Style.java:259-263`) checks
 * `colors.getColor(ColorType.TEXT)` before the style-derived FontColor at
 * all -- so it wins over every cascade tier, on both the header AND every
 * member row (`MethodsOrFieldsArea.java:240`/`EntityImageClassHeader.java:99`
 * both pass the SAME per-classifier `Colors`). The jar shortens every fill
 * generically (`SvgGraphics#format`'s own hex-shortening, unrelated to this
 * mechanism) -- `#FF0000`/`#0000FF` shorten to `#F00`/`#00F`.
 *
 * M2: `skinparam classFontColor`/the block form `skinparam class {
 * FontColor }` (`FromSkinparamToStyle.java:187`'s `{element,class_,header}`
 * signature) and `skinparam class { AttributeFontColor }` (`:192`'s
 * `{element,class_}` signature, no `header` token). Jar-verified: a BARE
 * `classFontColor` (no `AttributeFontColor`) tints the header ONLY, members
 * stay black -- `header`'s extra token excludes the header-scoped
 * declaration from the member-row (`{element,class_}`) query. An
 * `AttributeFontColor` ALONE (no `FontColor`) tints BOTH the header AND
 * every member -- upstream's subset-match resolves the header query
 * against the SAME `{element,class_}` declaration when no MORE SPECIFIC
 * header-scoped one exists (probed directly: no fixture in the T19 AC list
 * isolates this combination).
 */
import { describe, expect, test } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

function svgOf(source: string): string {
  const out = renderSync(source, { measurer: new WidthTableMeasurer() });
  return typeof out === 'string' ? out : (out as { svg: string }).svg;
}

function textFills(svg: string): readonly string[] {
  return [...svg.matchAll(/<text[^>]*fill="([^"]*)"[^>]*>/g)].map((m) => m[1] as string);
}

describe('A3 M1 — inline #text:color wins over every cascade tier', () => {
  test('class Foo #text:red tints the header AND the member row alike', () => {
    const svg = svgOf(['@startuml', 'class Foo #text:red {', '  +field1', '}', '@enduml'].join('\n'));
    expect(textFills(svg)).toEqual(['#F00', '#F00']);
  });

  test('a compound spec (#back:lightblue;text:blue) still exposes its text half', () => {
    const svg = svgOf(['@startuml', 'class Foo #back:lightblue;text:blue {', '  +field1', '}', '@enduml'].join('\n'));
    expect(textFills(svg)).toEqual(['#00F', '#00F']);
  });

  test('no #text: part leaves the default black (regression guard)', () => {
    const svg = svgOf(['@startuml', 'class Foo {', '  +field1', '}', '@enduml'].join('\n'));
    expect(textFills(svg)).toEqual(['#000', '#000']);
  });
});

describe('A3 M2 — classFontColor (header) / AttributeFontColor (member)', () => {
  test('bare skinparam classFontColor tints every classifier name only (remanu shape)', () => {
    const svg = svgOf(
      ['@startuml', 'skinparam classFontColor red', 'class Foo {', '  +field1', '}', '@enduml'].join('\n'),
    );
    expect(textFills(svg)).toEqual(['#F00', '#000']);
  });

  test('block-form FontColor/AttributeFontColor split name vs. member (picija shape)', () => {
    const svg = svgOf(
      [
        '@startuml',
        'skinparam class{',
        'AttributeFontColor gold',
        'FontColor Yellow',
        '}',
        'class Foo {',
        '  +field1',
        '}',
        '@enduml',
      ].join('\n'),
    );
    expect(textFills(svg)).toEqual(['#FF0', '#FFD700']);
  });

  test('AttributeFontColor alone ALSO tints the header (no more-specific header override)', () => {
    const svg = svgOf(
      [
        '@startuml',
        'skinparam class{',
        'AttributeFontColor gold',
        '}',
        'class Foo {',
        '  +field1',
        '}',
        '@enduml',
      ].join('\n'),
    );
    expect(textFills(svg)).toEqual(['#FFD700', '#FFD700']);
  });
});

// cdd2-T8 (S-13): `skinparam classFontColor automatic` -- a YIQ-luma
// contrast test against the classifier's OWN resolved header background
// (`HColorAutomagic#getAppropriateColor`/`HColorSimple#opposite`), NOT a
// literal colour keyword. Jar-verified `nisune-86-faji869`.
// @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSimple.java:211-214
describe('cdd2-T8 S-13 — classFontColor automatic', () => {
  test('a dark header background (#444) resolves the name row to white (nisune classA shape)', () => {
    const svg = svgOf(
      [
        '@startuml',
        'skinparam classFontColor automatic',
        'skinparam classHeaderBackgroundColor #444',
        'class classA {',
        '  testMethodCode()',
        '}',
        '@enduml',
      ].join('\n'),
    );
    expect(textFills(svg)).toEqual(['#FFF', '#000']);
  });

  test('a light background (#fff) resolves the name row to black (nisune classB shape)', () => {
    const svg = svgOf(
      [
        '@startuml',
        'skinparam classFontColor automatic',
        'class classB #fff {',
        '  testMethodCode()',
        '}',
        '@enduml',
      ].join('\n'),
    );
    expect(textFills(svg)).toEqual(['#000', '#000']);
  });
});
