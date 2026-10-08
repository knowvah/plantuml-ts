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
      expect(jar).toEqual([
        '64,55,88,55,100,67,88,79,64,79,52,67,64,55',
        '76,153,76,153,88,165,76,177,76,177,64,165,76,153',
      ]);
      expect(diamondPoints(ours)).toEqual(jar);
    });
  }
});
