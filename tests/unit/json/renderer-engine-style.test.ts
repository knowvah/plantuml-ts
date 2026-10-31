/**
 * jse T2b: the json renderer paints from the jar's styles (`JsonGeometry.styles`), not from the
 * `Theme.colors.graph.json` projection. Every expectation is a value read off a jar oracle
 * (`tests/fixtures/json/<slug>.svg`) or the Java line named beside it.
 *
 * `TextBlockJson.java:260-330` (`drawU`), `:138-152` (`getStyleToUse`), `SmetanaForJson.java:119-176`.
 */
import { describe, expect, it } from 'vitest';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { JsonEdgeGeo, JsonGeometry, JsonNodeGeo, JsonRowGeo } from '../../../src/diagrams/json/layout.js';
import { jsonStylesOf } from '../../helpers/json-skin.js';

const ROW: JsonRowGeo = {
  key: 'a',
  value: '1',
  valueType: 'number',
  valueLines: ['1'],
  highlight: false,
  arrayEntry: false,
  y: 0,
  height: 18,
  keyWidth: 17.787,
  valueLineWidths: [12.55],
  keyTextLength: 7.787,
  valueTextLengths: [7.787],
  keyBaselineY: 12.889,
  valueBaselineYs: [12.889],
  keyAtoms: [{ text: 'a', dx: 0, textLength: 7.787 }],
  valueAtoms: [[{ text: '1', dx: 0, textLength: 7.787 }]],
};

/** At the block origin: jff-T2b's exporter adds the same(10) margin
 *  (`TextBlockExporter.java:173`), so the oracle coordinates stay (10, 10). */
const NODE: JsonNodeGeo = {
  id: 'n0',
  x: 0,
  y: 0,
  width: 39.338,
  height: 36,
  keyColWidth: 17.787,
  valueColWidth: 21.55,
  rows: [ROW, { ...ROW, key: 'b', y: 18 }],
};

const EDGE: JsonEdgeGeo = {
  points: [
    { x: 37, y: 32 },
    { x: 50, y: 32 },
    { x: 60, y: 32 },
    { x: 70, y: 30 },
    { x: 79, y: 27 },
  ],
  spline: true,
  ep: { x: 86.4, y: 25.3 },
};

function styled(directives: string, rows: JsonRowGeo[] = NODE.rows, extra: Partial<JsonGeometry> = {}): string {
  const geo: JsonGeometry = {
    styles: jsonStylesOf('json', directives),
    nodes: [{ ...NODE, rows }],
    edges: [],
    width: 100,
    height: 80,
    ...extra,
  };
  // The plugin's own stamp (`json/index.ts#render`): it routes the fragment
  // through the json export tail (`assemble-svg.ts#finalizeJsonFragment`).
  return assembleSvg({ ...renderJson(geo, defaultTheme), diagramType: 'JSON' });
}

const css = (block: string): string => `<style>\njsonDiagram {\n${block}\n}\n</style>`;
const texts = (svg: string): string[] => svg.match(/<text [^>]*>[^<]*<\/text>/g) ?? [];

describe('node fill and stroke (TextBlockJson.java:281-284)', () => {
  it('a gradient BackGroundColor is lifted into one <defs> linearGradient and both node rects use it', () => {
    // oracle: tests/fixtures/json/theme-cerulean.svg -- `node { BackGroundColor #2FA4E7-#2683B9 }`,
    // fill AND stroke `url(#g…)`, the border rect stroked `#2683B9`.
    const svg = styled(css('node {\nBackGroundColor #2FA4E7-#2683B9\nLineColor #2683B9\nRoundCorner 20\n}'));
    const id = /<linearGradient id="([^"]+)"/.exec(svg)?.[1];
    expect(id).toBeDefined();
    expect(svg.match(/<linearGradient/g)).toHaveLength(1);
    expect(svg).toContain('<stop offset="0%" stop-color="#2FA4E7"/>');
    expect(svg).toContain('<stop offset="100%" stop-color="#2683B9"/>');
    expect(svg).toContain(`fill="url(#${id})" stroke="url(#${id})"`);
    expect(svg).toContain('fill="none" stroke="#2683B9"');
    // RoundCorner 20 reaches the SVG halved (`DriverRectangleSvg.java:78`).
    expect(svg).toContain('rx="10" ry="10"');
  });

  it('a solid node paints the skin defaults: fill #F1F1F1, border #000 at 1.5, rx 5', () => {
    const svg = styled('');
    expect(svg).toContain('fill="#F1F1F1" stroke="#F1F1F1" stroke-width="1.5" rx="5" ry="5"');
    expect(svg).toContain('fill="none" stroke="#000" stroke-width="1.5" rx="5" ry="5"');
  });

  it('a node LineStyle is a dasharray on both node rects', () => {
    const svg = styled(css('node {\nLineStyle 4-2\n}'));
    expect(svg.match(/<rect [^>]*stroke-dasharray="4,2"/g)).toHaveLength(2);
    // the separator style is `node+separator`, so it inherits the dash (`TextBlockJson.java:286-288`).
    expect(svg.match(/<line [^>]*stroke-dasharray="4,2"/g)).toHaveLength(3);
  });
});

describe('cell fonts come from the style the cell was measured with (getStyleToUse)', () => {
  it('the header style colours the key cell and leaves the value cell on the node colour', () => {
    // oracle: tests/fixtures/json/style-header-separator-arrow.svg -- key `#F00` bold, value `#000`.
    const svg = styled(css('header {\nFontColor red\n}'));
    expect(texts(svg).slice(0, 2)).toEqual([
      '<text x="15" y="22.889" font-size="14" font-weight="700" fill="#F00">a</text>',
      '<text x="32.787" y="22.889" font-size="14" fill="#000">1</text>',
    ]);
  });

  it('a highlight FontStyle italic REPLACES the header bold on that row only', () => {
    // oracle: tests/fixtures/json/style-highlight-block.svg -- row a: blue italic, no weight; row b bold.
    const rows = [
      { ...ROW, highlight: '' },
      { ...ROW, key: 'b', y: 18 },
    ];
    const svg = styled(css('highlight {\nFontColor blue\nFontStyle italic\n}'), rows);
    const [k1, v1, k2] = texts(svg);
    expect(k1).toContain('font-style="italic" fill="#00F"');
    expect(k1).not.toContain('font-weight');
    expect(v1).toContain('font-style="italic" fill="#00F"');
    expect(k2).toContain('font-weight="700"');
  });

  it('each cell carries its own style font size', () => {
    // `header { FontSize 20 }` (tests/fixtures/json/header-fontsize.puml): key 20, value 14.
    const [key, value] = texts(styled(css('header {\nFontSize 20\n}')));
    expect(key).toContain('font-size="20"');
    expect(value).toContain('font-size="14"');
  });

  it('a non-bold CSS weight is written verbatim (DriverTextSvg.java:106-108)', () => {
    const [key, value] = texts(styled(css('node {\nFontWeight 300\n}')));
    expect(key).toContain('font-weight="300"');
    expect(value).toContain('font-weight="300"');
  });

  it('the nested value cell keeps the value font colour (the key colour never reaches it)', () => {
    const rows = [{ ...ROW, valueType: 'nested' as const, value: '   ', valueLines: ['   '] }];
    const [key, value] = texts(styled(css('header {\nFontColor red\n}'), rows));
    expect(key).toContain('fill="#F00"');
    expect(value).toContain('fill="#000"');
  });

  it('multiplies each cell font size by the scale factor', () => {
    const svg = styled(css('header {\nFontSize 20\n}'), NODE.rows, { scale: { kind: 'simple', factor: 2 } });
    const [key, value] = texts(svg);
    expect(key).toContain('font-size="40"');
    expect(value).toContain('font-size="28"');
  });
});

describe('separator and highlight rect (TextBlockJson.java:286-300)', () => {
  it('separators and column dividers take the node+separator stroke', () => {
    // oracle: style-header-separator-arrow.svg -- `separator { LineColor blue; LineThickness 3 }`.
    const svg = styled(css('separator {\nLineColor blue\nLineThickness 3\n}'));
    expect(svg.match(/<line [^>]*stroke="#00F" stroke-width="3"/g)).toHaveLength(3);
  });

  it('a stereotyped highlight fills with the withTOBECHANGED(<<warn>>) style and strokes like the separator', () => {
    // oracle: tests/fixtures/json/highlight-stereotype.svg -- `.warn { BackGroundColor orange }` => #FFA500.
    const rows = [
      { ...ROW, highlight: 'warn' },
      { ...ROW, key: 'b', y: 18 },
    ];
    const svg = styled(css('highlight {\nBackGroundColor red\n}\n.warn {\nBackGroundColor orange\n}'), rows);
    expect(svg).toContain(
      '<rect x="11.5" y="10" width="37.338" height="18" fill="#FFA500" stroke="#FFA500" stroke-width="1" rx="2" ry="2"/>',
    );
    expect(svg).not.toContain('#F00');
  });

  it('an unstereotyped highlight uses the highlight block, not the class', () => {
    const rows = [{ ...ROW, highlight: '' }];
    const svg = styled(css('highlight {\nBackGroundColor red\n}\n.warn {\nBackGroundColor orange\n}'), rows);
    expect(svg).toContain('fill="#F00" stroke="#F00" stroke-width="1" rx="2" ry="2"');
  });

  it('a gradient highlight fill goes through the same defs path', () => {
    const rows = [{ ...ROW, highlight: '' }];
    const svg = styled(css('highlight {\nBackGroundColor red-yellow\n}'), rows);
    expect(svg.match(/<linearGradient/g)).toHaveLength(1);
    expect(svg).toMatch(/<rect x="11.5"[^>]*fill="url\(#[^)]+\)"/);
  });
});

describe('arrow (SmetanaForJson.java:119-122,172-176)', () => {
  const arrowSvg = (block: string, extra: Partial<JsonGeometry> = {}): string =>
    styled(css(block), NODE.rows, { edges: [EDGE], ...extra });

  it('strokes the curve, fills the head and the spot with the arrow LineColor at its LineThickness', () => {
    // oracle: style-header-separator-arrow.svg -- `arrow { LineColor green; LineThickness 2 }` => #008000, 2.
    const svg = arrowSvg('arrow {\nLineColor green\nLineThickness 2\n}');
    expect(svg).toContain('fill="none" stroke="#008000" stroke-width="2" stroke-dasharray="3,3"');
    expect(svg).toMatch(/<path d="[^"]*" fill="#008000"\/>/);
    // `JsonCurve#drawSpot` strokes with `UStroke.simple()` -- width 1 whatever the arrow's own.
    expect(svg).toMatch(/<ellipse [^>]*rx="3" ry="3" fill="#008000" stroke="#008000" stroke-width="1"\/>/);
  });

  it('a cleared LineStyle draws a solid line (UStroke.withThickness)', () => {
    expect(arrowSvg('arrow {\nLineStyle 0\n}')).not.toContain('stroke-dasharray');
  });

  it('scales the arrow thickness and dash by the diagram scale', () => {
    const svg = arrowSvg('arrow {\nLineThickness 2\n}', { scale: { kind: 'simple', factor: 2 } });
    expect(svg).toContain('stroke-width="4" stroke-dasharray="6,6"');
  });
});
