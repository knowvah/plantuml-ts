/**
 * codd-T7b T6-D part 2: `AtomText#calculateDimensionSlow` clamps a run's height to 10
 * (`if (h < 10) h = 10`) while `AtomText#drawU` places the baseline at the UNCLAMPED
 * `rect.getHeight() - descent`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:179-181,215
 */
import { describe, expect, test } from 'vitest';
import { buildTextBlock, measureLine } from '../../../../../src/core/svek/image/EntityImageDescriptionSupport.js';
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

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

function textYs(svg: string): number[] {
  return [...svg.matchAll(/<text[^>]* y="([-\d.]+)"/g)].map((m) => Number(m[1]));
}

function fontOfSize(size: number): FontConfiguration {
  return { family: 'sans-serif', size, color: '#000000', styles: new Set() };
}

const MIN_RUN_HEIGHT = 10;

describe('AtomText 10px minimum run height (T6-D)', () => {
  test('a 6px run measures 10 high', () => {
    const ug = newGraphic();
    const dim = buildTextBlock('Foo', fontOfSize(6), HorizontalAlignment.LEFT).calculateDimension(
      ug.getStringBounder(),
    );
    expect(dim.getHeight()).toBe(MIN_RUN_HEIGHT);
  });

  test('the baseline of that run is the unclamped height minus descent', () => {
    const ug = newGraphic();
    buildTextBlock('Foo', fontOfSize(6), HorizontalAlignment.LEFT).drawU(ug);
    expect(textYs(ug.getSvgString())[0]).toBeCloseTo(6 - 6 / 4.5, 3);
  });

  test('a run already above 10 is unchanged', () => {
    const ug = newGraphic();
    const dim = buildTextBlock('Foo', fontOfSize(14), HorizontalAlignment.LEFT).calculateDimension(
      ug.getStringBounder(),
    );
    expect(dim.getHeight()).toBe(14);
  });

  test('measureLine reports the clamped height and keeps the raw one for the baseline', () => {
    const m = measureLine(newGraphic().getStringBounder(), 'Foo', fontOfSize(6));
    expect(m.height).toBe(MIN_RUN_HEIGHT);
    expect(m.rawHeight).toBe(6);
  });
});
