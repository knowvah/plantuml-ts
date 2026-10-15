/**
 * codd-T7b T6-C: a description cluster title is aligned from the composite title style, which
 * `plantuml.skin:93-99` sets to CENTER -- not a hard-coded LEFT.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:121-128,151-163
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:93-99
 */
import { describe, it, expect } from 'vitest';
import { buildHeader } from '../../../src/diagrams/description/renderer-cluster.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { renderSync } from '../../../src/index.js';

function node(symbol: DescriptionNodeGeo['symbol']): DescriptionNodeGeo {
  return { id: 'g', symbol, display: 'g', x: 0, y: 0, width: 80, height: 60, children: [] };
}

describe('buildHeader titleHorizontalAlignment (T6-C)', () => {
  it.each(['rectangle', 'frame', 'node', 'package', 'folder', 'card'] as const)(
    '%s title is CENTER by default',
    (symbol) => {
      expect(buildHeader(node(symbol), defaultTheme).titleHorizontalAlignment).toBe(HorizontalAlignment.CENTER);
    },
  );

  it("the element's own HorizontalAlignment style wins", () => {
    const theme: Theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, elements: { rectangle: { horizontalAlignment: HorizontalAlignment.LEFT } } },
    };
    expect(buildHeader(node('rectangle'), theme).titleHorizontalAlignment).toBe(HorizontalAlignment.LEFT);
  });

  it('a skinparam defaultTextAlignment (root bucket) does not move a composite title', () => {
    const theme: Theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, elements: { root: { horizontalAlignment: HorizontalAlignment.RIGHT } } },
    };
    expect(buildHeader(node('rectangle'), theme).titleHorizontalAlignment).toBe(HorizontalAlignment.CENTER);
  });
});

describe('rendered multi-line cluster title', () => {
  it('centres the shorter line over the longer one', () => {
    const svg = renderSync('@startuml\nrectangle "ab\\ncdefghij" as r {\n  component c\n}\n@enduml');
    const xOf = (text: string): number => {
      const m = new RegExp(`<text [^>]*x="([\\d.]+)"[^>]*>${text}</text>`).exec(svg);
      if (m?.[1] === undefined) throw new Error(`no <text> for ${text}`);
      return Number(m[1]);
    };
    expect(xOf('ab')).toBeGreaterThan(xOf('cdefghij'));
  });
});
