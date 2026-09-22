/**
 * CDD T6FU (T19 follow-up) — `skinparam classBackgroundColor<<stereo>>`.
 *
 * Both spellings normalise to ONE key. `SkinParam#cleanForKeySlow`
 * (java:285-300) lowercases, strips `[_.]`, and moves the `<<x>>` to the
 * END; the nested-block form arrives pre-concatenated by
 * `SkinLoader#getFullParam` (java:82-87). Jar-probed through this port's
 * own preprocessor: `skinparam class { <<Foo1>> { BackgroundColor
 * LightBlue } }` (tabaxa-70-pomu341) and `skinparam class {
 * BackgroundColor<<alias>> #PowderBlue }` (nagega-30-poso418) both yield
 * `classbackgroundcolor<<...>>`.
 *
 * The RESOLUTION is a stereotype-tagged STYLE, not the legacy
 * `SkinParam#getHtmlColor(ColorParam, Stereotype)` value lookup:
 * `SkinParam#setParam` (java:228-233) runs every cleaned key through
 * `new FromSkinparamToStyle(key2).convertNow(...)`, whose ctor splits the
 * `<<...>>` off into `this.stereo` (java:292-301) and whose `addStyle`
 * then re-signs the style with it at stereotype priority:
 *
 *   if (stereo != null) {
 *     map = StyleLoader.addPriorityForStereotype(map);
 *     for (String s : stereo.split("\&")) sig = sig.addStereotype(s);
 *   }
 *
 * and `EntityImageClass#getStyle` (java:166-171) queries
 * `getStyleSignature().withTOBECHANGED(getEntity().getStereotype())`, so a
 * `<<Foo1>>`-stereotyped class picks the tagged style up.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:292-301,396-408
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:166-171
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

function boxFill(svg: string, name: string): string | undefined {
  const start = svg.indexOf(`<!--class ${name}-->`);
  if (start === -1) throw new Error(`entity "${name}" not found`);
  const group = svg.slice(svg.indexOf('<g class="entity"', start));
  return /<rect [^>]*fill="([^"]*)"/.exec(group)?.[1];
}

describe('T6FU: skinparam classBackgroundColor<<stereo>>', () => {
  it('tints only the matching stereotyped classifier (nested-block form)', () => {
    // tabaxa-70-pomu341, verbatim.
    const svg = render(
      [
        '@startuml',
        'skinparam class {',
        '  BackgroundColor LightCoral',
        '  <<Foo1>> {',
        '    BackgroundColor LightBlue',
        '  }',
        '}',
        'class A <<Foo1>>',
        'class B',
        '@enduml',
      ].join('\n'),
    );
    expect(boxFill(svg, 'A')).toBe('#ADD8E6'); // LightBlue
    expect(boxFill(svg, 'B')).toBe('#F08080'); // LightCoral, the plain tier
  });

  it('tints from the suffix form too (same normalised key)', () => {
    // nagega-30-poso418's skinparam, verbatim.
    const svg = render(
      [
        '@startuml',
        'skinparam class {',
        '    BackgroundColor<<alias>>                #PowderBlue',
        '}',
        'class A <<alias>>',
        'class B',
        '@enduml',
      ].join('\n'),
    );
    expect(boxFill(svg, 'A')).toBe('#B0E0E6'); // PowderBlue
    expect(boxFill(svg, 'B')).toBe('#F1F1F1'); // untouched default
  });

  it('matches the stereotype case-insensitively', () => {
    const svg = render(
      ['@startuml', 'skinparam classBackgroundColor<<FOO1>> #PowderBlue', 'class A <<foo1>>', '@enduml'].join('\n'),
    );
    expect(boxFill(svg, 'A')).toBe('#B0E0E6');
  });

  // `StyleLoader#addPriorityForStereotype` (+1000) puts this tier above BOTH
  // the plain `{element, class_}` and the `{element, class_, header}`
  // styles, so `EntityImageClass#getStyleHeader`'s merged BackGroundColor
  // resolves to it -- `headerBackcolor` equals `backcolor`, no split.
  it('outranks classHeaderBackgroundColor (no header split)', () => {
    const svg = render(
      [
        '@startuml',
        'skinparam classBackgroundColor #77F',
        'skinparam classHeaderBackgroundColor #4FF',
        'skinparam classBackgroundColor<<foo1>> #PowderBlue',
        'class A <<foo1>>',
        'class B',
        '@enduml',
      ].join('\n'),
    );
    const groupA = svg.slice(svg.indexOf('<g class="entity"', svg.indexOf('<!--class A-->')));
    const rectsA = [...groupA.slice(0, groupA.indexOf('</g>')).matchAll(/<rect [^>]*\/>/g)];
    expect(rectsA).toHaveLength(1);
    expect(boxFill(svg, 'A')).toBe('#B0E0E6');
    // B carries no stereotype, so the header style still wins there.
    expect(boxFill(svg, 'B')).toBe('#77F');
  });

  it('loses to the classifier’s own inline colour', () => {
    // `EntityImageClass.java:206-208` only falls to the style when
    // `backcolor == null`.
    const svg = render(
      ['@startuml', 'skinparam classBackgroundColor<<foo1>> #PowderBlue', 'class A <<foo1>> #yellow', '@enduml'].join(
        '\n',
      ),
    );
    expect(boxFill(svg, 'A')).toBe('#FF0');
  });
});
