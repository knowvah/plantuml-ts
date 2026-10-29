import { describe, it, expect } from 'vitest';
import { parseYaml } from '../../../src/diagrams/yaml/parser.js';
import { parseJson } from '../../../src/diagrams/json/parser.js';
import { layoutJson } from '../../../src/diagrams/json/layout.js';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { assembleSvg } from '../../../src/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { JsonDiagramAST } from '../../../src/diagrams/json/ast.js';
import { jsonObjectOf } from '../../helpers/json-object.js';
import { jsonSkinParamOf } from '../../helpers/json-skin.js';

/** `plantuml.skin` jsonDiagram highlight BackGroundColor default. */
const DEFAULT_HIGHLIGHT_BACKGROUND = '#CCFF02';

function makeYamlSource(lines: string[]): UmlSource {
  return { lines, type: 'yaml' };
}

function makeJsonSource(lines: string[]): UmlSource {
  return { lines, type: 'json' };
}

// ---------------------------------------------------------------------------
// Layer 2: Parser captures styleClass
// ---------------------------------------------------------------------------

describe('parseYaml — captures styleClass from <<stereotype>>', () => {
  it('captures h1 from <<h1>> directive', () => {
    const ast = parseYaml(makeYamlSource(['#highlight "fruit" <<h1>>', 'fruit: Apple', 'size: Large']));
    expect(ast.highlights).toHaveLength(1);
    expect(ast.highlights[0]).toEqual({ path: ['fruit'], styleClass: 'h1' });
  });

  it('captures h2 from <<h2>> directive', () => {
    const ast = parseYaml(makeYamlSource(['#highlight "size" <<h2>>', 'fruit: Apple', 'size: Large']));
    expect(ast.highlights[0]).toEqual({ path: ['size'], styleClass: 'h2' });
  });

  it('empty styleClass when no <<stereotype>> present', () => {
    const ast = parseYaml(makeYamlSource(['#highlight "fruit"', 'fruit: Apple']));
    expect(ast.highlights[0]).toEqual({ path: ['fruit'], styleClass: '' });
  });

  it('normalises styleClass to lowercase', () => {
    const ast = parseYaml(makeYamlSource(['#highlight "fruit" <<H1>>', 'fruit: Apple']));
    expect(ast.highlights[0]!.styleClass).toBe('h1');
  });

  it('captures styleClass from multi-segment path with stereotype', () => {
    const ast = parseYaml(makeYamlSource(['#highlight "address" / "city" <<highlight>>', 'address:', '  city: NYC']));
    expect(ast.highlights[0]).toEqual({ path: ['address', 'city'], styleClass: 'highlight' });
  });
});

describe('parseJson — captures styleClass from <<stereotype>>', () => {
  it('captures h1 from <<h1>> directive in JSON parser', () => {
    const ast = parseJson(makeJsonSource(['#highlight "fruit" <<h1>>', '{"fruit": "Apple"}']));
    expect(ast.highlights).toHaveLength(1);
    expect(ast.highlights[0]).toEqual({ path: ['fruit'], styleClass: 'h1' });
  });

  it('empty styleClass when no <<stereotype>> in JSON parser', () => {
    const ast = parseJson(makeJsonSource(['#highlight "fruit"', '{"fruit": "Apple"}']));
    expect(ast.highlights[0]).toEqual({ path: ['fruit'], styleClass: '' });
  });

  it('normalises styleClass to lowercase in JSON parser', () => {
    const ast = parseJson(makeJsonSource(['#highlight "fruit" <<H2>>', '{"fruit": "Apple"}']));
    expect(ast.highlights[0]!.styleClass).toBe('h2');
  });
});

// ---------------------------------------------------------------------------
// Layer 3: layoutJson propagates styleClass to row.highlight
// ---------------------------------------------------------------------------

describe('layoutJson — propagates styleClass to row.highlight', () => {
  it('row.highlight is "h1" when directive has styleClass "h1"', () => {
    const theme = defaultTheme;
    const ast: JsonDiagramAST = {
      skinParam: jsonSkinParamOf('yaml'),
      root: jsonObjectOf({ fruit: 'Apple', size: 'Large' }),
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: 'h1' }],
    };
    const geo = layoutJson(ast, theme, new FormulaMeasurer());
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'fruit');
    expect(row?.highlight).toBe('h1');
  });

  it('row.highlight is "" when directive has no styleClass', () => {
    const ast: JsonDiagramAST = {
      skinParam: jsonSkinParamOf('yaml'),
      root: jsonObjectOf({ fruit: 'Apple' }),
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: '' }],
    };
    const geo = layoutJson(ast, defaultTheme, new FormulaMeasurer());
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'fruit');
    expect(row?.highlight).toBe('');
  });

  it('non-highlighted rows have highlight=false', () => {
    const ast: JsonDiagramAST = {
      skinParam: jsonSkinParamOf('yaml'),
      root: jsonObjectOf({ fruit: 'Apple', size: 'Large' }),
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: 'h1' }],
    };
    const geo = layoutJson(ast, defaultTheme, new FormulaMeasurer());
    const row = geo.nodes[0]!.rows.find((r) => r.key === 'size');
    expect(row?.highlight).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Layer 4: renderJson uses `.h1` style background
// ---------------------------------------------------------------------------

describe('renderJson — uses `.h1` style background for named class', () => {
  it('uses class background color instead of default highlightBackground', () => {
    const theme = defaultTheme;
    const ast: JsonDiagramAST = {
      skinParam: jsonSkinParamOf('yaml', '<style>\n.h1 { BackGroundColor #ABCDEF }\n</style>'),
      root: jsonObjectOf({ fruit: 'Apple' }),
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: 'h1' }],
    };
    const geo = layoutJson(ast, theme, new FormulaMeasurer());
    const svg = assembleSvg(renderJson(geo, theme));
    expect(svg).toContain('#ABCDEF');
    // Default highlight color should not be used
    expect(svg).not.toContain('#CCFF02');
  });

  it('falls back to default highlight color when class no `.h1` style is declared', () => {
    // h1 class present in directive but no `.h1` style declared
    const ast: JsonDiagramAST = {
      skinParam: jsonSkinParamOf('yaml'),
      root: jsonObjectOf({ fruit: 'Apple' }),
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: 'h1' }],
    };
    const geo = layoutJson(ast, defaultTheme, new FormulaMeasurer());
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const hlBg = DEFAULT_HIGHLIGHT_BACKGROUND;
    expect(svg).toContain(hlBg);
  });

  it('uses class fontColor for text when defined', () => {
    const theme = defaultTheme;
    const ast: JsonDiagramAST = {
      skinParam: jsonSkinParamOf('yaml', '<style>\n.h1 { BackGroundColor #ABCDEF\nFontColor #F00 }\n</style>'),
      root: jsonObjectOf({ fruit: 'Apple' }),
      parseError: false,
      highlights: [{ path: ['fruit'], styleClass: 'h1' }],
    };
    const geo = layoutJson(ast, theme, new FormulaMeasurer());
    const svg = assembleSvg(renderJson(geo, theme));
    expect(svg).toContain('#F00');
  });
});

// ---------------------------------------------------------------------------
// End-to-end: YAML parse → layout → render with <<h1>>
// ---------------------------------------------------------------------------

describe('end-to-end: YAML <<h1>> highlight class in SVG output', () => {
  it('full pipeline uses class background from theme', () => {
    const theme = defaultTheme;
    const ast = {
      ...parseYaml(makeYamlSource(['#highlight "fruit" <<h1>>', 'fruit: Apple', 'size: Large'])),
      skinParam: jsonSkinParamOf('yaml', '<style>\n.h1 { BackGroundColor #0F0 }\n</style>'),
    };
    const geo = layoutJson(ast, theme, new FormulaMeasurer());
    const svg = assembleSvg(renderJson(geo, theme));
    expect(svg).toContain('#0F0');
    expect(svg).not.toContain('#CCFF02');
  });

  it('full pipeline with no class uses default highlight color', () => {
    const ast = parseYaml(makeYamlSource(['#highlight "fruit"', 'fruit: Apple', 'size: Large']));
    const geo = layoutJson(ast, defaultTheme, new FormulaMeasurer());
    const svg = assembleSvg(renderJson(geo, defaultTheme));
    const hlBg = DEFAULT_HIGHLIGHT_BACKGROUND;
    expect(svg).toContain(hlBg);
  });

  it('two highlights with different classes use their respective colors', () => {
    const theme = defaultTheme;
    const ast = {
      ...parseYaml(
        makeYamlSource(['#highlight "fruit" <<h1>>', '#highlight "size" <<h2>>', 'fruit: Apple', 'size: Large']),
      ),
      skinParam: jsonSkinParamOf(
        'yaml',
        '<style>\n.h1 { BackGroundColor #F00 }\n.h2 { BackGroundColor #00F }\n</style>',
      ),
    };
    const geo = layoutJson(ast, theme, new FormulaMeasurer());
    const svg = assembleSvg(renderJson(geo, theme));
    expect(svg).toContain('#F00');
    expect(svg).toContain('#00F');
  });
});
