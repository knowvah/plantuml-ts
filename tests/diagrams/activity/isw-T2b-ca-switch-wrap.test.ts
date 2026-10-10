/**
 * isw-T2b-ca: wrapped text measured as drawn. `switch-first-wrapped`
 * (one-JVM jar render, `scripts/oracle-render.sh`, seam #4) exercises:
 *
 * - the Y compression's edge-label box: a case label wrapped by
 *   `style.wrapWidth()` (`Branch.java:248-258`) occupies every drawn line
 *   (`LimitFinder.java:216-224`), so the space under its last line is kept;
 * - the canvas ink of the hexagon's own label: its first line's
 *   `LimitFinder` box reaches 0.944 px above the polygon at 11pt
 *   (`FtileDiamondInside.java:94-96`), which sets the canvas origin when
 *   the switch is the first element (the jar's polygon top is 15.944).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2b-ca');

describe('wrapped switch labels (jar oracle)', () => {
  it('switch-first-wrapped renders equal to the jar', () => {
    const markup = readFileSync(join(FIXTURES, 'switch-first-wrapped.puml'), 'utf8');
    const golden = readFileSync(join(FIXTURES, 'switch-first-wrapped.svg'), 'utf8');
    const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
    expect(compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path)).toEqual([]);
  });
});
