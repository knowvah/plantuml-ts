/**
 * cdd6 T1a -- family A, core half (decision D2): cluster/element style
 * values reach `theme.colors.elements[<sname>]`, keyed by the upstream
 * `StyleSignatureBasic` SName. Data only; the renderer consumes them in T2a.
 *
 * Numeric dash expectations are the pinned jar's own output for probe
 * fixtures rendered with `scripts/oracle-render.sh` (quoted per test).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:286-296
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:151-165,209-215
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:299-320
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:127-129,270-283,303-376
 */
import { describe, it, expect } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import { buildTheme } from '../../../src/core/build-theme.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { ElementColors } from '../../../src/core/theme.js';
import { lineStyleDash, convertBorderStyleValue } from '../../../src/core/style-line-style.js';

function elements(body: string): Readonly<Partial<Record<string, ElementColors>>> {
  const { theme } = buildTheme(preprocess(`@startuml\n${body}\nclass A\n@enduml`));
  return theme.colors.elements ?? {};
}

function unknownKeys(body: string): string[] {
  return resolveSkinparam(preprocess(`@startuml\n${body}\n@enduml`).skinparam, defaultTheme).unknown;
}

const DASH_7_7 = { dashVisible: 7, dashSpace: 7 };
const SOLID = { dashVisible: 0, dashSpace: 0 };

describe('lineStyleDash (Style.java:303-320)', () => {
  it('a single token repeats as the space (jar: `LineStyle 2` -> dasharray 2,2)', () => {
    expect(lineStyleDash('2')).toEqual({ dashVisible: 2, dashSpace: 2 });
  });

  it('splits on `-`, `;` and `,` (jar: `LineStyle 5-3` -> dasharray 5,3)', () => {
    expect(lineStyleDash('5-3')).toEqual({ dashVisible: 5, dashSpace: 3 });
    expect(lineStyleDash('1;3')).toEqual({ dashVisible: 1, dashSpace: 3 });
    expect(lineStyleDash('4, 6')).toEqual({ dashVisible: 4, dashSpace: 6 });
  });

  it('an empty or unparseable value is a solid stroke (the catch arm)', () => {
    expect(lineStyleDash('')).toEqual(SOLID);
    expect(lineStyleDash('bold')).toEqual(SOLID);
    expect(lineStyleDash('dashed')).toEqual(SOLID);
    expect(lineStyleDash('5-x')).toEqual(SOLID);
    expect(lineStyleDash(' ;4')).toEqual(SOLID);
  });
});

describe('convertBorderStyleValue (FromSkinparamToStyle#convertNow/readValue)', () => {
  it('dashed -> 7;7 -> first token 7 (jar zivilu-35: dasharray 7,7)', () => {
    expect(convertBorderStyleValue('dashed')).toEqual({ lineStyle: '7' });
  });

  it('dotted -> 1;3 -> first token 1 (jar probe: dasharray 1,1, not 1,3)', () => {
    expect(convertBorderStyleValue('DOTTED')).toEqual({ lineStyle: '1' });
  });

  it('bold is a plain value: LineStyle "bold" (jar probe: solid, width unchanged)', () => {
    expect(convertBorderStyleValue('bold')).toEqual({ lineStyle: 'bold' });
  });

  it('a complex value keeps its first token and reads the rest (jar probe: dashed;bold -> solid, width 2)', () => {
    expect(convertBorderStyleValue('dashed;bold')).toEqual({ lineStyle: 'dashed', lineThickness: 2 });
  });

  it('a leading `;` blanks the main value, so readValue line styles stand', () => {
    expect(convertBorderStyleValue(';line.dotted;text:red')).toEqual({ lineStyle: '1;3', fontColor: 'red' });
    expect(convertBorderStyleValue(';line.dashed')).toEqual({ lineStyle: '7;7' });
  });

  it('text:<colour> without `;` only sets the font colour', () => {
    expect(convertBorderStyleValue('text:blue')).toEqual({ fontColor: 'blue' });
    expect(convertBorderStyleValue('text:')).toEqual({});
  });

  it('right:right collapses to right (a non-dash LineStyle)', () => {
    expect(convertBorderStyleValue('right:right')).toEqual({ lineStyle: 'right' });
  });
});

describe('<style> LineStyle (Cluster.java:291 group signature, Style.java:299-320)', () => {
  it('`group { LineStyle 2 }` lands in elements.group', () => {
    expect(elements('<style>\ngroup { LineStyle 2 }\n</style>').group?.lineStyle).toEqual({
      dashVisible: 2,
      dashSpace: 2,
    });
  });

  it('`package { LineStyle 5-3 }` lands in elements.package', () => {
    expect(elements('<style>\npackage { LineStyle 5-3 }\n</style>').package?.lineStyle).toEqual({
      dashVisible: 5,
      dashSpace: 3,
    });
  });

  it('palida-11: `rectangle { LineColor red; LineStyle 7-7 }`', () => {
    const rect = elements('<style>\nrectangle {\n  LineColor red\n  LineStyle 7-7\n}\n</style>').rectangle;
    expect(rect?.border).toBe('red');
    expect(rect?.lineStyle).toEqual(DASH_7_7);
  });
});

describe('<style> stereotype / .label / title sub-selectors (ClusterHeader.java:151-165,209-215)', () => {
  it('`package { stereotype { FontColor red } }` -> elements.package.stereotypeFont', () => {
    expect(
      elements('<style>\npackage {\n  stereotype {\n    FontColor red\n  }\n}\n</style>').package?.stereotypeFont,
    ).toBe('red');
  });

  it('noxebo-98: capitalised `Stereotype` reaches the rectangle bucket', () => {
    expect(elements('<style>\nrectangle {\n  Stereotype {\n    FontColor red\n  }\n}\n</style>').rectangle).toEqual({
      stereotypeFont: 'red',
    });
  });

  it('a stereotype block with only FontSize still sets stereotypeFontSize alone', () => {
    expect(elements('<style>\nnode {\n  stereotype {\n    FontSize 9\n  }\n}\n</style>').node).toEqual({
      stereotypeFontSize: 9,
    });
  });

  it('catana-32: the later `.boundary { FontColor red }` wins -> fontByStereo', () => {
    const body =
      '<style>\nrectangle {\n .boundary {\n  FontColor blue\n }\n}\nrectangle {\n .boundary {\n  FontColor red\n }\n}\n</style>';
    expect(elements(body).rectangle?.fontByStereo).toEqual({ boundary: 'red' });
  });

  it('a `.My_Tag` selector is keyed by the cleaned token', () => {
    const body = '<style>\nframe {\n .My_Tag {\n  FontColor green\n }\n}\n</style>';
    expect(elements(body).frame?.fontByStereo).toEqual({ mytag: 'green' });
  });

  it('juzica-68: per-sname title colours, beside the bare FontColor', () => {
    const body = [
      '<style>',
      'rectangle {\n fontColor orange\n title {\n  fontColor red\n }\n stereotype {\n  fontColor purple\n }\n}',
      'package {\n title {\n  fontColor blue\n }\n stereotype {\n  fontColor green\n }\n}',
      '</style>',
    ].join('\n');
    const els = elements(body);
    expect(els.rectangle).toEqual({ font: 'orange', titleFont: 'red', stereotypeFont: 'purple' });
    expect(els.package).toEqual({ titleFont: 'blue', stereotypeFont: 'green' });
  });

  it('a non-bucket sname sub-selector is ignored', () => {
    expect(
      elements('<style>\nwidget {\n title {\n  FontColor red\n }\n .x {\n  FontColor red\n }\n}\n</style>'),
    ).toEqual({});
  });
});

describe('skinparam <x>BorderStyle (FromSkinparamToStyle.java:277 addMagic -> LineStyle)', () => {
  it('zivilu-35: `skinparam rectangle { BorderStyle dashed }`', () => {
    expect(elements('skinparam rectangle {\n    BorderStyle dashed\n}').rectangle?.lineStyle).toEqual(DASH_7_7);
  });

  it('fokudi-24: `skinparam package { BorderStyle dashed }`', () => {
    expect(elements('skinparam package {\n    BorderStyle dashed\n}').package?.lineStyle).toEqual(DASH_7_7);
  });

  it('flat `rectangleBorderStyle dotted` is dash 1,1 (jar probe)', () => {
    expect(elements('skinparam rectangleBorderStyle dotted').rectangle?.lineStyle).toEqual({
      dashVisible: 1,
      dashSpace: 1,
    });
  });

  it('`frameBorderStyle dashed;bold` is solid at thickness 2 (jar probe)', () => {
    expect(elements('skinparam frameBorderStyle dashed;bold').frame).toEqual({ lineStyle: SOLID, lineThickness: 2 });
  });

  it('`usecaseBorderStyle text:red` sets only the font', () => {
    expect(elements('skinparam usecaseBorderStyle text:red').usecase).toEqual({ font: 'red' });
  });

  it('every addMagic sname is claimed; `action` (no addMagic) is not', () => {
    expect(unknownKeys('skinparam interfaceBorderStyle dashed\nskinparam rnoteBorderStyle dashed')).toEqual([]);
    expect(unknownKeys('skinparam actionBorderStyle dashed')).toEqual(['actionborderstyle']);
  });
});

describe('skinparam gradient background (HColorSet.java:107-116, FromSkinparamToStyle.java:127,129)', () => {
  it('`packageBackgroundColor #FFF/#000` -> elements.package.backgroundGradient', () => {
    expect(elements('skinparam packageBackgroundColor #FFF/#000').package?.backgroundGradient).toEqual({
      color1: '#FFF',
      color2: '#000',
      policy: '/',
    });
  });

  it('kacecu-90: block form `BackgroundColor red-green`', () => {
    expect(elements('skinparam package{\n    BackgroundColor red-green\n}').package?.backgroundGradient).toEqual({
      color1: 'red',
      color2: 'green',
      policy: '-',
    });
  });

  it('`#A|B` and `#A\\B` keep their policy', () => {
    expect(elements('skinparam packageBackgroundColor #red|green').package?.backgroundGradient?.policy).toBe('|');
    expect(elements('skinparam packageBackgroundColor #red\\green').package?.backgroundGradient?.policy).toBe('\\');
  });

  it('a solid value carries no gradient, and clears an earlier one', () => {
    expect(elements('skinparam packageBackgroundColor red').package).toBeUndefined();
    expect(
      elements('skinparam packageBackgroundColor red-green\nskinparam packageBackgroundColor blue').package
        ?.backgroundGradient,
    ).toBeUndefined();
  });
});

describe('stereotype-keyed buckets for every group USymbol (FromSkinparamToStyle.java:292-302,396-408)', () => {
  it('`skinparam frame<<x>> { BackgroundColor red }` -> elements.frame.backgroundColorByStereo', () => {
    expect(elements('skinparam frame<<x>> {\n BackgroundColor red\n}').frame?.backgroundColorByStereo).toEqual({
      x: 'red',
    });
  });

  it('fepiko-26: rectangle<<boundary>> font / stereo font / border / border style', () => {
    const body =
      'skinparam rectangle<<boundary>> {\n    StereotypeFontColor red\n    FontColor blue\n    BorderColor green\n    BorderStyle dashed\n}';
    expect(unknownKeys(body)).toEqual([]);
    expect(elements(body).rectangle).toEqual({
      stereotypeFontByStereo: { boundary: 'red' },
      fontByStereo: { boundary: 'blue' },
      // T1d: `FontColor` is declared AFTER `StereotypeFontColor` in this
      // block, so it wins the merged stereotype-text tier
      // (`DarkString.java:54-57`, `skinparam-stereo-keys.ts
      // #applyFontColorByStereo`) -- jar-verified 0/0 on this exact fixture.
      stereoTextFontByStereo: { boundary: 'blue' },
      borderByStereo: { boundary: 'green' },
      lineStyleByStereo: { boundary: DASH_7_7 },
    });
  });

  it('tobevo-04: the later rectangle<<boundary>> FontColor wins', () => {
    const body =
      'skinparam rectangle<<boundary>> {\n    FontColor blue\n}\nskinparam rectangle<<boundary>> {\n    FontColor red\n}';
    expect(elements(body).rectangle?.fontByStereo).toEqual({ boundary: 'red' });
  });

  it('node<<n>> BorderThickness and folder<<f>> BorderColor', () => {
    const els = elements('skinparam nodeBorderThickness<<n>> 3\nskinparam folderBorderColor<<f>> blue');
    expect(els.node?.lineThicknessByStereo).toEqual({ n: 3 });
    expect(els.folder?.borderByStereo).toEqual({ f: 'blue' });
  });

  it('`action`/`process` groups have no addMagic registration, so stay unknown', () => {
    expect(unknownKeys('skinparam actionFontColor<<a>> red')).toEqual(['actionfontcolor<<a>>']);
  });
});
