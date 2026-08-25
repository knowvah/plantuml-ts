import { describe, it, expect } from 'vitest';
import { render } from '../../../src/index.js';

describe('jsonPlugin.accepts', () => {





















});

describe('render @startjson — parse errors', () => {
  it('renders PlantUML error message for invalid JSON', async () => {
    // Upstream renders "Your data does not sound like JSON data" for invalid input.
    const svg = await render('@startjson\n{\n{\n[\n"x"\n]\n}\n}\n@endjson');
    expect(svg).toContain('<svg');
    // The message is drawn in `monospace`, and `SvgGraphics.java:727-728`
    // replaces every space with NBSP under that family — so the document
    // carries U+00A0, not U+0020.
    expect(svg).toContain('Your\u00a0data\u00a0does\u00a0not\u00a0sound\u00a0like\u00a0JSON\u00a0data');
    // …and no box: upstream draws the text and nothing else.
    expect(svg).not.toContain('<rect');
  });
});

describe('render @startjson end-to-end', () => {
  it('renders a simple object and SVG contains the key text', async () => {
    const svg = await render('@startjson\n{"key":"val"}\n@endjson');
    expect(svg).toContain('key');
    expect(svg).toContain('<svg');
  });

  it('renders null scalar as a node containing the null symbol', async () => {
    const svg = await render('@startjson\nnull\n@endjson');
    expect(svg).toContain('<svg');
    expect(svg).toContain('␀');
  });

  it('renders string scalar', async () => {
    const svg = await render('@startjson\n"Hi"\n@endjson');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Hi');
  });

  it('renders number scalar', async () => {
    const svg = await render('@startjson\n42\n@endjson');
    expect(svg).toContain('<svg');
    expect(svg).toContain('42');
  });

  it('renders an array root with correct node count (not stolen by component plugin)', async () => {
    // [1, 2, 3] must route to the JSON plugin, not the component plugin
    // (whose /^\[.+\]/ pattern would also match) — regression test for
    // dispatcher type-based routing.
    const svg = await render('@startjson\n[1, 2, 3]\n@endjson');
    expect(svg).toContain('<svg');
    // A5/M2: nodes are drawn FLAT (no per-node `<g transform>`), so a node is
    // counted by its own rounded fill rect rather than by a group.
    expect(svg).toMatch(/<rect x=/);
  });

  it('renders nested arrays-of-arrays with correct node count', async () => {
    // [ [], [[]], [] ] → 5 nodes (root + 3 children + 1 grandchild)
    const svg = await render('@startjson\n[ [], [[]], [] ]\n@endjson');
    expect(svg).toContain('<svg');
    // A5/M2: each node draws exactly TWO rects — the fill and the border
    // (`TextBlockJson#drawU` opens and closes with the same rectangle).
    const nodeRects = svg.match(/<rect x=/g) ?? [];
    expect(nodeRects.length).toBe(5 * 2);
  });

  it('renders title directive in SVG output', async () => {
    const svg = await render('@startjson\ntitle My JSON\n{"a":1}\n@endjson');
    expect(svg).toContain('<svg');
    expect(svg).toContain('My JSON');
    // Title text should appear as a text element
    expect(svg).toMatch(/<text[^>]*>.*My JSON/);
  });
});

describe('render @startjson — style block', () => {
  const diagramWithStyle = [
    '@startjson',
    '<style>',
    'element {',
    '  BackgroundColor: white;',
    '  LineColor: black;',
    '  highlight {',
    '    BackgroundColor: red;',
    '  }',
    '  header {',
    '    FontStyle: bold;',
    '  }',
    '}',
    '</style>',
    '#highlight "lastName"',
    '{"firstName":"John","lastName":"Smith"}',
    '@endjson',
  ].join('\n');

  it('applies element.highlight.BackgroundColor: red to highlighted row', async () => {
    const svg = await render(diagramWithStyle);
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#F00"');
  });

  it('applies element.header.FontStyle: bold to key column text', async () => {
    const svg = await render(diagramWithStyle);
    // `DriverTextSvg` emits the numeric CSS weight, never the keyword
    // (`fontWeightOf` -> '700'); the jar's own goldens all read `font-weight="700"`.
    expect(svg).toContain('font-weight="700"');
  });

  it('still renders the JSON content correctly', async () => {
    const svg = await render(diagramWithStyle);
    expect(svg).toContain('firstName');
    expect(svg).toContain('Smith');
  });
});

describe('jsondiagram.node style block', () => {
  it('applies RoundCorner from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    RoundCorner 8\n  }\n}\n</style>\n{"a":1}\n@endjson',
    );
    // `DriverRectangleSvg.java:78` halves it: RoundCorner 8 -> rx="4".
    expect(svg).toMatch(/rx="4"/);
  });

  it('applies MaximumWidth word-wrapping from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    MaximumWidth 50\n  }\n}\n</style>\n{"key":"a very long value that should wrap"}\n@endjson',
    );
    expect(svg).toContain('<svg');
    // SVG must exist and contain multiple text elements (one per wrapped line plus key)
    expect(svg.match(/<text/g)?.length).toBeGreaterThan(1);
  });

  it('applies BackGroundColor from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    BackGroundColor #AABBCC\n  }\n}\n</style>\n{"x":1}\n@endjson',
    );
    expect(svg).toContain('fill="#ABC"');
  });

  it('applies LineColor from jsonDiagram.node style to border and arrows', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    LineColor #FF0000\n  }\n}\n</style>\n{"a":{"b":1}}\n@endjson',
    );
    expect(svg).toContain('#F00');
  });

  it('applies FontColor from jsonDiagram.node style to value cells', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    FontColor #123456\n  }\n}\n</style>\n{"k":"v"}\n@endjson',
    );
    expect(svg).toContain('#123456');
  });

  // A5/M2: upstream positions a cell by computing an absolute `x` --
  // `HorizontalAlignment#draw` translates the text BLOCK by `0`,
  // `(width - dim) / 2` or `width - dim` and draws it there -- and never emits
  // a `text-anchor`. So alignment is asserted through the coordinate it
  // produces, which is the thing that actually has to be right.
  const alignedKeyX = async (alignment: string): Promise<number> => {
    const svg = await render(
      // Two keys of very different lengths: with a single short key the column
      // is exactly the text plus its margins, so all three alignments coincide
      // at x=15 and the test would pass vacuously.
      `@startjson\n<style>\njsonDiagram {\n  node {\n    HorizontalAlignment ${alignment}\n  }\n}\n</style>\n{"k":"v","a_much_longer_key":"v"}\n@endjson`,
    );
    expect(svg).not.toContain('text-anchor');
    const first = /<text x="([0-9.]+)"/.exec(svg);
    expect(first).not.toBeNull();
    return Number(first![1]);
  };

  it('applies HorizontalAlignment center from jsonDiagram.node style', async () => {
    expect(await alignedKeyX('center')).toBeGreaterThan(await alignedKeyX('left'));
  });

  it('applies HorizontalAlignment right from jsonDiagram.node style', async () => {
    expect(await alignedKeyX('right')).toBeGreaterThan(await alignedKeyX('center'));
  });

  it('applies FontStyle bold from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    FontStyle bold\n  }\n}\n</style>\n{"k":"v"}\n@endjson',
    );
    expect(svg).toContain('font-weight="700"');
  });

  it('applies FontStyle italic from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    FontStyle italic\n  }\n}\n</style>\n{"k":"v"}\n@endjson',
    );
    expect(svg).toContain('font-style="italic"');
  });

  it('applies FontSize from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    FontSize 18\n  }\n}\n</style>\n{"k":"v"}\n@endjson',
    );
    expect(svg).toContain('font-size="18"');
  });

  it('applies FontWeight bold from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    FontWeight bold\n  }\n}\n</style>\n{"k":"v"}\n@endjson',
    );
    expect(svg).toContain('font-weight="700"');
  });

  it('applies LineThickness from jsonDiagram.node style', async () => {
    const svg = await render(
      '@startjson\n<style>\njsonDiagram {\n  node {\n    LineThickness 3\n  }\n}\n</style>\n{"k":"v"}\n@endjson',
    );
    expect(svg).toContain('stroke-width="3"');
  });

  it('does not break existing element style handling', async () => {
    const svg = await render(
      [
        '@startjson',
        '<style>',
        'element {',
        '  BackgroundColor: white;',
        '  highlight {',
        '    BackgroundColor: red;',
        '  }',
        '}',
        'jsonDiagram {',
        '  node {',
        '    RoundCorner 6',
        '  }',
        '}',
        '</style>',
        '#highlight "a"',
        '{"a":1}',
        '@endjson',
      ].join('\n'),
    );
    // G1c: named colors resolve to their canonical jar hex.
    expect(svg).toContain('fill="#F00"');
    // RoundCorner 6, halved for SVG (`DriverRectangleSvg.java:78`).
    expect(svg).toMatch(/rx="3"/);
  });
});
