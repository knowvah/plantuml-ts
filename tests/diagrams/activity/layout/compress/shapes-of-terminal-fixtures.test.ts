/**
 * Authored fixture for add4-T1e's end-decoration residual. Upstream's
 * `ConnectionVerticalThenHorizontal` (`FtileSwitchWithManyLinks.java
 * :159-187`) picks `asToDown()` whenever the case's exit x lies within
 * diamond2's `[ptD.x, ptB.x]`, and the last segment `(x1, y2) -> ptA` may
 * then be a few px LONG and horizontal. `Worm#drawInternalOneColor` draws
 * that fixed polygon (`Worm.java:161-168`). add4-T1f (R1): the push site
 * now carries that `direction` as `ActivityEdgeGeo.endDirection`
 * (`switch-connection-points.ts#verticalThenHorizontalPoints`), read by
 * `shapes-of-terminal.ts#edgeDecorationVector` in both the renderer and
 * the compressor.
 *
 * `zero-length-down/in.svg` is the jar's render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture, svgAttr } from '../../../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../../fixtures/activity/add4-T1e');

/** The jar's asToDown tip at diamond2's north point (93.35, 205). */
const JAR_DOWN_TIP = '<polygon points="89.35,195,93.35,205,97.35,195,93.35,199"';

describe('switch V-then-H DOWN branch with a short last segment', () => {
  const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'zero-length-down');

  it('the golden draws asToDown at diamond2 north', () => {
    expect(golden).toContain(JAR_DOWN_TIP);
  });

  it('canvas width already matches the jar', () => {
    expect(svgAttr(ours, 'width')).toBe(svgAttr(golden, 'width'));
  });

  it('draws asToDown, not a horizontal arrowhead (end-decoration field)', () => {
    expect(ours).toContain(JAR_DOWN_TIP);
  });

  it('canvas height matches the jar (301)', () => {
    expect(svgAttr(ours, 'height')).toBe(svgAttr(golden, 'height'));
  });
});
