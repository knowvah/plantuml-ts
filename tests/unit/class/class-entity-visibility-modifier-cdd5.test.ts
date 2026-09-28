/**
 * cdd5-T4b (entity-visibility-icon-dropped): a leading VISIBILITY char on a
 * class declaration (`+class A`) sets the entity's `VisibilityModifier`
 * (always the METHOD variant -- `getVisibilityModifier(visibilityString +
 * "FOO", false)`), and `EntityImageClassHeader` merges its icon block
 * (`getUBlock`, 11x11, top margin 4) left of the name.
 *
 * Expected numbers are the jar's own `Class-visibility-0` golden
 * (`test-results/dot-cache/unknown/Class-visibility-0/in.svg`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandCreateClass.java:172-175,206
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:109-121
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseClassifierDecl } from '../../../src/diagrams/class/class-declaration-parser.js';
import { parseClass } from './parse-helper.js';

function render(...body: string[]): string {
  return renderSync(['@startuml', ...body, '@enduml'].join('\n'), { measurer: new WidthTableMeasurer() });
}

function parse(...lines: string[]): ReturnType<typeof parseClass> {
  return parseClass({ lines, type: 'class' });
}

describe('classifier visibility modifier: parse', () => {
  it.each([
    ['+class A', '+'],
    ['- class A', '-'],
    ['#class A {', '#'],
    ['~ interface A', '~'],
  ])('`%s` carries visibilityModifier %s', (line, vis) => {
    expect(parseClassifierDecl(line)?.visibilityModifier).toBe(vis);
  });

  it('a plain declaration carries none', () => {
    expect(parseClassifierDecl('class A')?.visibilityModifier).toBeUndefined();
  });

  it('lands on the classifier; a later plain redeclaration clears it (setVisibilityModifier(null))', () => {
    expect(parse('+class A').classifiers.find((c) => c.id === 'A')?.visibilityModifier).toBe('+');
    expect(parse('+class A', 'class A').classifiers.find((c) => c.id === 'A')?.visibilityModifier).toBeUndefined();
  });
});

describe('classifier visibility modifier: header icon (Class-visibility-0 golden)', () => {
  it.each([['+class A {', '}'], ['+ class A {', '}'], ['+class A {}'], ['+ class A {}'], ['+class A'], ['+ class A']])(
    '`%s` draws the PUBLIC_METHOD icon left of the name and widens the box by 11',
    (...lines: string[]) => {
      const svg = render(...lines);
      expect(svg).toContain(
        '<g data-visibility-modifier="PUBLIC_METHOD"><ellipse cx="41" cy="24.5" rx="3" ry="3" fill="#84BE84" style="stroke:#038048;stroke-width:1;"/></g>',
      );
      expect(svg).toContain('<rect x="7" y="7" width="52.363" height="48"');
      expect(svg).toMatch(/<text x="47" y="26.889"[^>]*>A<\/text>/);
    },
  );

  it('draws the icon after the badge and before the name text', () => {
    const svg = render('-class A');
    const icon = svg.indexOf('data-visibility-modifier="PRIVATE_METHOD"');
    expect(icon).toBeGreaterThan(svg.indexOf('<ellipse cx="22"'));
    expect(icon).toBeLessThan(svg.indexOf('>A</text>'));
  });
});

describe('classifier visibility modifier: merged block taller than the name (jar-rendered, classFontSize 8)', () => {
  // Oracle: `scripts/oracle-render.sh` on this exact source (1.2026.8beta1).
  const svg = render('skinparam classFontSize 8', '+class A', '#class "Foo\\nBarBaz" as B');

  it('centres the 8pt name on the 15px icon block (text y shifts, icon stays)', () => {
    expect(svg).toContain('<rect x="7" y="7" width="48.35" height="48"');
    expect(svg).toContain('<ellipse cx="41" cy="24.5" rx="3" ry="3" fill="#84BE84"');
    expect(svg).toMatch(/<text x="47" y="24.222"[^>]*>A<\/text>/);
  });

  it('places the icon left of the widest line of a two-line name', () => {
    expect(svg).toContain('<rect x="90.55" y="7" width="69.25" height="48"');
    expect(svg).toContain('<polygon points="124.55,19.5,128.55,23.5,124.55,27.5,120.55,23.5" fill="#FF4"');
    expect(svg).toMatch(/<text x="136.775" y="19.222"[^>]*>Foo<\/text>/);
    expect(svg).toMatch(/<text x="130.55" y="29.222"[^>]*>BarBaz<\/text>/);
  });
});

/**
 * cdd5-T5e (classAttributeIconSize in the header): `class-layout-
 * generic-classifier.ts#buildHeaderAndStereoGeo` already resolves
 * `options.classAttributeIconSize` (from `theme.classAttributeIconSize`,
 * `skinparam classAttributeIconSize N`) but never passed it on to
 * `computeHeaderNameGeo` -- `mergeNameWithVisibility` always sized the
 * reserved header-icon block off the hardcoded `VISIBILITY_ICON_SIZE`
 * (10) default, while the renderer (`renderer-classifier-box.ts
 * #renderHeaderVisibilityIcon`) already drew the icon at the REAL themed
 * size -- so a non-default size mis-sized the header box by `N - 10`.
 *
 * Oracle: `scripts/oracle-render.sh` on `skinparam classAttributeIconSize
 * 16` + `+class A` (1.2026.8beta1): `width:78px;height:68px`, box
 * `width="58.363"`, icon `cx="44"`, name `text x="53"`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:109-121
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:554-556
 */
describe('classifier visibility modifier: classAttributeIconSize in the header (jar-rendered)', () => {
  it('widens the header box by (N - 10) and shifts the icon/name with it', () => {
    const svg = render('skinparam classAttributeIconSize 16', '+class A');
    expect(svg).toContain('style="width:78px;height:68px;background:#FFFFFF;"');
    expect(svg).toContain('<rect x="7" y="7" width="58.363" height="48"');
    expect(svg).toContain('<ellipse cx="44" cy="24.5" rx="6" ry="6" fill="#84BE84"');
    expect(svg).toMatch(/<text x="53" y="26.889"[^>]*>A<\/text>/);
  });

  it('the default (unset) size still matches the pre-existing 10px golden', () => {
    const svg = render('+class A');
    expect(svg).toContain('<rect x="7" y="7" width="52.363" height="48"');
  });
});
