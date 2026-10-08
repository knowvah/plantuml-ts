/**
 * add4-T3c: `FtileGroup#getInnerDimensionSlow` (`FtileGroup.java:178-186`)
 * widens the frame by `missingWidth + 5` when the inner tile's
 * `LimitFinder` ink (`getInnerMinMax`, `:150-158`) overruns its declared
 * width. A while's emphasized back-connector arrowhead (`FtileWhile.java:
 * 262-268`, `ArrowsRegular.java:42-53`) padded by `HACK_X_FOR_POLYGON`
 * (`LimitFinder.java:169-177`) reaches `width + 14`. Goldens rendered
 * through `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../helpers/activity-text-position.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { resolveTheme } from '../../../src/core/theme.js';
import type { StringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import { tileNodes } from '../../../src/diagrams/activity/layout/tile-layout.js';
import { GtileTopDown } from '../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { groupInnerInkMaxX } from '../../../src/diagrams/activity/layout/canvas-origin-group-ink.js';

const measurer = new FormulaMeasurer();
const theme = resolveTheme('default');
const bounder: StringBounder = {
  getDimension: (text: string, fontSizePt: number) =>
    measurer.measure(text, { family: theme.fontFamily, size: fontSizePt }),
};
/** `ArrowsRegular.delta2` (`ArrowsRegular.java:43`) + `HACK_X_FOR_POLYGON`
 *  (`LimitFinder.java:169`). */
const WHILE_INK_OVERRUN = 4 + 10;

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T3c');

describe('FtileGroup#getInnerDimensionSlow', () => {
  it.each([
    ['partition-while', 'a bare while: frame = orig + 14 - 10 + 5'],
    ['group-while-labels', 'the group keyword, while with is/endwhile labels'],
    ['partition-while-backward', 'a while with a backward action'],
    ['partition-while-wide-title', 'a title wider than the widened body'],
    ['partition-repeat', 'a repeat, whose ink stays inside its width'],
  ])('%s: %s, equal to the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});

describe('groupInnerInkMaxX', () => {
  it('a while body inks its emphasized back arrowhead at width + 14', () => {
    const tiles = tileNodes(
      [{ kind: 'while', condition: 't', body: [{ kind: 'action', label: 'x' }] }],
      bounder,
      theme,
    ).tiles;
    const body = new GtileTopDown(tiles, bounder, theme);
    expect(groupInnerInkMaxX(body, theme)).toBe(body.width + WHILE_INK_OVERRUN);
  });

  it('an empty body draws nothing: undefined, never the margin', () => {
    expect(groupInnerInkMaxX(new GtileTopDown([], bounder, theme), theme)).toBeUndefined();
  });
});
