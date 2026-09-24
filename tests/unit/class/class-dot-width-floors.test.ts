/**
 * cdd2-T11 (Q-1) — the header is laid out on the FINAL box width.
 *
 * `EntityImageClass#calculateDimensionSlow` floors the width by
 * `minClassWidth`, then `paramSameClassWidth`, then `getKalWidth() * 1.3`
 * (`svek/image/EntityImageClass.java:104-113`), and `drawU` hands that final
 * width to the header (`:182,238`) -> `HeaderLayout#drawU(ug, width, height)`
 * (`svek/HeaderLayout.java:81-117`), whose `suppWith = width - circle -
 * name - generic` slack is split `h1`/`h2` around the badge and the name.
 *
 * Every expected value is read off `baneru-00-kuro607`'s cached oracle
 * `in.svg` (never fitted): `class1` is widened by its `Qualifier` Kal to
 * `72.995` (= `56.15 * 1.3`) from its own `71.725`, and jar draws its badge
 * at `cx=22.572` and its name at `x=36.698`, box at `x=7` — i.e. badge
 * indent `15.572` and name indent `29.698` (`suppWith = 1.27`,
 * `h2 = 0.127`, `h1 = 0.5715`; jar prints 3 decimals). `class2`, un-widened, keeps `15`/`29`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { widenMeasuredClassifier } from '../../../src/diagrams/class/class-layout-generic-classifier.js';
import type { MeasuredClassifier } from '../../../src/diagrams/class/class-layout-helpers.js';

const measurer = new WidthTableMeasurer();

function leafRows(slug: string, id: string) {
  const markup = readFileSync(`test-results/dot-cache/class/${slug}/in.puml`, 'utf8');
  const leaf = layoutFixtureClass(markup, measurer).geo.leaves.find((l) => l.id === id);
  if (leaf === undefined || !('rows' in leaf)) throw new Error(`no classifier ${id} in ${slug}`);
  return { width: leaf.width, row: leaf.rows[0]! };
}

describe('applyKalWidthFloor re-runs HeaderLayout on the widened box (baneru-00-kuro607)', () => {
  it('widens class1 to the Kal floor 72.995 (EntityImageClass.java:113)', () => {
    expect(leafRows('baneru-00-kuro607', 'class1').width).toBeCloseTo(72.995, 6);
  });

  it('re-centres the badge on the final width: jar cx 22.572 - x 7 (HeaderLayout.java:98-101)', () => {
    expect(leafRows('baneru-00-kuro607', 'class1').row.badgeIndent).toBeCloseTo(15.5715, 6);
  });

  it('re-centres the name on the final width: jar x 36.698 - x 7 (HeaderLayout.java:108-110)', () => {
    expect(leafRows('baneru-00-kuro607', 'class1').row.indent).toBeCloseTo(29.6985, 6);
  });

  it('leaves the un-widened class2 at zero slack (jar badge 22.14, name 36.14, x 7.14)', () => {
    const { row } = leafRows('baneru-00-kuro607', 'class2');
    expect(row.badgeIndent).toBeCloseTo(15, 6);
    expect(row.indent).toBeCloseTo(29, 6);
  });
});

describe('widenMeasuredClassifier — a box with no header layout to redo', () => {
  it('only takes the new width when measureGenericClassifier did not build it', () => {
    const rows: MeasuredClassifier['rows'] = [{ text: 'x', y: 9, indent: 4, italic: false }];
    const m: MeasuredClassifier = { width: 40, height: 20, rows, dividerYs: [] };
    widenMeasuredClassifier(m, 72.995);
    expect(m).toEqual({ width: 72.995, height: 20, rows, dividerYs: [] });
  });
});
