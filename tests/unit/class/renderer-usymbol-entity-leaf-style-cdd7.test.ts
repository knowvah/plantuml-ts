/**
 * cdd7 T2b (xuloxo-85-vibu502, journal row 13): two `styleTitle` reads of
 * the class USymbol leaf draw that were hard-coded.
 *
 * - RoundCorner / DiagonalCorner (`EntityImageDescription.java:168-169`)
 *   come off the stereotype-signed `styleTitle` (`withTOBECHANGED`,
 *   `:151-153`), so `skinparam rectangle<<person>> { RoundCorner 0 }`
 *   (`FromSkinparamToStyle.java:275-276`, re-signed at +1000 `:396-408`)
 *   squares that leaf, and a `DiagonalCorner` draws `USymbolRectangle`'s
 *   octagon (`USymbolRectangle.java:65-71`).
 * - The title alignment (`:175`, `styleTitle.getHorizontalAlignment()`) --
 *   `skinparam defaultTextAlignment` is `PName.HorizontalAlignment` on
 *   `SName.root` (`FromSkinparamToStyle.java:155`), over `plantuml.skin:12`'s
 *   `root { HorizontalAlignment left }`; `usecase` keeps its own CENTER
 *   (`plantuml.skin:452-454`, the more specific selector).
 *
 * Expected values: oracle probes (`scripts/oracle-render.sh`,
 * 1.2026.8beta1) of the exact sources below.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();

const CORNERS = [
  '@startuml',
  'allowmixing',
  'class A',
  'skinparam rectangle<<person>> {',
  '  RoundCorner 0',
  '}',
  'rectangle P <<person>> [',
  'wide line here',
  'x',
  ']',
  'rectangle "plain" as Q',
  '@enduml',
].join('\n');

const OCTAGON = [
  '@startuml',
  'allowmixing',
  'class A',
  'skinparam rectangle<<box8>> {',
  '  RoundCorner 0',
  '  DiagonalCorner 10',
  '}',
  'rectangle "D" <<box8>> as D',
  '@enduml',
].join('\n');

/** The jar's octagon for `D` (`M16,129 L63.938,129 L73.938,139 L73.938,167
 *  L63.938,177 L16,177 L6,167 L6,139 L16,129`), as offsets from its first
 *  vertex -- the leaf's own shape, independent of the document offset (see
 *  the octagon test's comment). */
const JAR_OCTAGON_OFFSETS = [
  [0, 0],
  [47.938, 0],
  [57.938, 10],
  [57.938, 38],
  [47.938, 48],
  [0, 48],
  [-10, 38],
  [-10, 10],
  [0, 0],
];

/** 2-dp rounding: the SVG writer's 3-dp formatting leaves ±0.001 between
 *  two differenced coordinates. */
function round2(v: number): number {
  return Math.round(v * 100) / 100 + 0;
}

function pathOffsets(leaf: string): number[][] {
  const d = /<path d="([^"]+)"/.exec(leaf)![1]!;
  const pts = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const [x0, y0] = pts[0]!;
  return pts.map(([x, y]) => [round2(x! - x0!), round2(y! - y0!)]);
}

const ALIGN = [
  '@startuml',
  'allowmixing',
  'class A',
  'skinparam defaultTextAlignment center',
  'rectangle P [',
  'wide line here',
  'x',
  ']',
  'usecase U [',
  'wide line here',
  'x',
  ']',
  '@enduml',
].join('\n');

function leafOf(svg: string, id: string): string {
  const start = svg.indexOf(`<!--entity ${id}-->`);
  return svg.slice(start, svg.indexOf('</g>', start));
}

function texts(leaf: string): string[][] {
  return [...leaf.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => [m[1]!, m[2]!, m[3]!]);
}

describe('class USymbol leaf corners follow <sname>RoundCorner/DiagonalCorner<<label>>', () => {
  const svg = renderSync(CORNERS, { measurer });

  it('squares the <<person>> leaf (no rx/ry)', () => {
    expect(leafOf(svg, 'P')).toContain(
      '<rect x="87.46" y="7" width="98.75" height="62" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/>',
    );
  });

  it('keeps the default rounded corner on an unlabelled leaf', () => {
    expect(leafOf(svg, 'Q')).toContain(
      '<rect x="7" y="129" width="49.662" height="34" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;" rx="2.5" ry="2.5"/>',
    );
  });

  // The octagon is a `UPath` (`URectangle#diagonalCorner`), whose ink
  // `LimitFinder` bounds exactly, where a `URectangle`'s ink starts 1px
  // up-left; the class engine's leaf-ink model still reserves rect ink for it
  // (`class-layout-description-leaf-ink.ts`, a reported residual), so the
  // document sits 1px right of the jar's. The SHAPE is asserted here.
  it('draws the <<box8>> leaf as the diagonal-corner octagon', () => {
    expect(pathOffsets(leafOf(renderSync(OCTAGON, { measurer }), 'D'))).toEqual(
      JAR_OCTAGON_OFFSETS.map(([x, y]) => [round2(x!), round2(y!)]),
    );
  });
});

describe('class USymbol leaf title follows skinparam defaultTextAlignment', () => {
  const svg = renderSync(ALIGN, { measurer });

  it('centres a rectangle leaf body under the root alignment', () => {
    expect(texts(leafOf(svg, 'P'))).toEqual([
      ['123.89', '27.889', 'wide line here'],
      ['159.765', '41.889', 'x'],
    ]);
  });

  it('keeps the usecase leaf centred (its own skin selector)', () => {
    expect(texts(leafOf(svg, 'U')).map((t) => t[0])).toEqual(['18.89', '54.765']);
  });
});
