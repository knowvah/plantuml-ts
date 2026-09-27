/**
 * Direct unit tests for `place`'s `side` parameter (cdd3-T33, C-11):
 * `SvekEdge#getExtremitySimplier` (`SvekEdge.java:544-546`) resolves
 * `side` from the contact node's rect and forwards it to
 * `extremityFactory.createUDrawable(center, angle, side)`; only
 * `ExtremityCrowfoot#drawU` (`ExtremityCrowfoot.java`) actually reads it,
 * clamping its wing endpoints onto the contact axis. Draws through the
 * real SVG pipeline (same harness `class/renderer-arrowhead.ts
 * #drawExtremityMarkup` uses) so the assertion is on the emitted `<line>`
 * geometry, not an internal field.
 */
import { describe, it, expect } from 'vitest';
import { place } from '../../../../src/core/svek/svek-edge-extremity.js';
import { Side } from '../../../../src/core/svek/extremity/Side.js';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../src/core/klimt/Back.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { extractFlatContent } from '../../../../src/core/klimt/document-shell.js';

const NO_TEXT_BOUNDER = { calculateDimension: (): { width: number } => ({ width: 0 }) };

function drawCrowfoot(point: { x: number; y: number }, angle: number, side: Side | null | undefined): string {
  const placed =
    side === undefined ? place('CROWFOOT', point, angle, '#000000') : place('CROWFOOT', point, angle, '#000000', side);
  const ug = UGraphicSvg.build(0, basicSvgOption({}), '$version$', NO_TEXT_BOUNDER);
  const context = ug.apply(new Fore('#000000')).apply(UStroke.withThickness(1)).apply(new Back('none'));
  placed.drawable.drawU(context);
  return extractFlatContent(ug.getSvgString()).body;
}

function lineY2s(svg: string): number[] {
  return [...svg.matchAll(/<line[^>]*y2="([-\d.]+)"/g)].map((m) => Number(m[1]));
}

function lineX2s(svg: string): number[] {
  return [...svg.matchAll(/<line[^>]*x2="([-\d.]+)"/g)].map((m) => Number(m[1]));
}

describe('place — side forwarding (SvekEdge.java:544-546, ExtremityCrowfoot.java)', () => {
  it('defaults to side=null (no clamp) when the caller omits it', () => {
    // medosa foo1->foo2 contact point (70.077, 107.477), angle atan2 of the
    // near-vertical approach segment -- see `closest-side.test.ts`'s same
    // fixture citation. Unclamped: the two wing y2s differ from each other.
    const svg = drawCrowfoot({ x: 70.077, y: 107.477 }, Math.PI / 2 + 0.35, undefined);
    const ys = lineY2s(svg);
    expect(ys.length).toBe(3);
    expect(ys[0]).not.toBeCloseTo(ys[1]!, 3);
  });

  it('clamps both wing endpoints to the contact y when side=NORTH (medosa lnk4/lnk6)', () => {
    // ExtremityCrowfoot.java: `if (side==NORTH||side==SOUTH) { left.y = middle.y; right.y = middle.y; }`
    // -- both wing lines must land on the SAME y as the spike (contact.y).
    const svg = drawCrowfoot({ x: 70.077, y: 107.477 }, Math.PI / 2 + 0.35, Side.NORTH);
    const ys = lineY2s(svg);
    expect(ys.length).toBe(3);
    expect(ys[0]).toBeCloseTo(107.477, 6);
    expect(ys[1]).toBeCloseTo(107.477, 6);
  });

  it('clamps both wing endpoints to the contact x when side=EAST (medosa lnk7)', () => {
    // jar `foo2-backto-foo3`: all three wing lines converge to the same x2.
    const svg = drawCrowfoot({ x: 121.35, y: 139 }, Math.PI, Side.EAST);
    const xs = lineX2s(svg);
    expect(xs.length).toBe(3);
    expect(xs[0]).toBeCloseTo(121.35, 6);
    expect(xs[1]).toBeCloseTo(121.35, 6);
  });
});
