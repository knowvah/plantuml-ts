/**
 * add4-T2d (CONDSTYLE-EMPTY, `xefalo-73-sabi101`): under `ConditionStyle
 * diamond` the test text is `FtileDiamond`'s north label, so diamond1's own
 * inY is that label's height (`FtileDiamond.java:108-111`). The if's in point
 * carries it: `FtileIfWithDiamonds.java:179-191` (`dim1.appendBottom(...)
 * .incInY(yDeltaNote)`) and `FtileIfDown.java:568-571` (`geoDiamond1.getInY()
 * + opaleHeight`). Each `<case>/in.svg` is the jar's own render
 * (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2d');

describe('EMPTY_DIAMOND if: the in-arrow ends at the rhombus, below the north label', () => {
  for (const name of ['empty-if-else', 'empty-if-down']) {
    it(`${name} renders jar-exact`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
    });
  }
});
