/**
 * CDD T18 — the class colour seam speaks `Paint`, not `string`.
 *
 * Upstream has ONE colour parser for every caller
 * (`klimt/color/HColorSet.java:107-116`: the separator scan that turns
 * `color1<sep>color2` into `HColors.gradient(...)`) and ONE gradient
 * emission path (`klimt/drawing/svg/SvgGraphics.java:365-408
 * #createSvgGradient`). This port had two class-only paths that bypassed
 * both: the `class*Color`/`icon*Color` dedicated skinparam keys, which took
 * `skinparam-key-normalize.ts#resolveColor`'s flatten-to-solid helper, and
 * a classifier's own inline `#colour` declaration override, which took
 * `resolveColorToSvgHex` on a raw string. Both emitted the unsplit source
 * text straight into `fill=`/`stroke=` (`fill="#yellow\FFFFFF"`).
 *
 * The divider-line case is NOT a gradient: upstream's `ULine` driver
 * flattens a gradient stroke to its FIRST colour
 * (`klimt/drawing/svg/DriverLineSvg.java:76-82`:
 * `if (color instanceof HColorGradient) svg.setStrokeColor(gr.getColor1()
 * .toSvg(mapper))`), while the rectangle driver emits a real def
 * (`DriverRectangleSvg.java:97-111 #applyStrokeColor`). Jar-verified by
 * `capode-04-jeka075`: box `stroke="url(#…)"`, both divider lines
 * `stroke="#FFBD42"`.
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(markup: string): string {
  return renderFixtureClass(markup, new DeterministicMeasurer());
}

/** Every `<linearGradient …>` opening tag in `svg`, in document order. */
function gradientDefs(svg: string): string[] {
  return [...svg.matchAll(/<linearGradient [^>]*>/g)].map((m) => m[0]);
}

/** Every `stroke="…"`/`style="stroke:…"` value on a `<line>` element. */
function lineStrokes(svg: string): string[] {
  return [...svg.matchAll(/<line [^>]*>/g)].map((m) => /stroke="([^"]*)"/.exec(m[0])?.[1] ?? '');
}

/** The first `<rect>`'s attribute `name` value. */
function firstRectAttr(svg: string, name: string): string | undefined {
  const rect = /<rect [^>]*>/.exec(svg)?.[0] ?? '';
  return new RegExp(`${name}="([^"]*)"`).exec(rect)?.[1];
}

describe('T18: dedicated `classBorderColor` gradient (capode-04-jeka075)', () => {
  const svg = render(['@startuml', 'class Foo', 'skinparam classBorderColor    #FFBD42-white', '@enduml'].join('\n'));

  it('emits exactly one <linearGradient> def for the border gradient', () => {
    expect(gradientDefs(svg)).toHaveLength(1);
    // `-` is `SvgGraphics.java:381-385`'s vertical vector.
    expect(gradientDefs(svg)[0]).toContain('x1="50%"');
    expect(gradientDefs(svg)[0]).toContain('y1="0%"');
    expect(gradientDefs(svg)[0]).toContain('x2="50%"');
    expect(gradientDefs(svg)[0]).toContain('y2="100%"');
    expect(svg).toContain('stop-color="#FFBD42"');
  });

  it('strokes the box outline with url(#…)', () => {
    expect(firstRectAttr(svg, 'stroke')).toMatch(/^url\(#g[0-9a-z]+\)$/);
  });

  it('strokes both inner divider lines with the FLAT first colour', () => {
    // `DriverLineSvg.java:76-82` -- a ULine never gets a gradient def.
    expect(lineStrokes(svg)).toEqual(['#FFBD42', '#FFBD42']);
  });
});

describe('T18: every gradient separator on a dedicated key (taceve-49-mezi408)', () => {
  // `HColorSet.java:107-116` scans for `-`, `\`, `|`, `/` in that char
  // order; the policy selects the vector in `SvgGraphics.java:367-395`.
  const cases: ReadonlyArray<readonly [sep: string, spec: string, x1: string, y1: string]> = [
    ['-', '#yellow-blue', '50%', '0%'],
    ['\\', '#yellow\\FFFFFF', '0%', '100%'],
    ['/', '#yellow/blue', '0%', '0%'],
    ['|', '#yellow|blue', '0%', '50%'],
  ];

  for (const [sep, spec, x1, y1] of cases) {
    it(`resolves \`${sep}\` (${spec}) to a gradient fill`, () => {
      const svg = render(['@startuml', `skinparam classBackgroundColor ${spec}`, 'class Red', '@enduml'].join('\n'));
      expect(gradientDefs(svg)).toHaveLength(1);
      expect(gradientDefs(svg)[0]).toContain(`x1="${x1}"`);
      expect(gradientDefs(svg)[0]).toContain(`y1="${y1}"`);
      expect(firstRectAttr(svg, 'fill')).toMatch(/^url\(#g[0-9a-z]+\)$/);
    });
  }

  it('resolves a classifier INLINE declaration gradient the same way', () => {
    const svg = render(['@startuml', 'class Test1 #yellow\\FFFFFF', '@enduml'].join('\n'));
    expect(gradientDefs(svg)).toHaveLength(1);
    expect(firstRectAttr(svg, 'fill')).toMatch(/^url\(#g[0-9a-z]+\)$/);
  });
});

describe('T18: plain-hex dedicated keys stay solid (regression guard)', () => {
  it('leaves `classBackgroundColor #AABBCC` as a flat fill with no def', () => {
    const svg = render(['@startuml', 'skinparam classBackgroundColor #AABBCC', 'class Red', '@enduml'].join('\n'));
    expect(gradientDefs(svg)).toHaveLength(0);
    // Rule 2 shortening (`svg-format.ts#shortenColor`) is unaffected.
    expect(firstRectAttr(svg, 'fill')).toBe('#ABC');
  });

  it('leaves `classBorderColor #FF00FF` as a flat stroke on box AND dividers', () => {
    const svg = render(['@startuml', 'skinparam classBorderColor #FF00FF', 'class Foo', '@enduml'].join('\n'));
    expect(gradientDefs(svg)).toHaveLength(0);
    expect(firstRectAttr(svg, 'stroke')).toBe('#F0F');
    expect(lineStrokes(svg)).toEqual(['#F0F', '#F0F']);
  });

  it('keeps an UNPARSEABLE dedicated-key value on `getColorOrWhite`s WHITE', () => {
    // `HColorSet.java:58-63` -- the CodeQL js/html-constructed-from-input
    // guard `skinparam-key-normalize.ts#resolveColor` installed must survive
    // the widening: a non-colour token never reaches `fill=` verbatim.
    const svg = render(['@startuml', 'skinparam classBackgroundColor x"onload="y', 'class Red', '@enduml'].join('\n'));
    expect(svg).not.toContain('onload');
    expect(firstRectAttr(svg, 'fill')).toBe('#FFF');
  });
});
