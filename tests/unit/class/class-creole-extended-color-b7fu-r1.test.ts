/**
 * cdd-B7FU-R1 — `<back:>`/`<u:>`/`<s:>`/`<w:>` extended colour, and the
 * base-face weight `<plain>` cannot clear, end to end through `renderSync`
 * on the four corpus sources that motivated them.
 *
 * Every expected value is the jar's own, read off the cached oracles:
 *   - `class/ziripa-77-zizo842/in.svg` — note line: `<u:#FF0000>toto</u>`
 *     draws `<line x1="39.544" y1="81.54" x2="61.156" y2="81.54"
 *     style="stroke:#F00;stroke-width:0.464;"/>` right after its `<text>`;
 *     `<w:green>green</w>` keeps `text-decoration="wavy underline"`;
 *     `<s:#00FFFF>strike</s>` draws its rule at y=77.361; `<back:red>ok`
 *     carries `filter="url(#…)"` and the document's ONE `<filter>` is
 *     `<feFlood flood-color="#FF0000" result="flood"/>` + `<feComposite …>`.
 *   - `class/beruje-75-jimu270/in.svg` — a member row's `<back:#FFF000>`.
 *   - `class/galili-87-zivo129/in.svg` — footer AND legend both `<back:red>`
 *     share ONE filter def in `<defs>`.
 *   - `class/diseka-11-gozu390/in.svg` — `font-weight="700"` survives
 *     `<plain>` because the base face, not `styles`, carries it.
 *
 * The filter `@id` VALUE is deliberately not asserted against the jar's:
 * upstream's is seed-derived per document (`SvgGraphics.java:160,763-767`),
 * a known cross-engine divergence recorded in decision-journal row 62. What
 * is asserted is the invariant that survives it — same colour, same id,
 * one def.
 */
import { describe, expect, test } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

function svgOf(source: string): string {
  return renderSync(source, { measurer: new WidthTableMeasurer() });
}

function defsOf(svg: string): string {
  const start = svg.indexOf('<defs');
  const end = svg.indexOf('</defs>');
  return end === -1 ? '' : svg.slice(start, end + '</defs>'.length);
}

const ZIRIPA = [
  '@startuml',
  'title this is a title',
  'footer footer',
  'header header',
  'class Bob',
  'class Alice',
  'note left of Alice',
  '  hello <u:#FF0000>toto</u> and <w:green>green</w> and <s:#00FFFF>strike</s> <back:red>ok</back>.',
  'end note',
  '@enduml',
].join('\n');

const BERUJE = [
  '@startuml',
  'class Temp {',
  '    int toto',
  '   <back:#FFF000>string nouvelAttributi</back>',
  '   <s>strike</s>',
  '   <w>This is wave</w>',
  '}',
  '@enduml',
].join('\n');

const GALILI = [
  '@startuml',
  'footer <back:red>some footer',
  'legend',
  '<back:red>The legend',
  'end legend',
  'class foo',
  '@enduml',
].join('\n');

describe('cdd-B7FU-R1 — coloured underline/strike lines (ziripa-77-zizo842)', () => {
  const svg = svgOf(ZIRIPA);

  // The emitted `y` keeps full float precision on this path (the note
  // renderer's own `<text y="80.61099999999999">` does too, pre-existing and
  // invisible to `compareSvg`, which normalizes to 6 significant figures) --
  // so the coordinates are compared numerically, not as substrings.
  function lineAttrs(stroke: string): Record<string, number> {
    const m = new RegExp(
      `<line x1="([\\d.]+)" y1="([\\d.]+)" x2="([\\d.]+)" y2="([\\d.]+)" stroke="${stroke}" stroke-width="([\\d.]+)"/>`,
    ).exec(svg);
    expect(m).not.toBeNull();
    const n = (i: number): number => Number(m?.[i]);
    return { x1: n(1), y1: n(2), x2: n(3), y2: n(4), strokeWidth: n(5) };
  }

  test('`<u:#FF0000>` draws a shortened-stroke rule at baseline + size/14', () => {
    const a = lineAttrs('#F00');
    expect(a.x1).toBeCloseTo(39.544, 3);
    expect(a.x2).toBeCloseTo(61.156, 3);
    expect(a.y1).toBeCloseTo(81.54, 3);
    expect(a.y2).toBeCloseTo(81.54, 3);
    expect(a.strokeWidth).toBeCloseTo(0.464, 3);
  });

  test('`<s:#00FFFF>` draws its rule ABOVE the baseline, at -size/4', () => {
    const a = lineAttrs('#0FF');
    expect(a.x1).toBeCloseTo(137.775, 3);
    expect(a.x2).toBeCloseTo(168.812, 3);
    expect(a.y1).toBeCloseTo(77.361, 3);
    expect(a.strokeWidth).toBeCloseTo(0.464, 3);
  });

  test('`<w:green>` keeps the plain CSS wave — WAVE has no extended-colour arm', () => {
    expect(svg).toMatch(/<text[^>]*text-decoration="wavy underline"[^>]*>green<\/text>/);
  });

  test('neither coloured run keeps a CSS text-decoration', () => {
    expect(svg).not.toMatch(/<text[^>]*text-decoration="underline"[^>]*>toto</);
    expect(svg).not.toMatch(/<text[^>]*text-decoration="line-through"[^>]*>strike</);
  });

  test('`<back:red>` registers exactly one feFlood filter, referenced by its run', () => {
    const id = /<filter id="([^"]+)"/.exec(defsOf(svg))?.[1];
    expect(id).toBeDefined();
    expect(defsOf(svg)).toBe(
      `<defs><filter id="${id ?? ''}" x="0" y="0" width="1" height="1">` +
        '<feFlood flood-color="#FF0000" result="flood"/>' +
        '<feComposite in="SourceGraphic" in2="flood" operator="over"/></filter></defs>',
    );
    expect(svg).toMatch(new RegExp(`<text[^>]*filter="url\\(#${id ?? ''}\\)"[^>]*>ok</text>`));
  });
});

describe('cdd-B7FU-R1 — `<back:>` on a member row (beruje-75-jimu270)', () => {
  const svg = svgOf(BERUJE);

  test('the row carries the filter and the def carries its exact colour', () => {
    const id = /<filter id="([^"]+)"/.exec(defsOf(svg))?.[1] ?? '';
    expect(defsOf(svg)).toContain('<feFlood flood-color="#FFF000" result="flood"/>');
    expect(svg).toMatch(new RegExp(`<text[^>]*filter="url\\(#${id}\\)"`));
  });

  test('the colourless `<s>`/`<w>` rows keep their CSS decorations', () => {
    expect(svg).toMatch(/<text[^>]*text-decoration="line-through"[^>]*>strike</);
    expect(svg).toMatch(/<text[^>]*text-decoration="wavy underline"[^>]*>This is wave</);
  });
});

describe('cdd-B7FU-R1 — two chrome elements, one colour, one def (galili-87-zivo129)', () => {
  const svg = svgOf(GALILI);

  test('footer and legend share a single `<filter>`, as one SvgGraphics would', () => {
    expect([...svg.matchAll(/<filter /g)]).toHaveLength(1);
    const id = /<filter id="([^"]+)"/.exec(defsOf(svg))?.[1] ?? '';
    expect([...svg.matchAll(new RegExp(`filter="url\\(#${id}\\)"`, 'g'))]).toHaveLength(2);
  });
});

describe('cdd-B7FU-R1 — base face vs styles (diseka-11-gozu390)', () => {
  test('`<plain>` clears the tracked styles but not the skinparam face weight', () => {
    const svg = svgOf(
      [
        '@startuml',
        'skinparam classFontStyle bold',
        'enum BookCategory as "<color:#888888><plain>Enumeration</plain></color>\\nBookCategory"',
        '@enduml',
      ].join('\n'),
    );
    expect(svg).toMatch(/<text[^>]*font-weight="700"[^>]*>Enumeration<\/text>/);
  });

  test('a header with NO bold skinparam stays unweighted through `<plain>`', () => {
    const svg = svgOf(['@startuml', 'enum BookCategory as "<plain>Enumeration</plain>"', '@enduml'].join('\n'));
    expect(svg).toMatch(/<text[^>]*>Enumeration<\/text>/);
    expect(svg).not.toMatch(/<text[^>]*font-weight[^>]*>Enumeration</);
  });
});
