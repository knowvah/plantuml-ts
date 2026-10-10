/**
 * isw-T2c-stereo: jar fixtures for stereotype padding on json declarations
 * (StereotypePattern.java:68 keeps the label untrimmed).
 * Each fixture's .svg is a one-JVM jar render of the sibling .puml.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = new URL('../../fixtures/isw-T2c-stereo/', import.meta.url);

function diffsFor(name: string): unknown[] {
  const puml = readFileSync(new URL(`${name}.puml`, DIR), 'utf8');
  const jar = readFileSync(new URL(`${name}.svg`, DIR), 'utf8');
  const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic').diffs;
}

describe('isw-T2c-stereo jar fixtures', () => {
  it.each(['json-stereotype', 'json-stereotype-oneline'])('%s matches the jar', (name) => {
    expect(diffsFor(name)).toEqual([]);
  });
});
