/**
 * unwind-U4 (1): the default element skin is the jar's, not a divergence.
 *
 * Upstream: `resources/skin/plantuml.skin:2,17` (`root { --common-background:
 * #f1f1f1; ... BackGroundColor: var(--common-background) }`), `:16`
 * (`LineColor #181818`), `:3,324` (`note { BackGroundColor:
 * var(--note-background) }` = `#FEFFDD`). The legacy `#FEFECE`
 * (`klimt/color/HColors.java:95`, `MY_YELLOW`) is never drawn for these
 * defaults by the pinned jar. Each fixture under
 * `tests/fixtures/unwind-U4/skin/` carries its jar render
 * (`scripts/oracle-render.sh`) beside it.
 *
 * `component`/`usecase` carry a package/rectangle CLUSTER geometry residual
 * (a 5 px y offset on the cluster's own label band) unrelated to paint; for
 * those two the assertion is "no paint attribute differs", the others are
 * full structural+numeric equality.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, type Diff } from './compare.js';

const DIR = 'tests/fixtures/unwind-U4/skin';
const PAINT_ATTR = /@(fill|stroke|style)\b/;

function compareFixture(name: string): Diff[] {
  const markup = readFileSync(join(DIR, `${name}.puml`), 'utf8');
  const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
  const ours = renderSync(markup, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic').diffs;
}

describe('unwind-U4 default element skin matches the jar', () => {
  it.each(['class', 'object', 'state', 'note'])('%s renders equal to the jar', (name) => {
    expect(compareFixture(name)).toEqual([]);
  });

  it.each(['component', 'usecase'])('%s: no fill/stroke/style differs from the jar', (name) => {
    const diffs = compareFixture(name);
    expect(diffs.filter((d) => PAINT_ATTR.test(d.path))).toEqual([]);
    expect(diffs.filter((d) => /\[childCount\]$/.test(d.path))).toEqual([]);
  });

  it('jar fixtures draw #F1F1F1 elements and a #FEFFDD note, never #FEFECE', () => {
    const jarNote = readFileSync(join(DIR, 'note.svg'), 'utf8');
    const jarClass = readFileSync(join(DIR, 'class.svg'), 'utf8');
    expect(jarNote).toContain('fill="#FEFFDD"');
    expect(jarClass).toContain('fill="#F1F1F1"');
    expect(jarClass + jarNote).not.toContain('#FEFECE');
  });
});
