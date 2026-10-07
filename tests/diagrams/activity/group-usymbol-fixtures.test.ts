/**
 * add4-T2b (GROUP-USYMBOL, `somome-34-nori033`): each container keyword
 * draws its own `USymbol` (`CommandPartition3.java:89-106`). Each
 * `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 *
 * `card`/`package` keep a canvas residual that is NOT in this task's files:
 * the jar's `LimitFinder` pads a `UPolygon` by `HACK_X_FOR_POLYGON = 10` on
 * X (`klimt/drawing/LimitFinder.java:169-177`) and reads a `ULine`'s end
 * exactly (`:179-182`) where a `URectangle` stops 1 px short (`:184-188`).
 * `layout/canvas-origin.ts#extendForNode` treats every frame as a rect.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2b');

describe('container USymbols render jar-exact', () => {
  for (const name of ['partition-alone', 'rectangle-alone']) {
    it(`${name} renders jar-exact`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
    });
  }

  it('card differs only in the canvas width (ULine end, LimitFinder.java:179-188)', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'card-alone');
    const paths = compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
    expect(paths).toEqual(['svg/@viewBox[2]', 'svg/@width']);
  });

  it('package body matches; only the polygon canvas pad is missing (LimitFinder.java:169-177)', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'package-alone');
    const polygon = (svg: string): string => /<polygon points="([^"]*)"/.exec(svg)![1]!;
    const shift = (pts: string): number[] => pts.split(',').map(Number);
    const jar = shift(polygon(golden));
    const mine = shift(polygon(ours));
    // Same shape, translated by the 9 px the jar's polygon pad adds on the left.
    expect(mine.map((v, i) => (i % 2 === 0 ? v + 9 : v))).toEqual(jar);
  });
});
