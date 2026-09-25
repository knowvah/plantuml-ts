/**
 * cdd2-T17 — per-shape `LimitFinder` rules in the class ink walk
 * (`src/diagrams/class/class-ink-box.ts#addClassifierInk`).
 *
 * Expected canvases are the jar's, read off each fixture's cached `in.svg`
 * (`test-results/dot-cache/class/<slug>/in.svg`); the markup is inlined so the
 * test does not depend on the gitignored corpus.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { computeClassRawInkDims } from '../../../src/diagrams/class/layout-ink-extent.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/layout.js';

function svgDims(markup: string): { width: string | undefined; height: string | undefined } {
  const svg = renderSync(markup, { measurer: new WidthTableMeasurer() });
  const root = /<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return {
    width: /\bwidth="([^"]+)"/.exec(root)?.[1],
    height: /\bheight="([^"]+)"/.exec(root)?.[1],
  };
}

function leaf(overrides: Partial<ClassifierGeo>): ClassifierGeo {
  return { id: 'C', kind: 'class', x: 0, y: 0, width: 40, height: 40, dividerYs: [], rows: [], ...overrides };
}

describe('addClassifierInk — assoc-circle is a bare UEllipse (R-1)', () => {
  // `EntityImageAssociationPoint#drawU` draws `UEllipse.build(SIZE, SIZE)`
  // (`svek/image/EntityImageAssociationPoint.java:77-81`), bounded by
  // `LimitFinder#drawEllipse` (`klimt/drawing/LimitFinder.java:211-215`):
  // `(x, y)` .. `(x + w - 1, y + h - 1)`.
  it('bounds the 4x4 circle at (x, y)..(x+3, y+3), not the classifier box rule', () => {
    const dims = computeClassRawInkDims(
      [leaf({ id: '__assoc0', kind: 'assoc-circle', x: 10, y: 20, width: 4, height: 4 })],
      [],
      [],
      [],
    );
    // ellipse ink [10, 13] x [20, 23]: raw = extent + 15 (SvekResult delta).
    expect(dims).toEqual({ width: 3 + 15, height: 3 + 15 });
  });

  it('jixamu-89-ribo225: jar canvas width 326 (the circle is the rightmost ink)', () => {
    const markup = [
      '@startuml',
      'class Station {',
      '+name: string',
      '}',
      '',
      'class StationCrossing {',
      '+cost: TimeInterval',
      '}',
      '',
      'Station "0..*" - "0..*" Station',
      'StationCrossing . (Station, Station)',
      '',
      '@enduml',
    ].join('\n');
    expect(svgDims(markup).width).toBe('326px');
  });
});

describe('addRectInk — bodyInkHeight (cdd3-T7, R-VP)', () => {
  // Hidden body (`suppress.fields && suppress.methods`) is
  // `BodierLikeClassOrObject.java:249-250`'s `TextBlockUtils.empty(0, 0)`:
  // the header's own `UEmpty` reservation is the only body-side max-Y
  // candidate, and `LimitFinder#drawRectangle`'s un-widened `y + h - 1`
  // corner (`klimt/drawing/LimitFinder.java:184-188`) wins whenever the
  // header's own blocks stop short of it (`HeaderLayout.java:98-109`).
  it('caps max-Y at the rect corner y+h-1 when bodyInkHeight is set below it', () => {
    // x=0,y=0,w=40,h=40: minY = y-1 = -1 (drawRectangle's own inset).
    // hidden body: bodyMaxY = y + bodyInkHeight = 21; rect corner
    // y+h-1 = 39 wins -> maxY = 39, raw height = 39 - -1 = 40, +15 = 55.
    const hiddenBody = computeClassRawInkDims([leaf({ bodyInkHeight: 21 })], [], [], []);
    expect(hiddenBody.height).toBe(55);

    // shown body (bodyInkHeight undefined): bodyMaxY falls back to y+h=40,
    // which beats the rect corner 39 -> maxY = 40, raw height = 41, +15 = 56.
    const shownBody = computeClassRawInkDims([leaf({})], [], [], []);
    expect(shownBody.height).toBe(56);

    // The hidden-body box is exactly 1px shorter — the jar's own y+h-1 vs
    // this port's pre-cdd3-T7 fixed y+h.
    expect(hiddenBody.height).toBe(shownBody.height - 1);
  });

  it('leaves max-X untouched — this rule is Y-axis only', () => {
    const hiddenBody = computeClassRawInkDims([leaf({ bodyInkHeight: 21 })], [], [], []);
    const shownBody = computeClassRawInkDims([leaf({})], [], [], []);
    expect(hiddenBody.width).toBe(shownBody.width);
  });
});
