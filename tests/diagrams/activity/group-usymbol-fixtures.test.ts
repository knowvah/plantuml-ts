/**
 * add4-T2b (GROUP-USYMBOL, `somome-34-nori033`): each container keyword
 * draws its own `USymbol` (`CommandPartition3.java:89-106`). Each
 * `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 *
 * add4-T2g: `card` and `package` are jar-exact too. The jar's `LimitFinder`
 * pads a `UPolygon` (the package folder) by `HACK_X_FOR_POLYGON = 10` on X
 * (`klimt/drawing/LimitFinder.java:169-177`) and reads a `ULine`'s end (the
 * card's full-width hline) exactly (`:179-182`) where a `URectangle` stops
 * 1 px short (`:184-188`); `layout/canvas-origin-fudge.ts#compositeFudge` ports it.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2b');

describe('container USymbols render jar-exact', () => {
  for (const name of ['partition-alone', 'rectangle-alone', 'card-alone', 'package-alone']) {
    it(`${name} renders jar-exact`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
    });
  }
});
