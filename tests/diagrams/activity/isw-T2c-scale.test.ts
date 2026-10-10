/**
 * isw-T2c-scale: a scaled activity document formats every number ONCE,
 * after the scale. Upstream draws the whole document through one
 * `UGraphic` whose `SvgGraphics#format` multiplies by `option.getScale()`
 * and then prints `%.3f` (`klimt/drawing/svg/SvgGraphics.java:468-475`):
 * `fround(20.83125) * 1.5` prints `31.247`, where scaling the already
 * printed `20.831` gives `31.246`. `scale-text-length` (one-JVM jar render,
 * `scripts/oracle-render.sh`, seam #4) carries such a run in the body and
 * a title through the chrome.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2c-scale');
const markup = readFileSync(join(FIXTURES, 'scale-text-length.puml'), 'utf8');
const golden = readFileSync(join(FIXTURES, 'scale-text-length.svg'), 'utf8');

describe('scaled activity numbers are formatted once (jar oracle)', () => {
  it('scale-text-length renders equal to the jar (harness)', () => {
    const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
    expect(compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path)).toEqual([]);
  });

  it('scale-text-length renders equal to the jar (renderSync)', () => {
    const ours = renderSync(markup, { measurer: new DeterministicMeasurer() });
    expect(compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path)).toEqual([]);
  });

  it('prints the jar textLength 31.247, not the twice-rounded 31.246', () => {
    const ours = renderSync(markup, { measurer: new DeterministicMeasurer() });
    expect(ours).toContain('textLength="31.247"');
    expect(ours).not.toContain('textLength="31.246"');
  });
});
