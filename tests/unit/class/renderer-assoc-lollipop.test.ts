/**
 * Unit tests for `renderer-assoc-lollipop.ts` (cdd-T29 round 2, D4) --
 * direct coverage of `renderAssocPoint`/`renderLollipop` at k=1 and a
 * scaled k, including the `geo.rows[0]` absent branch `renderer.test.ts`'s
 * full-pipeline coverage doesn't reach (every real classifier geometry has
 * a header row).
 */
import { describe, it, expect } from 'vitest';
import { renderAssocPoint, renderAssociationDiamond, renderLollipop } from '../../../src/diagrams/class/renderer-assoc-lollipop.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/layout.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';

function makeGeo(overrides?: Partial<ClassifierGeo>): ClassifierGeo {
  return {
    id: 'c1',
    kind: 'assoc-circle',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    dividerYs: [],
    rows: [],
    ...overrides,
  };
}

describe('renderAssocPoint', () => {
  it('draws at radius ASSOC_POINT_SIZE/2 and stroke-width 1 when unscaled', () => {
    const body = renderAssocPoint(makeGeo(), scaleClassTheme(defaultTheme, 1));
    expect(body).toContain('stroke-width="1"');
  });

  it('scales the radius and stroke-width by k', () => {
    const unscaled = renderAssocPoint(makeGeo(), scaleClassTheme(defaultTheme, 1));
    const scaled = renderAssocPoint(makeGeo(), scaleClassTheme(defaultTheme, 2));
    expect(scaled).toContain('stroke-width="2"');
    expect(scaled).not.toBe(unscaled);
  });
});

describe('renderAssociationDiamond (cdd-T34, E14, cukaze-78-zija070)', () => {
  function diamondGeo(overrides?: Partial<ClassifierGeo>): ClassifierGeo {
    return makeGeo({ kind: 'association', x: 174.244, y: 26, width: 24, height: 24, ...overrides });
  }

  it('draws a bare <polygon>, no <g>/id/comment wrapper', () => {
    const body = renderAssociationDiamond(diamondGeo(), scaleClassTheme(defaultTheme, 1));
    expect(body.startsWith('<polygon')).toBe(true);
    expect(body).not.toContain('<g');
  });

  it('emits the four-point diamond centered on the node box (jar-verified cukaze-78-zija070)', () => {
    const body = renderAssociationDiamond(diamondGeo(), scaleClassTheme(defaultTheme, 1));
    expect(body).toContain('points="186.244,26,198.244,38,186.244,50,174.244,38,186.244,26"');
  });

  it('fills/strokes with the SAME classifier-box defaults (#F1F1F1/#181818/0.5)', () => {
    const body = renderAssociationDiamond(diamondGeo(), scaleClassTheme(defaultTheme, 1));
    expect(body).toContain('fill="#F1F1F1"');
    expect(body).toContain('stroke="#181818"');
    expect(body).toContain('stroke-width="0.5"');
    expect(body).toContain('stroke-linejoin="miter"');
    expect(body).toContain('stroke-miterlimit="10"');
  });
});

describe('renderLollipop', () => {
  it('returns an empty label when the classifier has no header row', () => {
    const { label } = renderLollipop(makeGeo({ rows: [] }), scaleClassTheme(defaultTheme, 1));
    expect(label).toBe('');
  });

  it('renders the header row as the label when present', () => {
    const { label } = renderLollipop(
      makeGeo({ rows: [{ text: 'IFoo', y: 9, indent: 0 }] }),
      scaleClassTheme(defaultTheme, 1),
    );
    expect(label).toContain('IFoo');
  });

  it('scales the circle radius and stroke-width by k', () => {
    const unscaled = renderLollipop(makeGeo(), scaleClassTheme(defaultTheme, 1)).circle;
    const scaled = renderLollipop(makeGeo(), scaleClassTheme(defaultTheme, 2)).circle;
    expect(scaled).toContain('stroke-width="3"');
    expect(scaled).not.toBe(unscaled);
  });
});
