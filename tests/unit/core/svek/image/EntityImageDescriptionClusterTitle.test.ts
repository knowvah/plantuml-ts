/**
 * codd-T7b T6-F: a group title goes through the real creole `Display#create` path, so a `----` separator
 * (stencilled `UHorizontalLine`) and the lines after it survive, and an anonymous group measures 0x0.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java:128
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/SheetBlock2.java:99
 */
import { describe, expect, test } from 'vitest';
import { buildClusterTitle } from '../../../../../src/core/svek/image/EntityImageDescriptionClusterTitle.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../../../../src/core/klimt/shape/UText.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();
const driverBounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: measurer.measure(text, font).width };
  },
};
const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

describe('buildClusterTitle (T6-F)', () => {
  test('an anonymous group measures 0x0', () => {
    const dim = buildClusterTitle('', FONT, HorizontalAlignment.CENTER).calculateDimension(
      newGraphic().getStringBounder(),
    );
    expect([dim.getWidth(), dim.getHeight()]).toEqual([0, 0]);
  });

  test('a separator keeps the line after it and draws one <line>', () => {
    const ug = newGraphic();
    buildClusterTitle('Foo\nx\n----\ny', FONT, HorizontalAlignment.CENTER).drawU(ug);
    const svg = ug.getSvgString();
    expect([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1])).toEqual(['Foo', 'x', 'y']);
    expect(svg.match(/<line /g)?.length).toBe(1);
  });

  test('a plain one-line title keeps its single text', () => {
    const ug = newGraphic();
    buildClusterTitle('Some Group', FONT, HorizontalAlignment.LEFT).drawU(ug);
    expect([...ug.getSvgString().matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1])).toEqual(['Some Group']);
  });
});
