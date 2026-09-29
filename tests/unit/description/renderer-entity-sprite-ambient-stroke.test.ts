/**
 * renderer-entity-sprite-ambient-stroke.test.ts — cdd6 T2f
 * (sprite-ambient-stroke): pins `renderer-entity.ts#buildEntityParams`'s own
 * wiring of the ambient-stroke seam T1b landed (`SpritePrimitiveCollector
 * .create`/`makeAtomImageResolverFor`, cdd6 T1b commit 3a6594fc2). That
 * commit's own unit tests (`tests/unit/creole-img-render.test.ts`) pin the
 * LOW-LEVEL mechanism (an injected `ambientStroke` reaches the collected
 * primitive); this file pins the PRODUCER: `drawEntity`'s entity-leaf draw
 * path resolves `resolveElementLineThickness(theme, node.symbol) ??
 * ENTITY_STROKE_WIDTH` and forwards it, so a sprite path with no `stroke-
 * width` of its own inherits the drawn entity's OWN border thickness rather
 * than the hardcoded `UStroke.simple()` (1.0) default.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java:187-215 (applyFillAndStroke)
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:93 (element { LineThickness 0.5 })
 */
import { describe, it, expect } from 'vitest';
import { renderDescription } from '../../../src/diagrams/description/renderer.js';
import type { DescriptionGeometry } from '../../../src/diagrams/description/layout.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteSvg } from '../../../src/core/klimt/sprite/SpriteSvg.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

// A path with no `stroke-width` of its own -- SvgNanoParser.java:187-215's
// `applyFillAndStroke` never overrides the caller's ambient stroke here, so
// this atom's drawn thickness is entirely a function of what the ENTITY
// passed in as its ambient seed.
const NO_STROKE_WIDTH_SVG = '<svg width="10" height="10"><path d="M0 5L10 5" stroke="green"/></svg>';

function spriteRegistryWith(name: string, svg: string): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = SpriteSvg.from(svg);
  if (sprite === undefined) throw new Error(`test fixture SVG for '${name}' has no width/height`);
  addSprite(registry, name, sprite);
  return registry;
}

function makeCardNode(overrides?: Partial<DescriptionNodeGeo>): DescriptionNodeGeo {
  return {
    id: 'n1',
    symbol: 'card',
    display: '<$s>',
    x: 10,
    y: 10,
    width: 100,
    height: 40,
    children: [],
    ...overrides,
  };
}

const measurer = new FormulaMeasurer();

describe('drawEntity — sprite ambient stroke wiring (D3, cdd6 T2f)', () => {
  it("a card body's own LineThickness default (0.5) seeds an unset sprite path's stroke-width", () => {
    const sprites = spriteRegistryWith('s', NO_STROKE_WIDTH_SVG);
    const geo: DescriptionGeometry = {
      totalWidth: 200,
      totalHeight: 100,
      nodes: [makeCardNode()],
      edges: [],
      sprites,
    };
    const svg = renderDescription(geo, defaultTheme, measurer);
    expect(svg).toContain('stroke-width:0.5;');
    expect(svg).not.toContain('stroke-width:1;');
  });

  it('a <style> card { LineThickness N } override reseeds the same ambient stroke', () => {
    const sprites = spriteRegistryWith('s', NO_STROKE_WIDTH_SVG);
    const geo: DescriptionGeometry = {
      totalWidth: 200,
      totalHeight: 100,
      nodes: [makeCardNode()],
      edges: [],
      sprites,
    };
    const theme = { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { card: { lineThickness: 3 } } } };
    const svg = renderDescription(geo, theme, measurer);
    expect(svg).toContain('stroke-width:3;');
  });
});
