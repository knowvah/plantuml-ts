/**
 * Rows are measured with the font of their own jar style
 * (`TextBlockJson#getTextBlock`, `TextBlockJson.java:340-349`, over the style
 * `getStyleToUse` picks, `:138-152`). The measurer below makes the font
 * observable: width = chars * size * (bold 1.5 | plain 1) * (italic 1.25 | 1),
 * height = 2 * size. Jar oracles for the same rows (width-level): header-fontsize
 * (key size 20 -> rect 50.037 x 48) and style-highlight-block (tests/fixtures/json).
 */
import { describe, expect, it } from 'vitest';
import { FixedMeasurer, type FontSpec, type StringMeasurer } from '../../../src/core/measurer.js';
import { measureNode } from '../../../src/diagrams/json/TextBlockJson.js';
import { walkTree } from '../../../src/diagrams/json/json-layout-prep.js';
import { cellMeasureOf, rowMeasureOf } from '../../../src/diagrams/json/text-block-style.js';
import { layoutJson } from '../../../src/diagrams/json/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { jsonObjectOf } from '../../helpers/json-object.js';
import { jsonSkinParamOf, jsonStylesOf } from '../../helpers/json-skin.js';

const BOLD_FACTOR = 1.5;
const ITALIC_FACTOR = 1.25;
const HEIGHT_PER_SIZE = 2;

const probe: StringMeasurer = {
  measure(text: string, font: FontSpec) {
    const factor = (font.weight === 'bold' ? BOLD_FACTOR : 1) * (font.style === 'italic' ? ITALIC_FACTOR : 1);
    return { width: text.length * font.size * factor, height: font.size * HEIGHT_PER_SIZE };
  },
  getDescent: (font: FontSpec) => font.size / 4,
};

const style = (body: string) => `<style>\n${body}\n</style>`;
const NO_HIGHLIGHT = new Map<string, string>();

function measure(root: unknown, directives = '', highlights = NO_HIGHLIGHT, type: 'json' | 'yaml' = 'json') {
  const node = walkTree(jsonObjectOf(root) as Parameters<typeof walkTree>[0])[0]!;
  return measureNode(node, highlights, probe, jsonStylesOf(type, directives));
}

describe('cellMeasureOf / rowMeasureOf: the style -> measuring font', () => {
  it('the default skin: header bold 14 sans-serif, value plain, no wrap', () => {
    const m = rowMeasureOf(jsonStylesOf('json'), false, undefined);
    expect(m.key).toEqual({ font: { family: 'sans-serif', size: 14, weight: 'bold' }, wrap: 0 });
    expect(m.value).toEqual({ font: { family: 'sans-serif', size: 14 }, wrap: 0 });
  });

  it('FontSize, FontStyle italic, MaximumWidth and skinparam tabSize reach the cell', () => {
    const styles = jsonStylesOf(
      'json',
      style('jsonDiagram {\n node {\n FontSize 20\n FontStyle italic\n MaximumWidth 90\n }\n}'),
    );
    expect(cellMeasureOf(styles.node, 4)).toEqual({
      font: { family: 'sans-serif', size: 20, style: 'italic', tabSize: 4 },
      wrap: 90,
    });
  });

  it('FontName reaches the family through FontStack#getSvgFamily', () => {
    const styles = jsonStylesOf('json', style('jsonDiagram { node { FontName Monospaced } }'));
    expect(cellMeasureOf(styles.node, undefined).font.family).toBe('monospace');
  });

  it('a highlight picks the +highlight style, header or not', () => {
    const styles = jsonStylesOf('json', style('jsonDiagram {\n highlight {\n FontSize 30\n FontStyle italic\n }\n}'));
    const m = rowMeasureOf(styles, '', undefined);
    expect(m.key.font).toEqual({ family: 'sans-serif', size: 30, style: 'italic' });
    expect(m.value.font).toEqual({ family: 'sans-serif', size: 30, style: 'italic' });
  });

  it('yaml resolves through yamlDiagram, so a jsonDiagram block does not reach it', () => {
    const body = style('jsonDiagram { node { FontSize 30 } }');
    expect(rowMeasureOf(jsonStylesOf('yaml', body), false, undefined).value.font.size).toBe(14);
    expect(rowMeasureOf(jsonStylesOf('json', body), false, undefined).value.font.size).toBe(30);
  });
});

describe('measureNode: each cell with its own style', () => {
  // TextBlockJson.java:123-124: key = getStyleToUse(true,..), value = getStyleToUse(false,..)
  it('header { FontSize 20 } sizes the key cell, not the value cell', () => {
    const node = measure({ ab: 'cd' }, style('jsonDiagram { node { header { FontSize 20 } } }'));
    const row = node.rows[0]!;
    // key: 2 chars * 20 * bold 1.5 = 60 (+10 margin); value: 2 * 14 = 28 (+10)
    expect(row.keyWidth).toBe(60);
    expect(node.keyColWidth).toBe(70);
    expect(row.valueLineWidths).toEqual([28]);
    expect(node.valueColWidth).toBe(38);
    expect(node.totalWidth).toBe(108);
  });

  it('the row is as tall as its taller cell (key 20 -> 40, value 14 -> 28; +4 margin)', () => {
    const node = measure({ ab: 'cd' }, style('jsonDiagram { node { header { FontSize 20 } } }'));
    expect(node.rows[0]!.height).toBe(44);
    expect(node.totalHeight).toBe(44);
  });

  it('baselines come from each cell own font: rowTop + 2 + height - descent', () => {
    const node = measure({ ab: 'cd' }, style('jsonDiagram { node { header { FontSize 20 } } }'));
    const row = node.rows[0]!;
    expect(row.keyBaselineY).toBe(2 + 40 - 5);
    expect(row.valueBaselineYs).toEqual([2 + 28 - 3.5]);
  });

  it('key atoms are measured with the key font, value atoms with the value font', () => {
    const node = measure({ ab: 'cd' }, style('jsonDiagram { node { header { FontSize 20 } } }'));
    const row = node.rows[0]!;
    expect(row.keyAtoms.map((a) => a.textLength)).toEqual([60]);
    expect(row.valueAtoms[0]!.map((a) => a.textLength)).toEqual([28]);
  });

  it('a highlighted row uses the highlight font: FontStyle italic REPLACES the header bold', () => {
    const body = style('jsonDiagram { highlight { FontStyle italic } }');
    const plain = measure({ a: 1, b: 2 }, body);
    const hl = measure({ a: 1, b: 2 }, body, new Map([['a', '']]));
    // style-highlight-block.svg: the highlighted key is italic, not bold (jar: font-style=italic, no weight)
    expect(plain.rows[0]!.keyWidth).toBe(14 * BOLD_FACTOR);
    expect(hl.rows[0]!.keyWidth).toBe(14 * ITALIC_FACTOR);
    expect(hl.rows[0]!.valueLineWidths).toEqual([14 * ITALIC_FACTOR]);
    expect(hl.rows[1]!.keyWidth).toBe(14 * BOLD_FACTOR);
    expect(hl.rows[0]!.highlight).toBe('');
    expect(hl.rows[1]!.highlight).toBe(false);
  });

  it('a highlight stereotype picks its own style class', () => {
    const body = style('jsonDiagram { highlight { FontSize 14 } .big { FontSize 30 } }');
    const node = measure({ a: 1 }, body, new Map([['a', 'big']]));
    expect(node.rows[0]!.valueLineWidths).toEqual([30]);
  });

  it('an array entry is one value cell measured with the node (non-header) style', () => {
    const node = measure(['xy'], style('jsonDiagram { node { header { FontSize 40 } FontSize 10 } }'));
    expect(node.rows[0]!.valueLineWidths).toEqual([20]);
    expect(node.rows[0]!.keyWidth).toBe(0);
    expect(node.keyColWidth).toBe(30);
    expect(node.rows[0]!.height).toBe(2 * 10 + 4);
  });

  it('MaximumWidth on the node style wraps the value and caps its column', () => {
    // Fixed 8px/char measurer: "aa bb cc" is 64 wide; MaximumWidth 30 -> 3 words stacked
    const root = { k: 'aa bb cc' };
    const node = measureNode(
      walkTree(jsonObjectOf(root) as Parameters<typeof walkTree>[0])[0]!,
      NO_HIGHLIGHT,
      new FixedMeasurer(8, 14),
      jsonStylesOf('json', style('jsonDiagram { node { MaximumWidth 30 } }')),
    );
    expect(node.rows[0]!.valueLines).toEqual(['aa', 'bb', 'cc']);
    expect(node.valueColWidth).toBe(16 + 10);
  });

  it('no MaximumWidth: the value stays one line', () => {
    const node = measureNode(
      walkTree(jsonObjectOf({ k: 'aa bb cc' }) as Parameters<typeof walkTree>[0])[0]!,
      NO_HIGHLIGHT,
      new FixedMeasurer(8, 14),
      jsonStylesOf('json'),
    );
    expect(node.rows[0]!.valueLines).toEqual(['aa bb cc']);
  });
});

describe('layoutJson: measurement no longer reads Theme.colors.graph.json', () => {
  const ast = (directives: string) => ({
    root: jsonObjectOf({ ab: 'cd' }),
    parseError: false,
    highlights: [],
    skinParam: jsonSkinParamOf('json', directives),
  });
  const themed = {
    ...defaultTheme,
    fontSize: 40,
    colors: {
      ...defaultTheme.colors,
      graph: {
        ...defaultTheme.colors.graph,
        json: { ...defaultTheme.colors.graph.json, nodeFontSize: 40, nodeFontBold: true, maximumWidth: 5 },
      },
    },
  };

  it('a theme font size / bold / wrap changes nothing; the style does', () => {
    const base = layoutJson(ast(''), defaultTheme, probe).nodes[0]!;
    expect(layoutJson(ast(''), themed, probe).nodes[0]).toEqual(base);
    // key 2 * 14 * 1.5 = 42, value 2 * 14 = 28
    expect(base.rows[0]!.keyWidth).toBe(42);
    expect(base.rows[0]!.valueLineWidths).toEqual([28]);
    const styled = layoutJson(ast(style('jsonDiagram { node { FontSize 20 } }')), defaultTheme, probe).nodes[0]!;
    expect(styled.rows[0]!.valueLineWidths).toEqual([40]);
  });

  it('skinparam tabSize still reaches the cell fonts (the one non-style input)', () => {
    const tabbed = { ...defaultTheme, tabSize: 2 };
    const root = { a: 'x\ty' };
    const run = (theme: typeof defaultTheme) =>
      layoutJson({ ...ast(''), root: jsonObjectOf(root) }, theme, new FixedMeasurer(8, 14)).nodes[0]!.rows[0]!;
    expect(run(tabbed).valueLineWidths).not.toEqual(run(defaultTheme).valueLineWidths);
  });
});
