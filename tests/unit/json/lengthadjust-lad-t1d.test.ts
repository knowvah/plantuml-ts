/**
 * lad-T1d: `skinparam lengthAdjust` reaches json / yaml / hcl documents.
 *
 * EXTENSION (decisions.md Amendment 1, user ruling 2026-10-23): the jar ignores
 * the skinparam for these types (`StyleExtractor.java:88-96` keeps only
 * `handwritten`), so its output is always SPACING. The mechanism, once the
 * value is present, is the jar's: `TextBlockExporter.java:306-307`,
 * `SvgGraphics.java:155-158` (root `<g>`), `SvgGraphics.java:699-705`
 * (`textLength` per `<text>`).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { renderJson } from '../../../src/diagrams/json/renderer.js';
import { jsonPlugin } from '../../../src/diagrams/json/index.js';
import { yamlPlugin } from '../../../src/diagrams/yaml/index.js';
import { hclPlugin } from '../../../src/diagrams/hcl/index.js';
import { assembleSvg } from '../../../src/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { RootLengthAdjust } from '../../../src/core/svg.js';
import type { Theme } from '../../../src/core/theme.js';
import type { JsonGeometry } from '../../../src/diagrams/json/layout.js';
import { jsonStylesOf } from '../../helpers/json-skin.js';

/** jff-T2b: the block at its own origin with its extent; the export tail adds
 *  the same(10) margin and `+1` (`TextBlockExporter.java:173,198-203`), so the
 *  document is the pre-change one: node at (10, 20), canvas 400 x 300. */
const GEO: JsonGeometry = {
  styles: jsonStylesOf('json'),
  nodes: [
    {
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
    },
  ],
  edges: [],
  width: 379,
  height: 279,
};

const themed = (lengthAdjust: RootLengthAdjust): Theme => ({ ...defaultTheme, lengthAdjust });
const sha = (s: string): string => createHash('sha256').update(s).digest('hex');

/** sha256 of each output rendered BEFORE this change, no skinparam (D4). */
const PRE_CHANGE_SHA = '90f67df3689648a0202a6f07b0950c53d060e6ae1dc8ae344f2c39520ec85266';

const PLUGINS = [
  ['json', jsonPlugin],
  ['yaml', yamlPlugin],
  ['hcl', hclPlugin],
] as const;

describe('json family lengthAdjust (extension)', () => {
  it.each(PLUGINS)('%s unset: root spacing and textLength present', (_n, plugin) => {
    const svg = assembleSvg(plugin.render(GEO, defaultTheme));
    expect(svg).toContain('lengthAdjust="spacing"');
    expect(svg).toContain('textLength="30"');
  });

  it.each(PLUGINS)('%s none: no root lengthAdjust, no textLength', (_n, plugin) => {
    const svg = assembleSvg(plugin.render(GEO, themed('none')));
    expect(svg).not.toContain('lengthAdjust');
    expect(svg).not.toContain('textLength');
    expect(svg).toContain('>name</text>');
  });

  it.each(PLUGINS)('%s spacingAndGlyphs: root carries the value', (_n, plugin) => {
    const svg = assembleSvg(plugin.render(GEO, themed('spacingAndGlyphs')));
    expect(svg).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(svg).toContain('textLength="30"');
  });

  it('renderJson sets the field only when defined (D4)', () => {
    expect('lengthAdjust' in renderJson(GEO, defaultTheme)).toBe(false);
    expect(renderJson(GEO, themed('none')).lengthAdjust).toBe('none');
  });

  it('unset output is byte-identical to the pre-change render', () => {
    const joined = PLUGINS.map(([, p]) => assembleSvg(p.render(GEO, defaultTheme))).join('\n');
    expect(sha(joined)).toBe(PRE_CHANGE_SHA);
  });
});
