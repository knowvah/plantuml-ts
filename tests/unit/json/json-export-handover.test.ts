/**
 * jff-T2b (decisions.md D1): `renderJson` hands over what `JsonDiagram
 * #getTextBlock` returns (`this`, `JsonDiagram.java:140-142`) -- the block at
 * its own origin, sized by `calculateDimension`'s ink extent (`:130-137`) --
 * and core's `TextBlockExporter#exportTo` (`TextBlockExporter.java:159-177`)
 * adds the margin translate (`:173`), the factor over the chromed, margined
 * dimension (`:198-209`), and the canvas `trunc(dim + 1) x factor`
 * (`SvgGraphics.java:129-135,800-822`). Re-pointed from `scale-at-emit.test.ts`
 * (module deleted): the 1x-then-multiply arithmetic is unchanged, the margin
 * now arrives from the exporter instead of the layout.
 */
import { describe, it, expect } from 'vitest';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { assembleSvg, renderSync } from '../../../src/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import type { JsonGeometry, JsonNodeGeo, JsonEdgeGeo } from '../../../src/diagrams/json/layout.js';
import { jsonStylesOf } from '../../helpers/json-skin.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SCALE_2 = { kind: 'simple', factor: 2 } as const;
const SCALE_1_5 = { kind: 'simple', factor: 1.5 } as const;
/** `TitledDiagram#getDefaultMargins()` = `same(10)` (`TitledDiagram.java:274-277`). */
const MARGIN = 10;

function node(): JsonNodeGeo {
  return {
    id: 'n0',
    x: 0,
    y: 10,
    width: 200,
    height: 60,
    keyColWidth: 80,
    valueColWidth: 120,
    rows: [
      {
        key: 'name',
        value: 'Alice',
        valueType: 'string',
        valueLines: ['Alice'],
        highlight: false,
        arrayEntry: false,
        y: 4,
        height: 20,
        keyWidth: 30,
        valueLineWidths: [40],
        keyTextLength: 30,
        valueTextLengths: [40],
        keyBaselineY: 16,
        valueBaselineYs: [16],
        keyAtoms: [{ text: 'name', dx: 0, textLength: 30 }],
        valueAtoms: [[{ text: 'Alice', dx: 0, textLength: 40 }]],
      },
    ],
  };
}

function geoOf(overrides: Partial<JsonGeometry>): JsonGeometry {
  return { styles: jsonStylesOf('json'), nodes: [node()], edges: [], width: 379, height: 279, ...overrides };
}

/** The plugin's own assembly: `json/index.ts#render` stamps the diagram type that selects the export tail. */
const render = (geo: JsonGeometry, theme: Theme = defaultTheme): string =>
  assembleSvg({ ...renderJson(geo, theme), diagramType: 'JSON' });

const rootOpen = (svg: string): string => /^<svg[^>]*>/.exec(svg)?.[0] ?? '';

describe('renderJson -- the hand-over core expects', () => {
  it('is the raw block: extent size, same(10) margin, deferred numbers, no dpi and no baked margin', () => {
    const fragment = renderJson(geoOf({ width: 172.85, height: 79.2, scale: SCALE_2 }), defaultTheme);
    expect(fragment.width).toBe(172.85);
    expect(fragment.height).toBe(79.2);
    expect(fragment.exportMargin?.getTop()).toBe(MARGIN);
    expect(fragment.exportMargin?.getRight()).toBe(MARGIN);
    expect(fragment.exportMargin?.getBottom()).toBe(MARGIN);
    expect(fragment.exportMargin?.getLeft()).toBe(MARGIN);
    expect(fragment.scaleSpec).toEqual(SCALE_2);
    expect(fragment.numbersDeferred).toBe(true);
    // D5: StyleExtractor drops `skinparam dpi` (StyleExtractor.java:82-89).
    expect(fragment.dpi).toBeUndefined();
    expect(fragment.preChromeWidth).toBeUndefined();
    expect(fragment.documentMargin).toBeUndefined();
    expect(fragment.scaledCanvas).toBeUndefined();
  });

  it('carries no scaleSpec without a `scale` line', () => {
    expect('scaleSpec' in renderJson(geoOf({}), defaultTheme)).toBe(false);
  });

  it("takes a theme's document Margin over same(10) (TextBlockExporter.java:510-516)", () => {
    const theme: Theme = { ...defaultTheme, diagramMargin: { top: 1, right: 2, bottom: 3, left: 4 } };
    const fragment = renderJson(geoOf({}), theme);
    expect(fragment.exportMargin?.getTop()).toBe(1);
    expect(fragment.exportMargin?.getRight()).toBe(2);
    expect(fragment.exportMargin?.getBottom()).toBe(3);
    expect(fragment.exportMargin?.getLeft()).toBe(4);
    // node rect at (0 + 4, 10 + 1); canvas trunc(379 + 6 + 1) x trunc(279 + 4 + 1)
    const svg = render(geoOf({}), theme);
    expect(svg).toContain('<rect x="4" y="11" width="200" height="60"');
    expect(rootOpen(svg)).toContain('viewBox="0 0 386 284"');
  });

  it('the empty geometry (no nodes, no error) keeps its 0 x 0 pass-through', () => {
    expect(renderJson(geoOf({ nodes: [] }), defaultTheme)).toEqual({ body: '', width: 0, height: 0 });
  });
});

describe('scale at export -- lengths introduced after layout stay 1x until the multiply', () => {
  it('CELL_MARGIN_X is added at 1x: key text x = (node.x + 5 + 10) * 2', () => {
    // TextBlockUtils.withMargin(..., 5, 2) (TextBlockJson.java:348) runs before the
    // scale, the margin translate (TextBlockExporter.java:173) too: (0 + 5 + 10) * 2 = 30.
    const svg = render(geoOf({ scale: SCALE_2 }));
    expect(svg).toMatch(/<text x="30" y="/);
  });

  it('font-size, textLength and node geometry are all the 1x value times k', () => {
    const svg = render(geoOf({ scale: SCALE_2 }));
    expect(svg).toContain('font-size="28"');
    expect(svg).toContain('textLength="60"');
    // ((0, 10) + (10, 10)) * 2 = (20, 40)
    expect(svg).toContain('<rect x="20" y="40" width="400" height="120"');
  });

  it('VERY_FIRST_LINE is applied at 1x: the spot sits 13 back from the spline start', () => {
    // SmetanaForJson.java:173 / JsonCurve.java:119-121: supp(p0, p1, 13) at 1x.
    // p0 = (90, 40), p1 = (100, 40) -> spot (77, 40) -> + margin (87, 50) -> x2 (174, 100).
    const edge: JsonEdgeGeo = {
      points: [
        { x: 90, y: 40 },
        { x: 100, y: 40 },
      ],
      spline: false,
    };
    const svg = render(geoOf({ scale: SCALE_2, edges: [edge] }));
    expect(svg).toContain('<ellipse cx="174" cy="100" rx="6" ry="6"');
    expect(svg).toContain('d="M 174 100 L 200 100"');
  });

  it('ep is scaled with the points: the arrowhead is built at 1x then multiplied', () => {
    // Arrow#drawArrow at 1x: last point (140, 40), ep (150, 40) -> + margin (150, 50) / (160, 50):
    // barbs (150, 54) / (150, 46), notch (153, 50), tip (160, 50). Times 2:
    const edge: JsonEdgeGeo = {
      points: [
        { x: 80, y: 40 },
        { x: 100, y: 40 },
        { x: 120, y: 40 },
        { x: 140, y: 40 },
      ],
      ep: { x: 150, y: 40 },
      spline: true,
    };
    const svg = render(geoOf({ scale: SCALE_2, edges: [edge] }));
    expect(svg).toContain('d="M 300 108 L 306 100 L 300 92 L 320 100 L 300 108"');
  });

  it('the arrow dash is multiplied once, at export: skin LineStyle 3-3 -> 3,3 at 1x, 6,6 at scale 2', () => {
    // plantuml.skin:449-451 (`arrow { LineStyle 3-3 }`); jar-verified on json/timafu-94-bixe774.
    const edge: JsonEdgeGeo = {
      points: [
        { x: 90, y: 40 },
        { x: 100, y: 40 },
      ],
      spline: false,
    };
    expect(render(geoOf({ scale: SCALE_2, edges: [edge] }))).toContain('stroke-dasharray="6,6"');
    expect(render(geoOf({ edges: [edge] }))).toContain('stroke-dasharray="3,3"');
  });
});

describe('scale at export -- the document size', () => {
  it('is (int)(extent + 20 + 1) * k: 172.85 -> 193 -> 386, never trunc(193.85 * 2) = 387', () => {
    // TextBlockExporter.java:198-203 (dim = 192.85), SvgGraphics.java:129-131 (maxX = 193),
    // :800-811 (format(maxX * scale)); jar-verified on yaml/nuzaje-74-kenu009 (width 386 at scale 2).
    const svg = render(geoOf({ scale: SCALE_2, width: 172.85, height: 79.2 }));
    expect(svg).toContain('viewBox="0 0 386 200"');
    expect(svg).toContain('width="386px" height="200px"');
  });

  it('writes the root width/height as format(maxX * k) at 3 decimals, viewBox truncated', () => {
    // maxX = 193, k = 1.5 -> 289.5 (viewBox 289); maxY = 100 -> 150.
    const svg = render(geoOf({ scale: SCALE_1_5, width: 172.85, height: 79.2 }));
    expect(svg).toContain('width="289.5px" height="150px"');
    expect(svg).toContain('viewBox="0 0 289 150"');
  });

  it('resolves the factor against extent + margin, not against the canvas', () => {
    // `scale 193 width`: computeScaleFactor reads calculateFinalDimension() = 173 + 20 = 193
    // (TextBlockExporter.java:205-209) -> factor 1, canvas trunc(194) = 194. Resolved
    // against the canvas (194) it would be 0.995 (193.03); against the bare extent, 1.116.
    const svg = render(geoOf({ scale: { kind: 'width', target: 193 }, width: 173, height: 79 }));
    expect(rootOpen(svg)).toContain('width="194px" height="100px"');
  });

  it('an unscaled diagram: canvas trunc(extent + 21), body shifted by (10, 10)', () => {
    const svg = render(geoOf({ width: 172.85, height: 79.2 }));
    expect(rootOpen(svg)).toContain('width="193px" height="100px"');
    expect(svg).toContain('<rect x="10" y="20" width="200" height="60"');
  });
});

describe('the special pages', () => {
  const failure = (): JsonGeometry =>
    geoOf({
      nodes: [],
      width: 230.388 + 10,
      height: 14 + 4,
      error: 'Your data does not sound like JSON data',
      errorLayout: { x: 5, y: 12.5, textLength: 230.388 },
    });

  it('parse failure: the withMargin(5, 2) block at its origin, the exporter margins it', () => {
    // JsonDiagram.java:116-121; jar json/nixaxa-46-muge983: trunc(240.388 + 21) = 261, trunc(18 + 21) = 39.
    const fragment = renderJson(failure(), defaultTheme);
    expect(fragment.width).toBe(240.388);
    expect(fragment.height).toBe(18);
    expect(fragment.exportMargin?.getLeft()).toBe(MARGIN);
    const svg = render(failure());
    expect(rootOpen(svg)).toContain('viewBox="0 0 261 39"');
    expect(svg).toMatch(/<text x="15" y="22.5" [^>]*textLength="230.388"/);
  });

  it('parse failure under `scale 2`: the page is scaled too (one exporter for both drawU branches)', () => {
    const svg = render({ ...failure(), scale: SCALE_2 });
    expect(rootOpen(svg)).toContain('width="522px" height="78px"');
    expect(svg).toMatch(/<text x="30" y="45" [^>]*font-size="28"/);
  });

  it('handwritten: the extent is the jiggled ink span, wrapped once (JsonDiagram.java:113-115)', () => {
    const theme: Theme = { ...defaultTheme, handwritten: true };
    const fragment = renderJson(geoOf({}), theme);
    // The span of a jiggled 200 x 60 rect: within the jiggle of the rect, never + the margins.
    expect(fragment.width).toBeGreaterThan(190);
    expect(fragment.width).toBeLessThan(230);
    expect(fragment.height).toBeGreaterThan(50);
    expect(fragment.height).toBeLessThan(90);
    // exportTo adds no second sketchy pass: the assembled document draws the fragment's own
    // polygons, every one shifted by the margin, none added.
    const svg = render(geoOf({}), theme);
    const count = (s: string): number => (s.match(/<polygon /g) ?? []).length;
    expect(count(fragment.body)).toBeGreaterThan(0);
    expect(count(svg)).toBe(count(fragment.body));
    expect(rootOpen(svg)).toContain(
      `viewBox="0 0 ${Math.trunc(fragment.width + 21)} ${Math.trunc(fragment.height + 21)}"`,
    );
  });
});

describe('title + scale end to end (jar oracles tests/fixtures/json/title-scale*.svg)', () => {
  const measurer = (): DeterministicMeasurer => new DeterministicMeasurer();

  it('the title is drawn through the scaled exporter: font-size 14 x 1.5 = 21 at (20, 30.889) x 1.5', () => {
    const svg = renderSync(
      '@startjson\ntitle A Rather Long Title For The Scaled Diagram\nscale 1.5\n{"a": [1, 2], "b": "x"}\n@endjson',
      { measurer: measurer(), filename: 'in.puml' },
    );
    expect(rootOpen(svg)).toContain('width="477px" height="153px"');
    expect(svg).toContain('<text x="30" y="46.333" fill="#000" font-size="21" textLength="415.406"');
  });

  it('`scale max 200 width` resolves over the chromed, margined dimension: root height 59.236px', () => {
    const svg = renderSync(
      '@startjson\ntitle Title Max Width\nscale max 200 width\n{"alpha": "a fairly long value to force a wide node", "b": 2}\n@endjson',
      { measurer: measurer(), filename: 'in.puml' },
    );
    expect(rootOpen(svg)).toContain('width="200px" height="59.236px" viewBox="0 0 200 59"');
    expect(svg).toContain('<text x="68.973" y="19.674" fill="#000" font-size="8.917" textLength="61.417"');
  });
});
