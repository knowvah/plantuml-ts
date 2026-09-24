/**
 * CDD T20 — class box chrome: E1 (header-background split), M1
 * (inline `line`/`line.<style>` border+dash), M6 (wrapped-member
 * visibility-icon centring).
 *
 * E1: `EntityImageClass#drawInternal`'s `roundCorner != 0 && headerBackcolor
 * != null && backcolor.equals(headerBackcolor) == false` branch draws FOUR
 * shapes instead of one when the header background genuinely differs from
 * the body fill -- an inline `header:` token, or (jar quirk) ANY gradient
 * body fill with no inline colour override at all (`HColorGradient` has no
 * `equals` override, `klimt/color/HColorGradient.java:43`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClass.java:192-234
 *
 * M1: `Style#getStroke(Colors)` -- an inline `line:`/`##colour` border
 * colour and `line.dashed`/`.dotted`/`.bold`/`##[style]` dasharray, both
 * previously unconsumed on the class engine's border/divider draw calls.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:95-124
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:97-108
 *
 * M6: `PlacementStrategyVisibility#getPositions`'s `height2` term is the
 * member's WHOLE wrapped-block TextBlock height, not one physical line.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyVisibility.java:56-69
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

function entityGroup(svg: string, name: string): string {
  const marker = `<!--class ${name}-->`;
  const start = svg.indexOf(marker);
  if (start === -1) throw new Error(`entity "${name}" not found in rendered SVG`);
  const bodyStart = svg.indexOf('<g class="entity"', start);
  // Entities are siblings at the same nesting depth -- the next sibling
  // opens with the SAME `<!--class ` (or `<!--interface `/etc.) marker, or
  // the outer `</g></g>` closes the whole diagram; either is a safe end
  // bound for extracting one entity's own children.
  const next = svg.indexOf('<!--', bodyStart + 1);
  return svg.slice(bodyStart, next === -1 ? svg.length : next);
}

function rects(group: string): string[] {
  return [...group.matchAll(/<rect [^>]*\/>/g)].map((m) => m[0]);
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? new RegExp(`${name}:([^;"]*)`).exec(tag)?.[1];
}

describe('T20 E1: class header-background split (nisune shape, mexaka inline header)', () => {
  it('inline `header:` differing from `back:` draws the 4-shape split', () => {
    // mexaka-52-gati860's Demo1: #back:lightgreen|yellow;header:blue/red.
    const svg = render(['@startuml', 'class Demo1 #back:lightgreen|yellow;header:blue/red', '@enduml'].join('\n'));
    const group = entityGroup(svg, 'Demo1');
    const rs = rects(group);
    expect(rs).toHaveLength(4);
    // rect2 (header) and rect3 (square bottom) are BOTH filled AND stroked
    // with the header colour (`ugHeader.apply(headerBackcolor.bg()).apply
    // (headerBackcolor)`), never the border colour.
    expect(attr(rs[1]!, 'fill')).toBe(attr(rs[1]!, 'stroke'));
    expect(attr(rs[2]!, 'fill')).toBe(attr(rs[2]!, 'stroke'));
    // rect3 has no rounded corners (`URectangle.build(w, roundCorner/2)`,
    // no `.rounded()` call).
    expect(rs[2]).not.toContain('rx=');
    // rect4 re-strokes the outer box with fill=none.
    expect(attr(rs[3]!, 'fill')).toBe('none');
  });

  it('no header override at all draws exactly one rect', () => {
    const svg = render(['@startuml', 'class Plain', '@enduml'].join('\n'));
    expect(rects(entityGroup(svg, 'Plain'))).toHaveLength(1);
  });

  it('gradient quirk: a gradient body fill with NO inline colour still splits (dizuse)', () => {
    const svg = render(
      ['@startuml', 'skinparam class {', '  BackgroundColor #c3d8f4\\#6192d1', '}', 'class Class', '@enduml'].join(
        '\n',
      ),
    );
    const rs = rects(entityGroup(svg, 'Class'));
    expect(rs).toHaveLength(4);
    // rect1 (body) and rect2 (header) share the identical gradient fill --
    // jar's own `headerBackcolor = getStyleHeader()...`/`backcolor =
    // getStyle()...` independently re-resolve the SAME skinparam value.
    expect(attr(rs[0]!, 'fill')).toBe(attr(rs[1]!, 'fill'));
  });

  it('a <style> classDiagram.class.header BackgroundColor drives the split (fumalu-64-vude116 shape; jar EntityImageClass.java:204-208)', () => {
    const svg = render(
      [
        '@startuml',
        '<style>',
        'classDiagram {',
        '  class {',
        '    BackgroundColor yellow',
        '    header {',
        '      BackgroundColor red',
        '    }',
        '  }',
        '}',
        '</style>',
        'class Foo {',
        '  dummy',
        '}',
        '@enduml',
      ].join('\n'),
    );
    const rs = rects(entityGroup(svg, 'Foo'));
    expect(rs).toHaveLength(4);
    expect(attr(rs[0]!, 'fill')).toBe('#FF0'); // body: BackgroundColor yellow
    expect(attr(rs[1]!, 'fill')).toBe('#F00'); // header: BackgroundColor red
    expect(attr(rs[2]!, 'fill')).toBe('#F00'); // header bottom strip
    expect(attr(rs[3]!, 'fill')).toBe('none'); // border re-stroke
  });

  it('an inline gradient BACK with no inline header does NOT split (taceve Test1)', () => {
    // `headerBackcolor = backcolor` (the SAME reference) when only BACK is
    // inline-set -- trivially `.equals()`-true, no split, even though the
    // fill IS a gradient (proves the quirk is gated on "no inline colour
    // at all", not "gradient fill").
    const svg = render(['@startuml', 'class Test1 #yellow\\FFFFFF', '@enduml'].join('\n'));
    expect(rects(entityGroup(svg, 'Test1'))).toHaveLength(1);
  });
});

describe('T20 M1: inline `line:`/`line.<style>` border colour and dasharray', () => {
  it('`line:red` overrides the box outline colour', () => {
    const svg = render(['@startuml', 'class Foo #yellow;line:red', '@enduml'].join('\n'));
    const rect = rects(entityGroup(svg, 'Foo'))[0]!;
    expect(attr(rect, 'stroke')).toBe('#F00');
  });

  it('`line.bold` yields stroke-width 2, no dasharray', () => {
    const svg = render(['@startuml', 'class Foo #line.bold', '@enduml'].join('\n'));
    const rect = rects(entityGroup(svg, 'Foo'))[0]!;
    expect(attr(rect, 'stroke-width')).toBe('2');
    expect(rect).not.toContain('stroke-dasharray');
  });

  it('`line.dashed` yields dasharray 7,7 at stroke-width 1', () => {
    const svg = render(['@startuml', 'class Foo #line.dashed', '@enduml'].join('\n'));
    const rect = rects(entityGroup(svg, 'Foo'))[0]!;
    expect(attr(rect, 'stroke-dasharray')).toBe('7,7');
    expect(attr(rect, 'stroke-width')).toBe('1');
  });

  it('`line.dotted` yields dasharray 1,3 at stroke-width 1, on BOTH box and dividers', () => {
    const svg = render(['@startuml', 'class Foo #line.dotted {', 'field1', '}', '@enduml'].join('\n'));
    const group = entityGroup(svg, 'Foo');
    const rect = rects(group)[0]!;
    expect(attr(rect, 'stroke-dasharray')).toBe('1,3');
    const dividerLines = [...group.matchAll(/<line [^>]*\/>/g)].map((m) => m[0]);
    expect(dividerLines.length).toBeGreaterThan(0);
    for (const l of dividerLines) expect(attr(l, 'stroke-dasharray')).toBe('1,3');
  });

  it('a plain classifier keeps the theme default (no dasharray, width 0.5)', () => {
    const svg = render(['@startuml', 'class Plain', '@enduml'].join('\n'));
    const rect = rects(entityGroup(svg, 'Plain'))[0]!;
    expect(rect).not.toContain('stroke-dasharray');
    expect(attr(rect, 'stroke-width')).toBe('0.5');
  });
});

describe('T20 M6: wrapped-member visibility-icon centres on the whole block', () => {
  it('a 2-line wrapped method centres its icon between the two lines, not on line 1', () => {
    const svg = render(
      [
        '@startuml',
        'skinparam wrapWidth 200',
        'class Demonstration {',
        '  +<init>(explictName: ExplictName, anotherType: AnotherType, yetAnotherType: YetAnotherType)',
        '}',
        '@enduml',
      ].join('\n'),
    );
    const group = entityGroup(svg, 'Demonstration');
    const ellipse = /<ellipse [^>]*\/>/.exec(group.slice(group.indexOf('data-visibility-modifier')))?.[0];
    expect(ellipse).toBeDefined();
    // Jar-verified (`pakemi-72-cani346`): cy=80.5 for this exact wrapped
    // 4-physical-line member at default fontSize 14 -- the pre-T20 code
    // centred on line 1 alone (cy=59.5).
    expect(attr(ellipse!, 'cy')).toBe('80.5');
  });

  it('a single-line member keeps the pre-existing (unwrapped) centring', () => {
    const svg = render(['@startuml', 'class Foo {', '  +bar()', '}', '@enduml'].join('\n'));
    const group = entityGroup(svg, 'Foo');
    const ellipse = /<ellipse [^>]*\/>/.exec(group.slice(group.indexOf('data-visibility-modifier')))?.[0];
    expect(ellipse).toBeDefined();
    expect(attr(ellipse!, 'cy')).toBe('59.5');
  });
});
