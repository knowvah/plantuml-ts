/**
 * Authored fixture for add4-T1e's end-decoration residual. Upstream's
 * `ConnectionVerticalThenHorizontal` (`FtileSwitchWithManyLinks.java
 * :159-187`) picks `asToDown()` whenever the case's exit x lies within
 * diamond2's `[ptD.x, ptB.x]`, and the last segment `(x1, y2) -> ptA` may
 * then be a few px LONG and horizontal. `Worm#drawInternalOneColor` draws
 * that fixed polygon (`Worm.java:161-168`). Our edge carries no decoration
 * direction, so `terminalDecorationVector` reads RIGHT/LEFT off the short
 * horizontal segment: the arrowhead points the wrong way and its 8 px Y
 * box lets the compressor take 6 px the jar keeps.
 *
 * Owner: the push site, which already computes `direction`
 * (`switch-connection-points.ts#verticalThenHorizontalPoints`) and drops
 * it; it needs an `ActivityEdgeGeo` end-decoration field. These are
 * `it.fails` until then.
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

  it.fails('draws asToDown, not a horizontal arrowhead (end-decoration field missing)', () => {
    expect(ours).toContain(JAR_DOWN_TIP);
  });

  it.fails('canvas height matches the jar (301; ours 295)', () => {
    expect(svgAttr(ours, 'height')).toBe(svgAttr(golden, 'height'));
  });
});
