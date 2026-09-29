/**
 * cdd6 T3f (nuveji (b)): `UHorizontalLine#drawTitleInternal`'s `clearArea`
 * arm -- `if (clearArea) ug.apply(getStroke()).draw(URectangle.build(dimTitle));`
 * BEFORE `title.drawU(ug)`, at the title's own translate
 * (`klimt/shape/UHorizontalLine.java:154-166`). Only `USymbolDatabase.java:111`
 * / `USymbolNode.java:116` pass `true`.
 */
import { describe, expect, it } from 'vitest';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { UHorizontalLine } from '../../../../../src/core/klimt/shape/UHorizontalLine.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../../../src/core/klimt/shape/URectangle.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import { Back } from '../../../../../src/core/klimt/Back.js';

const bounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: text.length * font.size * 0.5 };
  },
};

const TITLE_W = 40;
const TITLE_H = 14;
/** A title whose own drawing is a 1x1 marker rect, so draw order is visible. */
const title = {
  calculateDimension: () => new XDimension2D(TITLE_W, TITLE_H),
  drawU: (g: UGraphic) => g.draw(URectangle.build(1, 1)),
};

function drawTitle(style: string, clearArea: boolean): string {
  const ug = UGraphicSvg.build(0, basicSvgOption(), '$version$', bounder);
  const painted = ug.apply(new Fore('#181818')).apply(new Back('#F1F1F1'));
  UHorizontalLine.infinite(1, 0, 0, style, title).drawTitleInternal(painted, 0, 100, 20, clearArea);
  return ug.getSvgString();
}

describe('UHorizontalLine#drawTitleInternal clearArea', () => {
  it('draws the title-sized pre-clear rect at the title origin, before the title, with the dotted stroke', () => {
    const svg = drawTitle('.', true);
    // x1 = (100 - 40) / 2 = 30; y1 = 20 - 14 / 2 - 0.5 = 12.5
    const clear = svg.indexOf('<rect x="30" y="12.5" width="40" height="14"');
    const marker = svg.indexOf('width="1" height="1"');
    expect(clear).toBeGreaterThan(-1);
    expect(marker).toBeGreaterThan(clear);
    expect(svg.slice(clear, marker)).toContain('fill="#F1F1F1" style="stroke:#181818;stroke-width:1;stroke-dasharray:1,2;"');
  });

  it('draws no pre-clear rect when clearArea is false', () => {
    const svg = drawTitle('.', false);
    expect(svg).not.toContain('width="40"');
    expect(svg).toContain('<rect x="30" y="12.5" width="1" height="1"');
  });
});
