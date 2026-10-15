/**
 * codd-T7b T6-E: the draw-side paint carries the element MinimumWidth, so the description block is
 * floored and aligned inside it exactly as the sizer reserved.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:186
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/BodyEnhanced2.java:114-116
 */
import { describe, it, expect } from 'vitest';
import { buildEntityParams } from '../../../src/diagrams/description/renderer-entity.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';

const node: DescriptionNodeGeo = {
  id: 'n',
  symbol: 'component',
  display: 'a',
  x: 0,
  y: 0,
  width: 50,
  height: 30,
  children: [],
};

describe('buildEntityParams minimumWidth (T6-E)', () => {
  it('forwards the element MinimumWidth', () => {
    const theme: Theme = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, elements: { component: { minimumWidth: 200 } } },
    };
    expect(buildEntityParams(node, theme, undefined).paint.minimumWidth).toBe(200);
  });

  it('forwards the diagram-wide minClassWidth', () => {
    expect(buildEntityParams(node, { ...defaultTheme, minimumWidth: 120 }, undefined).paint.minimumWidth).toBe(120);
  });

  it('is 0 when nothing sets it', () => {
    expect(buildEntityParams(node, defaultTheme, undefined).paint.minimumWidth).toBe(0);
  });
});
