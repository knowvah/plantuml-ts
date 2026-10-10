/**
 * isw-T2c-stereo: `hide|show <<p>> ...` compares `gender.equals(label)` with
 * the raw DOUBLE_COMPARATOR label (EntityGenderUtils.java:68-82,
 * CucaDiagram.java:608-616; `manageGuillemetStrict` is the identity for
 * DOUBLE_COMPARATOR, Guillemet.java:87-89), so padding is significant:
 * `hide << y >>` hides a `<< y >>` stereotype but `hide << x >>` does not
 * hide `<<  x  >>`. Jar renders: tests/fixtures/isw-T2c-stereo/class-*.svg.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { rawStereotypeLabels } from '../../../src/diagrams/class/class-stereotype.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = new URL('../../fixtures/isw-T2c-stereo/', import.meta.url);

function diffsFor(name: string): unknown[] {
  const puml = readFileSync(new URL(`${name}.puml`, DIR), 'utf8');
  const jar = readFileSync(new URL(`${name}.svg`, DIR), 'utf8');
  const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic').diffs;
}

describe('rawStereotypeLabels', () => {
  it('keeps the source padding of every <<...>> run', () => {
    expect(rawStereotypeLabels('  x  ')).toEqual(['<<  x  >>']);
    expect(rawStereotypeLabels(' y ')).toEqual(['<< y >>']);
    expect(rawStereotypeLabels('A >><< B')).toEqual(['<<A >>', '<< B>>']);
  });
});

describe('hide/show <<pattern>> compares the raw label', () => {
  it.each(['class-hide-portion', 'class-hide-gender'])('%s matches the jar', (name) => {
    expect(diffsFor(name)).toEqual([]);
  });
});
