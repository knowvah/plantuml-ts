/**
 * EntityImageDescriptionTextBlock.test.ts — cdd3-T8 (R-LEAF task, daxeno
 * residual): `buildTextBlock`'s per-line descent must come from the LINE's
 * own drawn run(s) (`measureAtomsWidthHeight`'s per-atom `font`), not the
 * line's BASE font unconditionally — a `<size:N>` creole run overrides the
 * GLYPH size drawn but, pre-fix, left the baseline math computed off the
 * un-overridden base font, producing a wrong `<text>` `y`.
 *
 * Jar-verified (`daxeno-00-kasu166`'s `<<Database>>` package cluster
 * title, `"<size:18>styled2</size>\nshould be styled"` at a 14px bold base
 * font): pre-fix `text[1]/@y` measured 42.889 against the jar's 42 (Δ0.889
 * == 18/4.5 − 14/4.5, the run's OWN descent minus the base font's) while
 * `text[2]/@y` (no size override) already matched exactly. This suite
 * reproduces the same shape with `DeterministicMeasurer` (`WidthTableMeasurer`,
 * the SAME `getDescent(font) = font.size / 4.5` formula the oracle corpus
 * measures under, `measurer.ts#WidthTableMeasurer.getDescent`) so the
 * expected numbers are exact, not tolerant.
 *
 * @see EntityImageDescriptionSupport.test.ts for the `newGraphic()`/
 * `UGraphicSvg` + `DeterministicMeasurer` pattern this file follows.
 */
import { describe, expect, test } from 'vitest';
import { buildTextBlock } from '../../../../../src/core/svek/image/EntityImageDescriptionSupport.js';
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

/** Same construction as `EntityImageDescriptionSupport.test.ts#newGraphic`
 *  (duplicated locally per this project's own "small enough to duplicate"
 *  precedent for this one-helper-per-file shape) -- the 5th `measurer` arg
 *  is what makes `ug.getStringBounder().getDescent` real instead of the
 *  `font.size / 4.5` fallback (`u-graphic-svg.ts#getStringBounder`). */
function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

function textYs(svg: string): number[] {
  return [...svg.matchAll(/<text[^>]* y="([-\d.]+)"/g)].map((m) => Number(m[1]));
}

const BASE_FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

describe('buildTextBlock — per-line descent (cdd3-T8, daxeno-00-kasu166)', () => {
  test('a line with NO size override measures descent from its own (== base) font, unaffected by the fix', () => {
    const ug = newGraphic();
    buildTextBlock('Foo', BASE_FONT, HorizontalAlignment.LEFT).drawU(ug);
    const [y1] = textYs(ug.getSvgString());
    // height(14) - descent(14/4.5) -- the single-run common case, byte
    // identical before and after this task (its atom's own font IS the
    // base font either way).
    expect(y1).toBeCloseTo(14 - 14 / 4.5, 3);
  });

  test("a `<size:18>` first line uses ITS OWN 18px descent, not the 14px base font's (daxeno mechanism)", () => {
    const ug = newGraphic();
    buildTextBlock('<size:18>styled2</size>\nshould be styled', BASE_FONT, HorizontalAlignment.CENTER).drawU(ug);
    const [y1, y2] = textYs(ug.getSvgString());
    // Line 1: height 18 (the run's OWN size), descent 18/4.5 (the run's
    // OWN font -- the fix). Pre-fix this measured 18 - 14/4.5 = 14.889,
    // a full 0.889 (== 18/4.5 - 14/4.5) too low -- exactly daxeno's Δ.
    expect(y1).toBeCloseTo(18 - 18 / 4.5, 3);
    // Line 2: base font (14px) throughout, unaffected -- cursor advances
    // by line 1's RAW height (18, `lineCursorAdvance`), then adds its own
    // baselineDy (14 - 14/4.5).
    expect(y2).toBeCloseTo(18 + (14 - 14 / 4.5), 3);
  });
});
