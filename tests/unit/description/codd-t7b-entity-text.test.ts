/**
 * codd-T7b: draw-side entity text mechanisms of `renderer-entity.ts#buildEntityParams`
 * (T6-B alignment from the style cascade, T6-E MinimumWidth, T6-D stereotype font size).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:175,188,191
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java:152-166
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:12,452-454
 */
import { describe, it, expect } from 'vitest';
import { buildEntityParams } from '../../../src/diagrams/description/renderer-entity.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';
import type { ElementColors } from '../../../src/core/theme-graph-colors.js';
import { titleAlignmentFor } from '../../../src/core/svek/image/leaf-sizing-entity.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';

function themeWith(elements: Record<string, ElementColors>, extra: Partial<Theme> = {}): Theme {
  return { ...defaultTheme, ...extra, colors: { ...defaultTheme.colors, elements } };
}

function node(symbol: DescriptionNodeGeo['symbol'], extra: Partial<DescriptionNodeGeo> = {}): DescriptionNodeGeo {
  return { id: 'n', symbol, display: 'a\nbbb', x: 0, y: 0, width: 50, height: 30, children: [], ...extra };
}

describe('titleAlignmentFor (T6-B)', () => {
  const L = HorizontalAlignment.LEFT;
  const C = HorizontalAlignment.CENTER;
  const R = HorizontalAlignment.RIGHT;

  it('defaults to LEFT (plantuml.skin:12 root) for a component', () => {
    expect(titleAlignmentFor('component')).toBe(L);
  });

  it('defaults to CENTER for a usecase and its business variant (plantuml.skin:452-454)', () => {
    expect(titleAlignmentFor('usecase')).toBe(C);
    expect(titleAlignmentFor('usecase-business')).toBe(C);
  });

  it('the root bucket (skinparam defaultTextAlignment) overrides root LEFT but not the usecase rule', () => {
    expect(titleAlignmentFor('component', { root: R })).toBe(R);
    expect(titleAlignmentFor('usecase', { root: R })).toBe(C);
  });

  it("the element's own bucket beats both", () => {
    expect(titleAlignmentFor('component', { own: C, root: R })).toBe(C);
    expect(titleAlignmentFor('usecase', { own: L, root: R })).toBe(L);
  });
});

describe('buildEntityParams (T6-B/T6-E)', () => {
  it('aligns the description LEFT by default instead of the hard-coded CENTER', () => {
    expect(buildEntityParams(node('rectangle'), defaultTheme, undefined).paint.titleAlignment).toBe(
      HorizontalAlignment.LEFT,
    );
  });

  it('reads the theme root and element buckets', () => {
    const root = themeWith({ root: { horizontalAlignment: HorizontalAlignment.RIGHT } });
    expect(buildEntityParams(node('rectangle'), root, undefined).paint.titleAlignment).toBe(HorizontalAlignment.RIGHT);
    const own = themeWith({ rectangle: { horizontalAlignment: HorizontalAlignment.CENTER } });
    expect(buildEntityParams(node('rectangle'), own, undefined).paint.titleAlignment).toBe(HorizontalAlignment.CENTER);
  });

  it('keeps a usecase CENTER', () => {
    expect(buildEntityParams(node('usecase'), defaultTheme, undefined).paint.titleAlignment).toBe(
      HorizontalAlignment.CENTER,
    );
  });
});
