import { describe, it, expect } from 'vitest';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import { defaultTheme, resolveTheme } from '../../../src/core/theme.js';
import type { JsonGeometry, JsonNodeGeo, JsonEdgeGeo, JsonRowGeo } from '../../../src/diagrams/json/layout.js';
import type { Theme } from '../../../src/core/theme.js';

// ---------------------------------------------------------------------------
// Geometry factories
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<JsonRowGeo> & Pick<JsonRowGeo, 'valueType'>): JsonRowGeo {
  const base: JsonRowGeo = {
    key: 'key',
    value: 'value',
    valueLines: ['value'],
    highlight: false,
    // A5/T6b: object rows have both cells (upstream's `b1` = key, `b2` =
    // value). Array rows set this true and carry only `b1`.
    arrayEntry: false,
    y: 4,
    height: 20,
    // Text metrics the layout stage measures and the renderer only reads
    // (`TextBlockJson.ts#cellMetrics`). These hand-built rows are geometry
    // fixtures, so the values are illustrative, not measured — the suites that
    // assert real metrics render a real fixture end-to-end.
    keyWidth: 30,
    valueLineWidths: [40],
    keyTextLength: 30,
    valueTextLengths: [40],
    keyBaselineY: 16,
    valueBaselineYs: [16],
    // Overwritten just below unless explicitly supplied; declared here so the
    // literal satisfies `JsonRowGeo`.
    keyAtoms: [],
    valueAtoms: [],
    ...overrides,
  };
  // Auto-derive valueLines from value when not explicitly provided
  if (!('valueLines' in overrides)) {
    base.valueLines = [base.value];
  }
  // ...and the drawn atoms from whatever `valueLines` ended up being. With no
  // wrap a line is exactly one atom (`Fission.ts`), which is what these
  // geometry fixtures exercise; a suite that needs real wrapping renders a
  // fixture end-to-end instead of hand-building rows.
  if (!('valueAtoms' in overrides)) {
    base.valueAtoms = base.valueLines.map((l) => [{ text: l, dx: 0, textLength: 40 }]);
  }
  if (!('keyAtoms' in overrides)) {
    base.keyAtoms = [{ text: base.key, dx: 0, textLength: 30 }];
  }
  return base;
}

function makeNode(overrides: Partial<JsonNodeGeo> = {}): JsonNodeGeo {
  return {
    id: 'n0',
    x: 10,
    y: 20,
    width: 200,
    height: 60,
    keyColWidth: 80,
    valueColWidth: 120,
    rows: [
      makeRow({ key: 'name', value: 'Alice', valueType: 'string', y: 4, height: 20 }),
    ],
    ...overrides,
  };
}

function makeGeo(overrides: Partial<JsonGeometry> = {}): JsonGeometry {
  return {
    nodes: [],
    edges: [],
    width: 400,
    height: 300,
    ...overrides,
  };
}

function makeEdge(overrides: Partial<JsonEdgeGeo> = {}): JsonEdgeGeo {
  return {
    points: [{ x: 100, y: 50 }, { x: 200, y: 50 }],
    spline: false,
    ...overrides,
  };
}

/**
 * A theme whose graph.json is absent so ?? fallback defaults in the renderer
 * are exercised.  We build the graph object without the json key so
 * exactOptionalPropertyTypes is satisfied (omitting an optional key is legal;
 * assigning undefined to it is not).
 *
 * The destructuring extracts and discards 'json'; the rest spread produces
 * an object whose type satisfies Theme['colors']['graph'] since json is optional.
 */
function makeGraphWithoutJson(): Theme['colors']['graph'] {
  const { json: _unused, ...rest } = defaultTheme.colors.graph;
  void _unused;
  return rest;
}

const noJsonTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    graph: makeGraphWithoutJson(),
  },
};

/**
 * Strip the leading <defs>…</defs> block that svgRoot always emits so
 * assertions don't accidentally match attributes inside marker definitions.
 */
function contentAfterDefs(svg: string): string {
  const idx = svg.indexOf('</defs>');
  return idx === -1 ? svg : svg.slice(idx + '</defs>'.length);
}

// ---------------------------------------------------------------------------
// Acceptance criteria
// ---------------------------------------------------------------------------

describe('renderJson — AC #1: value text color', () => {
  it('draws a string value in the node FontColor, as upstream does', () => {
    const geo = makeGeo({
      nodes: [makeNode()],
    });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // `TextBlockJson` has no per-type value styling — every cell takes the
    // node's own FontColor, black for this family (`plantuml.skin:446`).
    // The IDE-style per-type palette this used to assert was retired; see
    // DIVERGENCES.md, "Value text — per-type colors".
    expect(body).toContain('fill="#000"');
    expect(body).not.toContain('fill="#3A6E96"');
  });

  it('still honours a THEME-supplied value color', () => {
    // The four per-type fields are kept precisely so a theme can set them —
    // all 20 built-in themes do, each to one shared color.
    const themed = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          json: { ...defaultTheme.colors.graph.json, stringValue: '#FF00FF' },
        },
      },
    };
    const body = contentAfterDefs(assembleSvg(renderJson(makeGeo({ nodes: [makeNode()] }), themed)));
    expect(body).toContain('fill="#F0F"');
  });
});

describe('renderJson — AC #2: highlight background', () => {
  it('SVG contains a rect with the highlightBackground color for a highlighted row', () => {
    const highlightedRow = makeRow({
      key: 'alert',
      value: 'yes',
      valueType: 'string',
      highlight: '',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [highlightedRow] });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    const hlColor = defaultTheme.colors.graph.json?.highlightBackground ?? '#FEFECE';
    expect(body).toContain(`fill="${hlColor}"`);
  });
});

describe('renderJson — AC #3: edge produces a path with d="M"', () => {
  it('SVG contains a <path with d="M for a 2-node connected graph', () => {
    const nodeA = makeNode({ id: 'n0', x: 0, y: 0 });
    const nodeB = makeNode({ id: 'n1', x: 300, y: 0 });
    const edge = makeEdge({
      points: [{ x: 200, y: 30 }, { x: 300, y: 30 }],
    });
    const geo = makeGeo({ nodes: [nodeA, nodeB], edges: [edge] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    expect(body).toContain('<path');
    expect(body).toContain('d="M');
  });
});

describe('renderJson — AC #4: boolean true row shows ☑', () => {
  it('SVG text contains ☑ for a boolean true row', () => {
    const boolRow = makeRow({
      key: 'active',
      value: '☑ true',
      valueType: 'boolean',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [boolRow] });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    expect(body).toContain('☑');
  });
});

describe('renderJson — AC #5: null row shows ␀', () => {
  it('SVG text contains ␀ for a null-typed row', () => {
    const nullRow = makeRow({
      key: 'nothing',
      value: '␀',
      valueType: 'null',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [nullRow] });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    expect(body).toContain('␀');
  });
});

// ---------------------------------------------------------------------------
// Structural tests
// ---------------------------------------------------------------------------

describe('renderJson — structural', () => {
  it('empty geometry returns valid SVG without crashing', () => {
    const geo = makeGeo();
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('</svg>');
  });

  it('empty geometry returns svgRoot with 0 dimensions', () => {
    const geo = makeGeo({ nodes: [], edges: [], width: 0, height: 0 });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    expect(svg).toContain('width="0"');
    expect(svg).toContain('height="0"');
  });

  it('each node produces a <g transform="translate( element', () => {
    const nodes = [
      makeNode({ id: 'n0', x: 10, y: 20 }),
      makeNode({ id: 'n1', x: 300, y: 50 }),
    ];
    const geo = makeGeo({ nodes });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // A5/M2: nodes are drawn FLAT, in absolute coordinates, with no per-node
    // group. `SvgGraphics` resolves upstream's `UTranslate` into the emitted
    // coordinates rather than into a `<g transform>`, so the jar's whole
    // document is `<defs/>` plus ONE content `<g>`.
    expect(body).not.toContain('<g transform=');
    expect(body).toContain('x="10" y="20"');
    expect(body).toContain('x="300" y="50"');
  });

  it('node rects have rx="5" — RoundCorner 10 halved for SVG', () => {
    const geo = makeGeo({ nodes: [makeNode()] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // `DriverRectangleSvg.java:78` emits `rx/2`, `ry/2`, so the skin's
    // `RoundCorner 10` reaches the SVG as 5 — and `ry` is emitted too.
    expect(body).toContain('rx="5" ry="5"');
    expect(body).not.toContain('rx="10"');
  });

  it('draws no key-column background — drawU paints no such column', () => {
    const geo = makeGeo({ nodes: [makeNode()] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // `TextBlockJson#drawU` draws the node rect, the rows, and the node rect
    // again. The `header` style contributes FONT, not fill; this port used to
    // paint a key-column rect (clipped by a `<clipPath>`) that upstream has
    // no equivalent of, and the jar emits zero clipPaths in this family.
    expect(body).not.toContain('clipPath');
    // Exactly two POSITIONED rects for a single node: the fill and the border.
    // (This suite calls `renderJson` directly rather than through the plugin,
    // so the fragment has no `jsonShell` and `assembleSvg` falls through to
    // the generic `svgRoot`, which contributes its own unpositioned canvas
    // background rect. Hence `<rect x=`, not `<rect `.)
    expect((body.match(/<rect x=/g) ?? []).length).toBe(2);
  });

  it('row separator lines are emitted for rows with y > 0', () => {
    const rows: JsonRowGeo[] = [
      makeRow({ key: 'a', value: '1', valueType: 'number', y: 0, height: 20 }),
      makeRow({ key: 'b', value: '2', valueType: 'number', y: 20, height: 20 }),
      makeRow({ key: 'c', value: '3', valueType: 'number', y: 40, height: 20 }),
    ];
    const node = makeNode({ rows });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // Rows are at node.y (20) + row.y, so separators land at 40 and 60.
    expect(body).toContain('y1="40" x2="210" y2="40"');
    expect(body).toContain('y1="60" x2="210" y2="60"');
    // Row at y=0 should NOT emit a separator above it.
    const lineCount = (body.match(/<line /g) ?? []).length;
    // A5/M2: upstream draws the column divider INSIDE the per-row loop, one
    // per row spanning that row's own height (`TextBlockJson.java:311-313`),
    // not one full-height line per node. So: 2 row separators + 3 dividers.
    expect(lineCount).toBe(5);
  });

  it('an empty value cell still draws — an empty cell is not an absent cell', () => {
    const nestedRow = makeRow({
      key: 'child',
      value: '',
      valueLines: [' '],
      valueType: 'nested',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [nestedRow] });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // `StripeSimple#getAtoms` (`StripeSimple.java:124-129`) gives a stripe that
    // collected no atoms a single-space atom, so the cell draws a space --
    // written as NBSP by the whitespace-only rule. Jar-verified: `{"a": ""}`
    // emits a value `<text>`, and `{}` emits exactly one text in a 10x18 box.
    // This test previously asserted the opposite (one text, the key only).
    const textMatches = body.match(/<text /g) ?? [];
    expect(textMatches.length).toBe(2);
    expect(body).toContain('\u00a0');
  });

  it('spline edge with 4+ points builds cubic Bézier path', () => {
    const edge = makeEdge({
      spline: true,
      points: [
        { x: 0,   y: 0  },
        { x: 50,  y: 0  },
        { x: 50,  y: 50 },
        { x: 100, y: 50 },
      ],
    });
    const geo = makeGeo({
      nodes: [makeNode({ id: 'n0' }), makeNode({ id: 'n1', x: 200, y: 0 })],
      edges: [edge],
    });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // A5/T8: the path is now the ported `JsonCurve` -- a 13-unit stub
    // extrapolated along the spline's OWN direction (`supp`), a line to the
    // spline start, then the engine's cubic segments. p0=(0,0) away from
    // p1=(50,0) puts the stub at (-13, 0).
    expect(body).toContain('d="M -13 0 L 0 0 C 50 0 50 50 100 50"');
  });

  // A5/T8: a 2-point spline yields a stub and a line, and NOTHING else. The
  // hand-built S-curve this used to assert was an invention -- upstream's
  // `drawCurve` only emits cubics for the points the engine actually returned
  // (`for (i = 1; i < size; i += 3)`), so two points produce no curve at all.
  it('a 2-point edge is stub + line, with no invented curve', () => {
    const edge = makeEdge({
      spline: false,
      points: [{ x: 10, y: 20 }, { x: 90, y: 60 }],
    });
    const geo = makeGeo({
      nodes: [makeNode({ id: 'n0' }), makeNode({ id: 'n1', x: 200, y: 0 })],
      edges: [edge],
    });
    const body = contentAfterDefs(assembleSvg(renderJson(geo, defaultTheme)));
    const d = /d="([^"]*)"/.exec(body.slice(body.indexOf('<path')))?.[1] ?? '';
    expect(d).toContain('L 10 20');
    expect(d).not.toContain('C');
    // The stub runs back along the segment's own direction, not horizontally.
    expect(d.startsWith('M -1.6')).toBe(true);
  });

  it('draws every value type in the same color — upstream has no per-type styling', () => {
    // `TextBlockJson#getTextBlock` builds every cell from one
    // `getStyleToUse(false, highlighted)` style. There is no branch on the
    // JSON type anywhere in it, so number/null/boolean/string all land on the
    // node's FontColor. Asserted together because "they are all the same" IS
    // the property; four near-identical per-type tests asserted the opposite.
    const types = [
      { key: 'count', value: '42', valueType: 'number' as const },
      { key: 'nothing', value: '\u2400', valueType: 'null' as const },
      { key: 'flag', value: '\u2611 true', valueType: 'boolean' as const },
      { key: 'name', value: 'Alice', valueType: 'string' as const },
    ];
    for (const t of types) {
      const node = makeNode({ rows: [makeRow({ ...t, y: 4, height: 20 })] });
      const body = contentAfterDefs(assembleSvg(renderJson(makeGeo({ nodes: [node] }), defaultTheme)));
      // Two texts per row (key + value), both black.
      expect(body.match(/fill="#000"/g) ?? []).toHaveLength(2);
    }
  });

  it('SVG root has correct width and height from geometry', () => {
    const geo = makeGeo({ nodes: [makeNode()], width: 500, height: 350 });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    expect(svg).toContain('width="500"');
    expect(svg).toContain('height="350"');
  });

  it('edge with zero points produces no path element', () => {
    const edge = makeEdge({ points: [] });
    const geo = makeGeo({
      nodes: [makeNode()],
      edges: [edge],
    });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    expect(body).not.toContain('<path');
  });
});

// ---------------------------------------------------------------------------
// Branch coverage
// ---------------------------------------------------------------------------

describe('renderJson — branch coverage', () => {
  it('single-point edge produces a degenerate M-only path', () => {
    const edge = makeEdge({ points: [{ x: 50, y: 30 }] });
    const geo = makeGeo({
      nodes: [makeNode()],
      edges: [edge],
    });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // A5/T8: with no second point there is no direction to extrapolate along,
    // so `veryFirstPoint` degrades to p0 itself and the path is a zero-length
    // stub. Upstream would index past the end here; a 1-point spline is not
    // something the engine produces, and this guard is documented on `supp`.
    expect(body).toContain('d="M 50 30 L 50 30"');
  });

  it('spline=true with only 2 points falls back to stub+bezier path', () => {
    const edge = makeEdge({
      spline: true,
      points: [{ x: 10, y: 10 }, { x: 90, y: 90 }],
    });
    const geo = makeGeo({
      nodes: [makeNode()],
      edges: [edge],
    });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // A5/T8: as above -- two points, so a stub and a line, no cubic.
    const d2 = /d="([^"]*)"/.exec(body.slice(body.indexOf('<path')))?.[1] ?? '';
    expect(d2).toContain('L 10 10');
    expect(d2).not.toContain('C');
  });

  it('nested valueType with non-empty value uses keyText color (default branch)', () => {
    const nestedRow = makeRow({
      key: 'obj',
      value: '{...}',
      valueType: 'nested',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [nestedRow] });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // Value text uses keyText color — the default branch of valueColor, whose
    // fallback is this family's own black (`skin/plantuml.skin:446`
    // `yamlDiagram,jsonDiagram { FontColor black }`), not the global `#181818`.
    // `#000000` reaches the SVG in its shortened form, as the jar writes it.
    expect(defaultTheme.colors.graph.json?.keyText).toBeUndefined();
    expect(body).toContain('fill="#000"');
  });

  it('spline edge with 7 points builds two cubic Bézier segments', () => {
    const edge = makeEdge({
      spline: true,
      points: [
        { x: 0,   y: 0  },
        { x: 10,  y: 0  },
        { x: 20,  y: 0  },
        { x: 30,  y: 0  },
        { x: 40,  y: 0  },
        { x: 50,  y: 0  },
        { x: 60,  y: 0  },
      ],
    });
    const geo = makeGeo({
      nodes: [makeNode({ id: 'n0' }), makeNode({ id: 'n1', x: 200, y: 0 })],
      edges: [edge],
    });
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    // Should contain two C segments
    const cCount = (body.match(/ C /g) ?? []).length;
    expect(cCount).toBe(2);
  });

  it('renders all value types when theme has no json color overrides (uses ?? defaults)', () => {
    const rows: JsonRowGeo[] = [
      makeRow({ key: 'a', value: 'hello',   valueType: 'string',  y: 4,  height: 20 }),
      makeRow({ key: 'b', value: '42',      valueType: 'number',  y: 24, height: 20 }),
      makeRow({ key: 'c', value: '☑ true',  valueType: 'boolean', y: 44, height: 20 }),
      makeRow({ key: 'd', value: '␀',       valueType: 'null',    y: 64, height: 20, highlight: '' }),
      makeRow({ key: 'e', value: '{...}',   valueType: 'nested',  y: 84, height: 20 }),
    ];
    const node = makeNode({ rows });
    const edge = makeEdge();
    const geo = makeGeo({ nodes: [node], edges: [edge] });
    const svg = assembleSvg(renderJson(geo, noJsonTheme));
    const body = contentAfterDefs(svg);
    // With `graph.json` absent entirely, every arm of `valueColor` takes its
    // OWN fallback — which is this family's skin black (`plantuml.skin:446`),
    // the same for all five. That sameness is the point: upstream has no
    // per-type value styling, so there is nothing for the arms to differ on.
    // These four lines used to assert four distinct IDE-palette colors.
    expect(body).toContain('fill="#000"');
    expect(body).toContain('fill="#CCFF02"');   // highlightBackground (plantuml.skin default)
    expect(body).toContain('fill="#FFF"');   // background → noJsonTheme.colors.background
    // headerBackground inherits from bg (#FFFFFF) — no longer a distinct hard-coded color
    // Edge still renders with theme.colors.arrow fallback
    expect(body).toContain('<path');
    // keyText and border fall back to theme.colors.text / theme.colors.border (#181818)
    expect(body).toContain('fill="#181818"');
  });

  it('highlighted row with named class uses class background color', () => {
    const highlightedRow = makeRow({
      key: 'fruit',
      value: 'Apple',
      valueType: 'string',
      highlight: 'h1',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [highlightedRow] });
    const geo = makeGeo({ nodes: [node] });
    const theme: Theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          json: {
            ...defaultTheme.colors.graph.json,
            highlightClasses: { h1: { background: '#ABCDEF' } },
          },
        },
      },
    };
    const svg = assembleSvg(renderJson(geo, theme));
    const body = contentAfterDefs(svg);
    expect(body).toContain('fill="#ABCDEF"');
    // Default highlight color should not be used
    expect(body).not.toContain('fill="#CCFF02"');
  });

  it('highlighted row with named class falls back to default highlight when class not in highlightClasses', () => {
    const highlightedRow = makeRow({
      key: 'fruit',
      value: 'Apple',
      valueType: 'string',
      highlight: 'h1',
      y: 4,
      height: 20,
    });
    const node = makeNode({ rows: [highlightedRow] });
    const geo = makeGeo({ nodes: [node] });
    // No highlightClasses defined in theme
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const body = contentAfterDefs(svg);
    const hlBg = defaultTheme.colors.graph.json?.highlightBackground ?? '#CCFF02';
    expect(body).toContain(`fill="${hlBg}"`);
  });
});

// ---------------------------------------------------------------------------
// Built-in theme integration (amiga)
// ---------------------------------------------------------------------------
describe('renderJson — built-in theme colors', () => {
  it('!theme amiga: node background, borders, and all text use the amiga palette', () => {
    const amigaTheme = resolveTheme('amiga');
    const rows: JsonRowGeo[] = [
      makeRow({ key: 'fruit', value: 'Apple', valueType: 'string', y: 0, height: 20 }),
    ];
    const node = makeNode({ rows });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, amigaTheme));
    const body = contentAfterDefs(svg);
    // Node and header column both blue
    expect(body).toContain('fill="#0B58A8"');
    // Borders white
    expect(body).toContain('stroke="#FFF"');
    // Text (key + value) white — type coloring overridden by theme
    expect(body).toContain('fill="#FFF"');
    // No dark text from default theme leaking through
    expect(body).not.toContain('fill="#181818"');
    // No type-specific colors leaking through
    expect(body).not.toContain('fill="#3A6E96"');
  });

  it('!theme amiga: SVG canvas background is amiga blue', () => {
    const amigaTheme = resolveTheme('amiga');
    const node = makeNode();
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, amigaTheme));
    // svgRoot emits the background as a rect or viewBox fill
    expect(svg).toContain('#0B58A8');
  });
});

describe('renderJson — node-level style cascade', () => {
  it('node FontColor cascades to key text via nodeFontColor (default theme has no keyText override)', () => {
    // defaultTheme.colors.graph.json has no keyText, so nodeFontColor must reach key text.
    // This was broken when keyText:'#181818' was hardcoded in defaultTheme.
    const theme: Theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          json: {
            ...defaultTheme.colors.graph.json,
            nodeFontColor: '#FF7F50',  // Coral
          },
        },
      },
    };
    const rows: JsonRowGeo[] = [
      makeRow({ key: 'myKey', value: 'val', valueType: 'string', y: 0, height: 20 }),
    ];
    const node = makeNode({ rows });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, theme));
    // Key text must use the node-level FontColor
    expect(svg).toContain('fill="#FF7F50"');
  });

  it('node FontName and FontSize cascade to key text', () => {
    const theme: Theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          json: {
            ...defaultTheme.colors.graph.json,
            nodeFontFamily: 'Helvetica',
            nodeFontSize: 12,
          },
        },
      },
    };
    const rows: JsonRowGeo[] = [
      makeRow({ key: 'myKey', value: 'val', valueType: 'string', y: 0, height: 20 }),
    ];
    const node = makeNode({ rows });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, theme));
    // Key text must use node-level font
    expect(svg).toContain('font-family="Helvetica"');
    expect(svg).toContain('font-size="12"');
  });

  it('explicit keyText color takes precedence over nodeFontColor', () => {
    const theme: Theme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        graph: {
          ...defaultTheme.colors.graph,
          json: {
            ...defaultTheme.colors.graph.json,
            keyText: '#AABBCC',
            nodeFontColor: '#FF7F50',
          },
        },
      },
    };
    const rows: JsonRowGeo[] = [
      makeRow({ key: 'k', value: 'v', valueType: 'string', y: 0, height: 20 }),
    ];
    const node = makeNode({ rows });
    const geo = makeGeo({ nodes: [node] });
    const svg = assembleSvg(renderJson(geo, theme));
    // keyText wins over nodeFontColor for the key column
    expect(svg).toContain('fill="#ABC"');
    // nodeFontColor still appears (applied to value text)
    expect(svg).toContain('fill="#FF7F50"');
  });
});
