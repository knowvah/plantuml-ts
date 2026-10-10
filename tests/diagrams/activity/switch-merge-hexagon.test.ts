/**
 * add4-T2d (SWITCH-GEOM merge hexagon): both switch diamonds are
 * `FtileDiamondInside` (`FtileFactoryDelegatorSwitch.java:147,159-160`),
 * whose `drawU` always draws `Hexagon.asPolygon(shadowing, width, height)`
 * (`FtileDiamondInside.java:89-90`, `Hexagon.java:65-74`): 7 points, even
 * over diamond2's `TextBlockUtils.empty(0, 0)` label and whatever the
 * `ConditionStyle`. Each `<case>/in.svg` is the jar's own render
 * (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2d');

const DIAMOND_FILL = 'fill="#F1F1F1"';

function diamondPoints(svg: string): string[] {
  return [...svg.matchAll(/<polygon points="([^"]*)" ([^ ]*)/g)].filter((m) => m[2] === DIAMOND_FILL).map((m) => m[1]!);
}

describe('switch diamonds are FtileDiamondInside hexagons', () => {
  for (const name of ['switch-merge-default', 'switch-merge-inside', 'switch-merge-empty']) {
    it(`${name}: diamond1 and the 7-point merge hexagon equal the jar's`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      const jar = diamondPoints(golden);
      // isw-T2-act: the seam-#4 re-capture of `<case>/in.svg` (`case ( A )`'s
      // kept spaces now measure 3.3 each, shifting the column 3.3 right).
      expect(jar).toEqual([
        '67.3,55,91.3,55,103.3,67,91.3,79,67.3,79,55.3,67,67.3,55',
        '79.3,153,79.3,153,91.3,165,79.3,177,79.3,177,67.3,165,79.3,153',
      ]);
      expect(diamondPoints(ours)).toEqual(jar);
    });
  }
});
