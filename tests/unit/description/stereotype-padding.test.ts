/**
 * isw-T2c-stereo: description-engine stereotype padding and hide/show
 * matching against one-JVM jar renders (tests/fixtures/isw-T2c-stereo/).
 *
 * - StereotypePattern.java:68 captures `<<.+?>>` untrimmed; Guillemet/
 *   Stereotype consume ONE padding space per side, so `<<  spaced  >>` draws
 *   `« spaced »`.
 * - `hide <<p>> stereotype` compares `gender.equals(label)` against the
 *   DOUBLE_COMPARATOR labels (CucaDiagram.java:608-616), where
 *   `manageGuillemetStrict` is the identity (Guillemet.java:87-89): the raw
 *   `<<...>>` run, padding included.
 * - Entity-level `hide <<p>>` trims p and matches `getMultipleLabels`
 *   (HideOrShow.java:60-85, Stereotype.java:122-133).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { extractNodeStereotype, stripUrl } from '../../../src/diagrams/description/parse-helpers-strings.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = new URL('../../fixtures/isw-T2c-stereo/', import.meta.url);

function diffsFor(name: string): unknown[] {
  const puml = readFileSync(new URL(`${name}.puml`, DIR), 'utf8');
  const jar = readFileSync(new URL(`${name}.svg`, DIR), 'utf8');
  const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic').diffs;
}

describe('description stereotype padding', () => {
  it('keeps the padding beyond one space per side', () => {
    expect(extractNodeStereotype('<<  spaced  >>')?.stereotypes).toEqual([' spaced ']);
    expect(extractNodeStereotype('<< one >>')?.stereotypes).toEqual(['one']);
  });

  it('stripUrl copies a stereotype run verbatim and still collapses other gaps', () => {
    expect(stripUrl('Cmp  <<  st  >>   #red')).toBe('Cmp <<  st  >> #red');
  });

  it.each(['description-stereotype', 'description-hide-portion', 'description-hide-entity'])(
    '%s matches the jar',
    (name) => {
      expect(diffsFor(name)).toEqual([]);
    },
  );
});
