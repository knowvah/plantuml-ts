/**
 * ExtremityExtends / ExtremityFactoryExtends (cdd8 T2d residual): the ELK
 * path's EXTENDS head (`MyElkEdge.java:231-232`). Expected points are the
 * jar's: `A --|> B` / `A <|-- B` under `!pragma layout elk` draw
 * `32.681,100,39.681,81,25.681,81,32.681,100` and
 * `32.681,60,25.681,79,39.681,79,32.681,60`, filled `#FFF`.
 */
import { describe, expect, it } from 'vitest';

import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import { XPoint2D } from '../../../../../src/core/klimt/geom/XPoint2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { ExtremityExtends } from '../../../../../src/core/svek/extremity/ExtremityExtends.js';
import { ExtremityFactoryExtends } from '../../../../../src/core/svek/extremity/ExtremityFactoryExtends.js';

const WHITE = HColors.WHITE.asPaint();
const ORIGIN = new XPoint2D(0, 0);

function polygonOf(drawU: (ug: UGraphicSvg) => void): string {
  const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', { calculateDimension: () => ({ width: 0 }) });
  drawU(ug);
  return ug.getSvgString().match(/<polygon [^>]*\/>/)?.[0] ?? '';
}

describe('ExtremityFactoryExtends', () => {
  it('points down at the section end for angle PI/2 (MyElkEdge.java:209)', () => {
    const decor = new ExtremityFactoryExtends(WHITE).createUDrawable(ORIGIN, Math.PI / 2, null);
    const svg = polygonOf((ug) => decor.drawU(ug.apply(new Fore('#181818')).apply(new UTranslate(32.681, 100))));
    expect(svg).toBe(
      '<polygon points="32.681,100,39.681,81,25.681,81,32.681,100" fill="#FFF" style="stroke:#181818;stroke-width:1;stroke-linejoin:miter;stroke-miterlimit:10;"/>',
    );
  });

  it('points up at the section start for angle -PI/2 (MyElkEdge.java:210)', () => {
    const decor = new ExtremityFactoryExtends(WHITE).createUDrawable(ORIGIN, -Math.PI / 2, null);
    const svg = polygonOf((ug) => decor.drawU(ug.apply(new UTranslate(32.681, 60))));
    expect(svg).toContain('points="32.681,60,25.681,79,39.681,79,32.681,60" fill="#FFF"');
  });

  it('fills with the factory background colour', () => {
    const decor = new ExtremityFactoryExtends('#FF0000').createUDrawable(ORIGIN, Math.PI / 2, null);
    expect(polygonOf((ug) => decor.drawU(ug))).toContain('fill="#F00"');
  });
});

describe('ExtremityExtends', () => {
  it('builds its polygon at p1, rotated by manageround(angle) + PI/2 (ExtremityExtends.java:54-66)', () => {
    // angle 0: rotate PI/2 maps (-19, -7) to (7, -19) and (-19, 7) to (-7, -19)
    const decor = new ExtremityExtends(new XPoint2D(10, 20), 0, WHITE);
    expect(polygonOf((ug) => decor.drawU(ug))).toContain('points="10,20,17,1,3,1,10,20"');
  });

  it('does not rotate at theta 0 (UPolygon.java:113-115)', () => {
    const decor = new ExtremityExtends(new XPoint2D(0, 0), -Math.PI / 2, WHITE);
    expect(polygonOf((ug) => decor.drawU(ug))).toContain('points="0,0,-19,-7,-19,7,0,0"');
  });

  it('snaps an angle within 0.05 degrees of a right angle (Extremity.java:44)', () => {
    const nearlyZero = new ExtremityExtends(new XPoint2D(0, 0), 0.0005, WHITE);
    expect(polygonOf((ug) => nearlyZero.drawU(ug))).toContain('points="0,0,7,-19,-7,-19,0,0"');
  });

  it('is 18 long (ExtremityExtends.java:73-76)', () => {
    expect(new ExtremityExtends(ORIGIN, 0, WHITE).getDecorationLength()).toBe(18);
  });
});
