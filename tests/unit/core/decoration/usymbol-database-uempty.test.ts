/**
 * cdd3-T31 (C-8): `USymbolDatabase#drawDatabase` ends with
 * `ug.apply(new UTranslate(width, height)).draw(new UEmpty(10, 10))`
 * (`decoration/symbol/USymbolDatabase.java:77`), which
 * `LimitFinder#drawEmpty` (`klimt/drawing/LimitFinder.java:159-162`) counts:
 * the ink walk reaches 10px right of and below the cylinder.
 */
import { describe, it, expect } from 'vitest';
import { drawDatabase } from '../../../../src/core/decoration/symbol/USymbolDatabase.js';
import { LimitFinder } from '../../../../src/core/klimt/drawing/LimitFinder.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { WidthTableMeasurer } from '../../../../src/core/measurer.js';

describe('drawDatabase — trailing UEmpty(10, 10) (USymbolDatabase.java:77)', () => {
  it('extends the LimitFinder extent to (width + 10, height + 10)', () => {
    const finder = LimitFinder.create(new MeasurerStringBounder(new WidthTableMeasurer()), false);
    drawDatabase(finder, 80, 50, 0);
    expect([finder.getMinX(), finder.getMinY(), finder.getMaxX(), finder.getMaxY()]).toEqual([0, 0, 90, 60]);
  });
});
