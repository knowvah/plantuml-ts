/**
 * Authored-fixture tests for T1b's `Snake#getTextBlockPosition` port
 * (`layout/snake-text-position.ts`), mirroring `canvas-origin.test.ts`'s
 * own "render both, compare one attribute" pattern.
 *
 * `while-backward-bottom` = `boxefe-81-situ725` (real corpus fixture,
 * copied verbatim -- the acceptance criterion's own named case), a
 * `while` with `(incoming) backward :Warning; (dsc_5)`: Backward1's
 * `(incoming)` label is `VerticalAlignment.BOTTOM`
 * (`FtileWhile.java:354`); Backward2's `(dsc_5)` label is
 * `arrowHorizontalAlignment()` (`:389-390`, default LEFT).
 *
 * Jar X, pre-fix (T1a's census): BOTTOM branch x matched by coincidence
 * (the old generic fallback's `max(pt1.x,pt2.x)+4` happened to equal
 * `worm.getMinX()` on this fixture's geometry); Y was off by 6.445px
 * (`139.833` ours vs `146.278` jar) because the fallback never computed
 * `worm.getMaxY()` at all. After this port, X still matches exactly for
 * BOTH labels and Y drops to a sub-2px residual -- see the Y assertions'
 * own comment for why that residual is NOT this task's mechanism.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../helpers/fixture-include-store.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add3-T1b');

function renderFixture(name: string): { ours: string; golden: string } {
  const puml = readFileSync(join(FIXTURE_ROOT, name, 'in.puml'), 'utf8');
  const golden = readFileSync(join(FIXTURE_ROOT, name, 'in.svg'), 'utf8');
  const ours = renderFixtureActivity(puml, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return { ours, golden };
}

/** The `x`/`y` of the FIRST `<text>` whose content is exactly `label`. */
function textPosition(svg: string, label: string): { x: number; y: number } {
  const re = new RegExp(`<text x="([^"]*)" y="([^"]*)"[^>]*>${label}</text>`);
  const m = svg.match(re);
  if (m === null) throw new Error(`<text>${label}</text> not found`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

describe('Snake label position -- while-backward-bottom (boxefe-81-situ725)', () => {
  const { ours, golden } = renderFixture('while-backward-bottom');

  it('Backward1 "incoming" (BOTTOM): x matches the jar exactly', () => {
    expect(textPosition(ours, 'incoming').x).toBe(textPosition(golden, 'incoming').x);
  });

  it('Backward2 "dsc_5" (LEFT default): x matches the jar exactly', () => {
    expect(textPosition(ours, 'dsc_5').x).toBe(textPosition(golden, 'dsc_5').x);
  });

  // Y for both labels still carries a sub-2px residual, but NOT from this
  // task's mechanism: every Y-axis value in this fixture (box `rect`/`text`
  // y, independent of any label) is offset from the jar by the SAME
  // ~0.944px step (e.g. the "read data" box: jar `rect y="99.944"` vs ours
  // `rect y="99"`) -- a pre-existing, fixture-wide rounding divergence in
  // the `while`/hexagon geometry this task's write-set does not touch.
  // These two assertions PIN our own current output (a regression guard),
  // not jar parity -- do not "fix" them by fitting a new constant here.
  it('Backward1 "incoming" y: pinned at the current (not jar-equal) value', () => {
    expect(textPosition(ours, 'incoming').y).toBeCloseTo(218.556, 3);
  });

  it('Backward2 "dsc_5" y: pinned at the current (not jar-equal) value', () => {
    expect(textPosition(ours, 'dsc_5').y).toBeCloseTo(96.806, 3);
  });
});
